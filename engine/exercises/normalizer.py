"""Unicode-aware string normalization for lenient and deterministic answer checking."""

import re
import unicodedata


class StringNormalizer:
    """Normalizes learner inputs and solution patterns for deterministic equality checks."""

    # Punctuation to strip from ends and internal punctuation that does not alter semantics
    PUNCTUATION_REGEX = re.compile(r"^[¿¡\"'«»“”\s]+|[¿¡!?,.;:\"'«»“”\s]+$")
    INTERNAL_PUNCTUATION = re.compile(r"[,\.;:¿¡!\?\"'«»“”\-–—]")

    @classmethod
    def clean(cls, text: str) -> str:
        """Standard clean: trimmed, lowercase, normalized whitespace."""
        if not text:
            return ""
        # Canonical decomposition/composition
        normalized = unicodedata.normalize("NFC", text.strip().lower())
        # Strip external punctuation
        stripped = cls.PUNCTUATION_REGEX.sub("", normalized)
        # Collapse multi-spaces
        return re.sub(r"\s+", " ", stripped).strip()

    @classmethod
    def remove_accents(cls, text: str) -> str:
        """Removes diacritics/accents for accent-tolerant matching."""
        nfkd = unicodedata.normalize("NFKD", text)
        return "".join(c for c in nfkd if not unicodedata.combining(c))

    @classmethod
    def matches(
        cls,
        candidate: str,
        acceptable_answers: list[str],
        strict_accents: bool = True,
    ) -> bool:
        """Determines if candidate answer matches any of the acceptable answers."""
        cleaned_candidate = cls.clean(candidate)
        cleaned_acceptable = [cls.clean(ans) for ans in acceptable_answers]

        if cleaned_candidate in cleaned_acceptable:
            return True

        if not strict_accents:
            no_accent_candidate = cls.remove_accents(cleaned_candidate)
            no_accent_acceptable = [cls.remove_accents(ans) for ans in cleaned_acceptable]
            return no_accent_candidate in no_accent_acceptable

        return False
