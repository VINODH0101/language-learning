"""
Provider capability registry.

Declared capabilities reflect current public documentation and are *not*
assumed to be authoritative. Capabilities must be re-verified before
enabling a provider in production. A provider without strict structured
output is still usable via plain generation + local schema validation.
"""

from __future__ import annotations

from typing import Dict, List, Optional

from .provider import CapabilityRecord

CONTENT_TYPES = [
    "story",
    "conversation",
    "poetry",
    "grammar",
    "vocabulary",
    "academic_essay",
    "cultural_article",
    "practice",
]

TASK_TYPES = ["generate_content", "enrich", "translate", "validate"]


def _record(**kwargs) -> CapabilityRecord:
    return CapabilityRecord(**kwargs)


BUILTIN_CAPABILITIES: Dict[str, Dict[str, CapabilityRecord]] = {
    "gemini": {
        "gemini-1.5-flash": _record(
            provider_id="gemini",
            model_id="gemini-1.5-flash",
            supports_structured_output=True,
            supports_json_schema=True,
            supports_tool_calling=True,
            max_context_tokens=1_000_000,
            content_types=CONTENT_TYPES,
            task_types=TASK_TYPES,
            priority=10,
            rate_limit_rpm=15,
        ),
        "gemini-1.5-pro": _record(
            provider_id="gemini",
            model_id="gemini-1.5-pro",
            supports_structured_output=True,
            supports_json_schema=True,
            supports_tool_calling=True,
            max_context_tokens=2_000_000,
            content_types=CONTENT_TYPES,
            task_types=TASK_TYPES,
            priority=5,
            rate_limit_rpm=5,
        ),
    },
    "groq": {
        "llama-3.3-70b-versatile": _record(
            provider_id="groq",
            model_id="llama-3.3-70b-versatile",
            supports_structured_output=False,
            supports_json_schema=False,
            supports_tool_calling=True,
            max_context_tokens=128_000,
            content_types=CONTENT_TYPES,
            task_types=TASK_TYPES,
            priority=20,
            rate_limit_rpm=30,
        ),
    },
    "deepseek": {
        "deepseek-chat": _record(
            provider_id="deepseek",
            model_id="deepseek-chat",
            supports_structured_output=False,
            supports_json_schema=False,
            supports_tool_calling=True,
            max_context_tokens=64_000,
            content_types=CONTENT_TYPES,
            task_types=TASK_TYPES,
            priority=30,
            rate_limit_rpm=0,
        ),
    },
}


def get_capability(provider_id: str, model_id: str) -> CapabilityRecord:
    """Return the capability record for a provider/model, or a disabled default."""
    models = BUILTIN_CAPABILITIES.get(provider_id, {})
    if model_id in models:
        return models[model_id]
    return _record(
        provider_id=provider_id,
        model_id=model_id,
        enabled=False,
        health_status="unknown",
    )


def enabled_models(provider_id: str) -> List[str]:
    return list(BUILTIN_CAPABILITIES.get(provider_id, {}).keys())
