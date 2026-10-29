"""
Polyglot C1 Daily — Translation Data Models & Quota Contracts.

Defines request/response schemas, verification indicators, and quota definitions
for sustainable, privacy-respecting cross-linguistic translation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TranslationRequest(BaseModel):
    """Translation request payload with strict input size boundaries."""
    source_text: str = Field(..., max_length=1000, description="Source text to translate (max 1,000 chars)")
    source_lang: str = Field(..., description="ISO language code ('pt', 'es', 'en')")
    target_lang: str = Field(..., description="ISO language code ('pt', 'es', 'en')")
    user_id: str = Field(default="guest", description="Learner ID or 'guest'")
    is_registered: bool = Field(default=False, description="Whether the requester has a registered account")


class TranslationResponse(BaseModel):
    """Immediate translation result returned to client without persistent DB insert."""
    translated_text: str
    source_lang: str
    target_lang: str
    provider_name: str  # 'dictionary', 'mymemory', 'libretranslate', 'fallback'
    is_verified: bool = Field(default=False, description="True for curated dictionary entries; False for machine translations")
    is_approximate: bool = Field(default=False, description="True when translation is machine-generated or approximate")
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)
    part_of_speech: Optional[str] = None
    phonetic_target: Optional[str] = None
    example_source: Optional[str] = None
    example_target: Optional[str] = None
    notes: Optional[str] = None
    from_cache: bool = False
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class QuotaStatus(BaseModel):
    """Ephemeral daily translation quota telemetry."""
    user_id: str
    is_registered: bool
    daily_limit: int
    used_today: int
    remaining_today: int
    resets_in_seconds: int
    is_allowed: bool


class SavedTranslationItem(BaseModel):
    """User-explicitly bookmarked translation record."""
    id: str
    user_id: str
    source_text: str = Field(..., max_length=1000)
    translated_text: str = Field(..., max_length=1000)
    source_lang: str
    target_lang: str
    provider_used: str = "dictionary"
    is_verified: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
