"""
Multi-provider AI abstraction.

Defines the provider interface, capability registry, failure classification,
usage accounting, and a router contract. No provider is implemented here and
no network call is made. Providers (Gemini, Groq, DeepSeek, ...) are adapters
implemented in later phases.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .content_types import GenerationContext, GenerationTask


class FailureCategory(str, Enum):
    """Classification used for fallback and circuit-breaking decisions."""

    NOT_CONFIGURED = "not_configured"
    AUTHENTICATION = "authentication"
    RATE_LIMIT = "rate_limit"
    TIMEOUT = "timeout"
    PROVIDER_UNAVAILABLE = "provider_unavailable"
    INVALID_RESPONSE = "invalid_response"
    SCHEMA_VIOLATION = "schema_violation"
    CONTEXT_LENGTH = "context_length"
    UNKNOWN = "unknown"


class CapabilityRecord(BaseModel):
    """Declared capabilities of a provider/model pairing.

    Capabilities must be checked against current provider documentation.
    A provider without strict structured output is still usable via
    plain generation + local schema validation.
    """

    provider_id: str
    model_id: str
    enabled: bool = True
    supports_structured_output: bool = False
    supports_json_schema: bool = False
    supports_streaming: bool = False
    supports_tool_calling: bool = False
    max_context_tokens: int = 0
    task_types: List[str] = Field(default_factory=list)
    content_types: List[str] = Field(default_factory=list)
    priority: int = 100
    rate_limit_rpm: int = 0
    daily_budget_tokens: int = 0
    health_status: str = "unknown"
    last_success_at: Optional[str] = None
    last_error: Optional[str] = None


class ProviderUsage(BaseModel):
    """Operational usage accounting (no chain-of-thought or hidden reasoning)."""

    provider_id: str
    model_id: str
    prompt_version: str
    request_id: Optional[str] = None
    prompt_tokens: int = 0
    completion_tokens: int = 0
    duration_ms: int = 0
    status: str = "success"
    failure_category: Optional[FailureCategory] = None
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class GenerationRequest(BaseModel):
    """Normalized request passed to every provider adapter."""

    task: GenerationTask
    prompt: str
    response_schema: Optional[Dict[str, Any]] = None
    temperature: float = 0.4
    max_tokens: Optional[int] = None


class GenerationResult(BaseModel):
    """Normalized result returned by every provider adapter."""

    provider_id: str
    model_id: str
    content: Any
    structured: bool = False
    raw: Optional[str] = None
    usage: Optional[ProviderUsage] = None
    failure: Optional[FailureCategory] = None


class AIProvider(ABC):
    """Adapter interface for a generative AI provider."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        """Unique provider identifier (e.g. ``gemini``, ``groq``)."""

    @abstractmethod
    def capability(self, model_id: str) -> CapabilityRecord:
        """Return the capability record for the given model."""

    @abstractmethod
    def generate(self, request: GenerationRequest) -> GenerationResult:
        """Generate content (no schema guarantee)."""

    @abstractmethod
    def generate_structured(
        self, request: GenerationRequest, schema: Dict[str, Any]
    ) -> GenerationResult:
        """Generate content and validate against the provided schema."""

    @abstractmethod
    def health_check(self) -> bool:
        """Perform a lightweight connectivity check."""

    @abstractmethod
    def get_usage(self, result: GenerationResult) -> Optional[ProviderUsage]:
        """Extract usage accounting from a result."""


@dataclass
class ProviderConfig:
    """Server-side runtime configuration for a provider.

    Secrets are environment variables only; never stored in the database,
    frontend code, logs, or Vite variables.
    """

    provider_id: str
    enabled: bool = False
    models: List[str] = field(default_factory=list)
    priority: int = 100
    api_key_env: Optional[str] = None
    base_url: Optional[str] = None


class ProviderRouter(ABC):
    """Selects a capable provider for a generation task.

    Routing considers task type, content type, required schema support,
    model availability, provider health, rate limits, remaining daily budget,
    configured priority, and retry eligibility. It must never fall back to a
    provider that cannot meet the requested output requirements.
    """

    @abstractmethod
    def select(self, task: GenerationTask) -> Optional[AIProvider]:
        """Return the best capable provider, or None if none are available."""

    @abstractmethod
    def record_failure(
        self, provider_id: str, category: FailureCategory
    ) -> None:
        """Update health/usage accounting after a failure."""

    @abstractmethod
    def is_budget_exhausted(self, provider_id: str) -> bool:
        """True when the provider's daily budget is exhausted."""
