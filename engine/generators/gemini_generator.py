"""Google Gemini Educational Content Generator for Polyglot C1 Daily / Lexilume.

Operates in pipeline/server environments with configurable model selection and
strict fallback to deterministic template generation when GEMINI_API_KEY is
not configured, network is unreachable, or model output is malformed.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

from engine.generators.template_engine import DeterministicLessonGenerator
from engine.models.enums import CEFRLevel, Language

logger = logging.getLogger(__name__)

# Default documented Gemini model supporting generateContent
DEFAULT_GEMINI_MODEL = "gemini-1.5-flash"


class GeminiLessonGenerator:
    """Server-side / pipeline content generator using Google Gemini with deterministic fallback."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        fallback_generator: Optional[DeterministicLessonGenerator] = None,
        timeout_seconds: float = 12.0,
        max_retries: int = 1,
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        raw_model = model or os.getenv("GEMINI_MODEL") or DEFAULT_GEMINI_MODEL
        # Normalize model identifier: e.g. "models/gemini-1.5-flash" -> "gemini-1.5-flash"
        self.model = raw_model[len("models/"):] if raw_model.startswith("models/") else raw_model
        self.fallback_generator = fallback_generator
        self.timeout = timeout_seconds
        self.max_retries = max(0, max_retries)

    @property
    def is_configured(self) -> bool:
        """Return True if Gemini API key is available."""
        return bool(self.api_key and self.api_key.strip())

    def verify_generation(self, prompt: str = "Say hello in Portuguese") -> Dict[str, Any]:
        """Perform a minimal live generation request to verify the model and key."""
        if not self.is_configured:
            return {"success": False, "category": "NOT_CONFIGURED", "error": "API key missing"}

        query_params = urllib.parse.urlencode({"key": self.api_key.strip()})
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?{query_params}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": 30},
        }
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "Lexilume-Diagnostic/2.0"},
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and parts[0].get("text"):
                        return {
                            "success": True,
                            "text": parts[0]["text"].strip(),
                            "model": self.model,
                        }
                return {"success": False, "category": "EMPTY_RESPONSE", "error": "No text in candidates"}
        except urllib.error.HTTPError as e:
            category = "UNKNOWN"
            if e.code in (401, 403):
                category = "AUTH_ERROR"
            elif e.code == 404:
                category = "MODEL_NOT_FOUND"
            elif e.code == 429:
                category = "QUOTA_EXHAUSTED"
            elif e.code >= 500:
                category = "SERVER_ERROR"
            return {"success": False, "category": category, "status_code": e.code, "error": e.reason}
        except Exception as e:
            return {"success": False, "category": "NETWORK_ERROR", "error": str(e)}

    def generate_dialogue(
        self,
        target_language: Language,
        cefr_level: CEFRLevel,
        topic: str = "daily_life",
    ) -> Dict[str, Any]:
        """Generate a realistic dialogue between two speakers at target CEFR level."""
        if not self.is_configured:
            return self._fallback_dialogue(target_language, cefr_level, topic)

        prompt = (
            f"Generate a realistic 4-turn language learning dialogue in {target_language.value} "
            f"at CEFR level {cefr_level.value} on the topic of {topic}. "
            "Return JSON with keys: title, scenario, lines: [{speaker, text_target, text_en, audio_tip}]"
        )

        query_params = urllib.parse.urlencode({"key": self.api_key.strip()})
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?{query_params}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }

        attempts = 0
        while attempts <= self.max_retries:
            attempts += 1
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json", "User-Agent": "Lexilume-PedagogicalEngine/2.0"},
                )
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    resp_text = resp.read().decode("utf-8")
                    data = json.loads(resp_text)
                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise ValueError("Gemini returned empty candidate list")
                    
                    text_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    if not text_part or not text_part.strip():
                        raise ValueError("Gemini candidate contains empty text")

                    parsed = json.loads(text_part)
                    if not isinstance(parsed, dict) or "title" not in parsed or "lines" not in parsed:
                        raise ValueError("Gemini response missing required 'title' or 'lines' fields")

                    if not isinstance(parsed["lines"], list) or len(parsed["lines"]) < 2:
                        raise ValueError("Gemini response lines must contain at least 2 dialogue turns")

                    # Attach provenance metadata
                    parsed["provider"] = "gemini"
                    parsed["model"] = self.model
                    return parsed

            except urllib.error.HTTPError as e:
                # Permanent errors: do not retry
                if e.code in (400, 401, 403, 404, 429):
                    logger.warning(
                        "Gemini generation HTTP %s on model '%s' (non-retryable): %s",
                        e.code,
                        self.model,
                        e.reason,
                    )
                    break
                # Server-side transient error: retry once if available
                logger.warning("Gemini generation HTTP %s (attempt %d/%d)", e.code, attempts, self.max_retries + 1)
                if attempts > self.max_retries:
                    break

            except (urllib.error.URLError, TimeoutError) as e:
                logger.warning("Gemini network error (attempt %d/%d): %s", attempts, self.max_retries + 1, e)
                if attempts > self.max_retries:
                    break

            except (json.JSONDecodeError, ValueError, KeyError, IndexError, TypeError) as e:
                logger.warning("Gemini output parsing failed (%s), falling back to template", type(e).__name__)
                break

            except Exception as e:
                logger.warning("Unexpected Gemini generation failure (%s)", e)
                break

        # Fall back to deterministic educational template
        return self._fallback_dialogue(target_language, cefr_level, topic)

    def _fallback_dialogue(
        self,
        target_language: Language,
        cefr_level: CEFRLevel,
        topic: str,
    ) -> Dict[str, Any]:
        """Deterministic educational fallback dialogue."""
        if target_language == Language.PORTUGUESE:
            return {
                "title": f"Conversação Prática — {topic.title()}",
                "scenario": "Diálogo situacional focado em comunicação autêntica.",
                "lines": [
                    {
                        "speaker": "Ana",
                        "text_target": "Olá! Você já concluiu o relatório de sustentabilidade?",
                        "text_en": "Hello! Have you finished the sustainability report yet?",
                    },
                    {
                        "speaker": "Carlos",
                        "text_target": "Ainda não, mas estou revisando os últimos dados estatísticos.",
                        "text_en": "Not yet, but I'm reviewing the final statistical figures.",
                    },
                ],
                "provider": "deterministic-template",
            }
        elif target_language == Language.SPANISH:
            return {
                "title": f"Conversación Práctica — {topic.title()}",
                "scenario": "Diálogo situacional centrado en comunicación auténtica.",
                "lines": [
                    {
                        "speaker": "Elena",
                        "text_target": "¡Hola! ¿Has terminado el informe sobre sostenibilidad?",
                        "text_en": "Hello! Have you finished the sustainability report?",
                    },
                    {
                        "speaker": "Marcos",
                        "text_target": "Todavía no, pero estoy revisando los últimos gráficos analíticos.",
                        "text_en": "Not yet, but I'm reviewing the final analytical charts.",
                    },
                ],
                "provider": "deterministic-template",
            }
        else:
            return {
                "title": f"Practical Conversation — {topic.title()}",
                "scenario": "Situational dialogue focusing on advanced professional exchange.",
                "lines": [
                    {
                        "speaker": "Sarah",
                        "text_target": "Good morning! Have you had a chance to look over the proposal?",
                        "text_pt": "Bom dia! Teve a oportunidade de revisar a proposta?",
                        "text_es": "¡Buenos días! ¿Tuviste oportunidad de revisar la propuesta?",
                    },
                    {
                        "speaker": "David",
                        "text_target": "Yes, I reviewed it thoroughly and the metrics look compelling.",
                        "text_pt": "Sim, revisei com atenção e as métricas parecem sólidas.",
                        "text_es": "Sí, la revisé minuciosamente y las métricas parecen convincentes.",
                    },
                ],
                "provider": "deterministic-template",
            }
