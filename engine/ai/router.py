"""
Default provider router with capability-aware selection and fallback.

Selection order is driven by configured priority, never random. A provider is
only used when enabled, healthy, not budget-exhausted, and capable of the
requested content type and task type. Fallback never creates duplicate
content and never uses a provider that cannot meet output requirements.
"""

from __future__ import annotations

from dataclasses import dataclass, field
import time
from typing import Any, Callable, Dict, List, Optional, Tuple

from .content_types import GenerationTask
from .provider import (
    AIProvider,
    FailureCategory,
    GenerationRequest,
    GenerationResult,
    ProviderRouter,
)


@dataclass
class ProviderEntry:
    provider: AIProvider
    config: Any
    capability: Any
    health: str = "unknown"
    used_tokens_today: int = 0
    last_error: Optional[str] = None
    cooldown_until: float = 0.0


_TRANSIENT_FAILURES = (
    FailureCategory.RATE_LIMIT,
    FailureCategory.TIMEOUT,
    FailureCategory.PROVIDER_UNAVAILABLE,
)


class DefaultProviderRouter(ProviderRouter):
    """A concrete, in-memory router.

    Daily budgets and health are tracked in-memory for now; persistence to the
    ``ai_provider_usage`` table is added in the scheduling phase.
    """

    def __init__(
        self,
        cooldown_seconds: float = 60.0,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._entries: Dict[str, ProviderEntry] = {}
        self._priority_order: List[str] = []
        self._cooldown_seconds = cooldown_seconds
        self._clock = clock

    def register(self, provider: AIProvider, config: Any, model_id: str) -> None:
        capability = provider.capability(model_id)
        self._entries[provider.provider_id] = ProviderEntry(
            provider=provider,
            config=config,
            capability=capability,
            health="healthy" if capability.enabled else "disabled",
        )
        if provider.provider_id not in self._priority_order:
            self._priority_order.append(provider.provider_id)

    def _ordered(self) -> List[ProviderEntry]:
        return sorted(
            self._entries.values(),
            key=lambda entry: entry.capability.priority,
        )

    def _is_entry_eligible(self, entry: ProviderEntry, task: GenerationTask) -> bool:
        if not entry.capability.enabled:
            return False
        if entry.health in ("error", "disabled"):
            return False
        if entry.health == "cooldown":
            if self._clock() < entry.cooldown_until:
                return False
            # Cooldown expired: allow half-open retry in degraded state.
            entry.health = "degraded"
            entry.cooldown_until = 0.0
        if task.context.content_type.value not in entry.capability.content_types:
            return False
        if task.task_type.value not in entry.capability.task_types:
            return False
        if self.is_budget_exhausted(entry.provider.provider_id):
            return False
        return True

    def select(self, task: GenerationTask) -> Optional[AIProvider]:
        for entry in self._ordered():
            if self._is_entry_eligible(entry, task):
                return entry.provider
        return None

    def record_failure(self, provider_id: str, category: FailureCategory) -> None:
        entry = self._entries.get(provider_id)
        if entry is None:
            return
        entry.last_error = category.value
        if category in (FailureCategory.AUTHENTICATION, FailureCategory.NOT_CONFIGURED):
            entry.health = "error"
            entry.cooldown_until = 0.0
        elif category in _TRANSIENT_FAILURES:
            entry.health = "cooldown"
            entry.cooldown_until = self._clock() + self._cooldown_seconds
        else:
            entry.health = "degraded"

    def record_success(self, provider_id: str, result: GenerationResult) -> None:
        entry = self._entries.get(provider_id)
        if entry is None:
            return
        entry.health = "healthy"
        entry.last_error = None
        entry.cooldown_until = 0.0
        if result.usage is not None:
            entry.used_tokens_today += (
                result.usage.prompt_tokens + result.usage.completion_tokens
            )

    def is_budget_exhausted(self, provider_id: str) -> bool:
        entry = self._entries.get(provider_id)
        if entry is None:
            return False
        budget = entry.capability.daily_budget_tokens
        if budget <= 0:
            return False
        return entry.used_tokens_today >= budget

    def snapshot(self) -> List[Dict[str, Any]]:
        """Read model of provider state for Admin monitoring (no secrets)."""
        out: List[Dict[str, Any]] = []
        for entry in self._ordered():
            capability = entry.capability
            out.append(
                {
                    "provider_id": entry.provider.provider_id,
                    "model_id": capability.model_id,
                    "enabled": capability.enabled,
                    "priority": capability.priority,
                    "health": entry.health,
                    "used_tokens_today": entry.used_tokens_today,
                    "daily_budget_tokens": capability.daily_budget_tokens,
                    "last_error": entry.last_error,
                }
            )
        return out

    def generate_with_fallback(
        self, task: GenerationTask, prompt: str, schema: Optional[Dict[str, Any]]
    ) -> Tuple[Optional[GenerationResult], List[str]]:
        """Generate, falling back across capable providers.

        Returns ``(result, attempted_provider_ids)``. ``result.failure`` is set
        when every provider fails; content is never fabricated.
        """
        attempted: List[str] = []
        last_result: Optional[GenerationResult] = None

        for entry in self._ordered():
            if not self._is_entry_eligible(entry, task):
                continue

            request = GenerationRequest(task=task, prompt=prompt, response_schema=schema)
            provider = entry.provider
            attempted.append(provider.provider_id)

            if schema is not None and entry.capability.supports_json_schema:
                result = provider.generate_structured(request, schema)
            else:
                result = provider.generate(request)

            if result.failure is None:
                self.record_success(provider.provider_id, result)
                return result, attempted

            self.record_failure(provider.provider_id, result.failure)
            last_result = result

        return last_result, attempted
