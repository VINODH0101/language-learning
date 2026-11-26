"""
Shared HTTP client for AI provider adapters.

No API keys are ever logged or persisted. Errors are classified into
``FailureCategory`` so the router can decide whether to fall back, back off,
or open the circuit breaker.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from ..provider import FailureCategory

logger = logging.getLogger(__name__)


class ProviderHttpError(Exception):
    """Raised by :func:`post_json` with a classified failure category."""

    def __init__(self, category: FailureCategory, message: str):
        super().__init__(message)
        self.category = category


def classify_http_status(code: int) -> FailureCategory:
    if code in (401, 403):
        return FailureCategory.AUTHENTICATION
    if code == 429:
        return FailureCategory.RATE_LIMIT
    if code >= 500:
        return FailureCategory.PROVIDER_UNAVAILABLE
    return FailureCategory.INVALID_RESPONSE


def post_json(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    payload: Optional[Dict[str, Any]] = None,
    timeout: float = 30.0,
) -> Dict[str, Any]:
    """Perform a JSON POST and return the parsed JSON object.

    Raises :class:`ProviderHttpError` on transport, HTTP, or decode errors.
    """
    data = json.dumps(payload if payload is not None else {}).encode("utf-8")
    req = Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    for key, value in (headers or {}).items():
        req.add_header(key, value)

    start = time.monotonic()
    try:
        with urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
            return json.loads(raw)
    except HTTPError as exc:
        category = classify_http_status(exc.code)
        raise ProviderHttpError(
            category, f"HTTP {exc.code} from {url}"
        ) from exc
    except (URLError, TimeoutError, OSError) as exc:
        elapsed = time.monotonic() - start
        category = (
            FailureCategory.TIMEOUT
            if elapsed >= timeout
            else FailureCategory.PROVIDER_UNAVAILABLE
        )
        raise ProviderHttpError(category, f"Network error from {url}: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise ProviderHttpError(
            FailureCategory.INVALID_RESPONSE, f"Malformed JSON from {url}"
        ) from exc


def parse_json_text(text: Optional[str]) -> Any:
    """Parse JSON out of a model text response (tolerates fenced blocks)."""
    if not text:
        return None
    stripped = text.strip()
    if stripped.startswith("```"):
        stripped = stripped.strip("`")
        first_brace = stripped.find("{")
        if first_brace == -1:
            first_brace = stripped.find("[")
        if first_brace != -1:
            stripped = stripped[first_brace:]
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        return None


def _resolve_ref(
    ref: str, defs: Dict[str, Any], common_defs: Optional[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    if ref == "common.json" and common_defs and isinstance(common_defs.get("meta"), dict):
        return common_defs["meta"]
    if ref.startswith("#/$defs/"):
        key = ref[len("#/$defs/"):]
        if key in defs and isinstance(defs[key], dict):
            return defs[key]
        if common_defs and key in common_defs and isinstance(common_defs[key], dict):
            return common_defs[key]
    return None


def _check_type(value: Any, expected_type: str) -> bool:
    if expected_type == "object":
        return isinstance(value, dict)
    if expected_type == "array":
        return isinstance(value, list)
    if expected_type == "string":
        return isinstance(value, str)
    if expected_type == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if expected_type == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if expected_type == "boolean":
        return isinstance(value, bool)
    return True


def validate_json_against_schema(
    data: Any,
    schema: Dict[str, Any],
    common_defs: Optional[Dict[str, Any]] = None,
    _path: str = "",
    _root_defs: Optional[Dict[str, Any]] = None,
) -> list[str]:
    """Validate JSON output against a JSON Schema (recursive subset).

    Supports ``type``, ``required``, ``properties``, ``items``, ``enum``,
    ``minLength``, ``minItems``, ``minimum``, and local/common ``$ref``.
    Returns a list of error strings (empty = valid).
    """
    if not isinstance(schema, dict):
        return ["schema must be an object"]

    defs = _root_defs if _root_defs is not None else schema.get("$defs", {})
    if "$ref" in schema:
        resolved = _resolve_ref(schema["$ref"], defs, common_defs)
        if resolved is not None:
            schema = resolved

    errors: list[str] = []
    prefix = f"{_path}: " if _path else ""
    expected_type = schema.get("type")

    if expected_type == "object" and not isinstance(data, dict):
        return [f"{prefix}output must be a JSON object"]
    if expected_type == "array" and not isinstance(data, list):
        return [f"{prefix}output must be a JSON array"]
    if isinstance(expected_type, str) and not _check_type(data, expected_type):
        return [f"{prefix}expected {expected_type}"]

    if "enum" in schema and data not in schema["enum"]:
        errors.append(f"{prefix}value must be one of {schema['enum']}")

    if isinstance(data, str) and "minLength" in schema and len(data) < schema["minLength"]:
        errors.append(f"{prefix}string shorter than minLength {schema['minLength']}")

    if isinstance(data, (int, float)) and not isinstance(data, bool) and "minimum" in schema:
        if data < schema["minimum"]:
            errors.append(f"{prefix}value below minimum {schema['minimum']}")

    if isinstance(data, dict):
        for field in schema.get("required", []):
            if field not in data:
                errors.append(
                    f"missing required field: {field}"
                    if not _path
                    else f"{_path}: missing required field: {field}"
                )
        props = schema.get("properties") or {}
        for key, prop_schema in props.items():
            if key in data and isinstance(prop_schema, dict):
                child_path = f"{_path}.{key}" if _path else key
                errors.extend(
                    validate_json_against_schema(
                        data[key],
                        prop_schema,
                        common_defs=common_defs,
                        _path=child_path,
                        _root_defs=defs,
                    )
                )

    if isinstance(data, list):
        if "minItems" in schema and len(data) < schema["minItems"]:
            errors.append(f"{prefix}array shorter than minItems {schema['minItems']}")
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for idx, item in enumerate(data):
                child_path = f"{_path}[{idx}]" if _path else f"[{idx}]"
                errors.extend(
                    validate_json_against_schema(
                        item,
                        item_schema,
                        common_defs=common_defs,
                        _path=child_path,
                        _root_defs=defs,
                    )
                )

    return errors
