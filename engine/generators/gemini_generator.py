"""Google Gemini Educational Content Generator for Polyglot C1 Daily.

Operates in pipeline/server environments with strict fallback to deterministic
template generation when GEMINI_API_KEY is not configured or network is unreachable.
"""

import os
import json
import logging
from typing import Optional, Dict, Any, List
from engine.models.enums import Language, CEFRLevel
from engine.generators.template_engine import DeterministicLessonGenerator

logger = logging.getLogger(__name__)


class GeminiLessonGenerator:
    """Server-side / pipeline content generator using Google Gemini with deterministic fallback."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        fallback_generator: Optional[DeterministicLessonGenerator] = None,
    ):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.fallback_generator = fallback_generator

    @property
    def is_configured(self) -> bool:
        """Return True if Gemini API key is available."""
        return bool(self.api_key and self.api_key.strip())

    def generate_dialogue(
        self,
        target_language: Language,
        cefr_level: CEFRLevel,
        topic: str = "daily_life",
    ) -> Dict[str, Any]:
        """Generate a realistic dialogue between two speakers at target CEFR level."""
        if not self.is_configured:
            return self._fallback_dialogue(target_language, cefr_level, topic)

        # In production pipeline with GEMINI_API_KEY configured
        prompt = (
            f"Generate a realistic 4-turn language learning dialogue in {target_language.value} "
            f"at CEFR level {cefr_level.value} on the topic of {topic}. "
            "Return JSON with keys: title, scenario, lines: [{speaker, text_target, text_en, audio_tip}]"
        )
        try:
            import urllib.request
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseMimeType": "application/json"},
            }
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return json.loads(text)
        except Exception as e:
            logger.warning("Gemini generation failed (%s), falling back to template", e)
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
