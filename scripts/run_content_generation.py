"""
Lexilume — Content generation scheduler entrypoint.

Wires the server-side AI providers (from environment variables) into the
generation engine and runs the due schedules. Fully offline-safe:
- When ``SUPABASE_URL`` and ``SUPABASE_SERVICE_ROLE_KEY`` are set, schedules,
  jobs, attempts, validation reports, provider usage, and review drafts are
  persisted in Supabase (content enters the review queue, never auto-published).
- With no Supabase credentials or AI provider keys configured, it uses the
  in-memory store + deterministic fallback and prints a JSON report.

Usage:
    python scripts/run_content_generation.py

Environment (optional, server-side only):
    GEMINI_API_KEY, GROQ_API_KEY, DEEPSEEK_API_KEY
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
    GEN_SCHEDULES_JSON - path to an optional schedules JSON file
                         (list of ContentSchedule objects)

Outputs a JSON report to stdout.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

# Ensure project root is on sys.path
_root_dir = Path(__file__).resolve().parent.parent
if str(_root_dir) not in sys.path:
    sys.path.insert(0, str(_root_dir))

from engine.ai import (
    ContentGenerationEngine,
    ContentSchedule,
    DeepSeekProvider,
    DefaultProviderRouter,
    GenerationScheduler,
    GeminiProvider,
    GroqProvider,
    InMemoryJobStore,
    ProviderConfig,
    SupabaseJobStore,
    SupabaseRestClient,
)
from engine.ai.dedupe import DuplicateDetector
from engine.ai.fallback import DeterministicContentFallback
from engine.ai.scheduling import default_schedules
from engine.ai.validation import ContentValidator
from engine.api import AdminContentService, InMemoryContentRepository, SupabaseContentRepository


def build_router() -> DefaultProviderRouter:
    router = DefaultProviderRouter()
    if os.getenv("GEMINI_API_KEY"):
        router.register(GeminiProvider(), ProviderConfig(provider_id="gemini"), "gemini-1.5-flash")
    if os.getenv("GROQ_API_KEY"):
        router.register(
            GroqProvider(), ProviderConfig(provider_id="groq"), "llama-3.3-70b-versatile"
        )
    if os.getenv("DEEPSEEK_API_KEY"):
        router.register(DeepSeekProvider(), ProviderConfig(provider_id="deepseek"), "deepseek-chat")
    return router


def load_schedules(store: object | None = None) -> list[ContentSchedule]:
    path = os.getenv("GEN_SCHEDULES_JSON")
    if path and os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        return [ContentSchedule(**item) for item in raw]
    if isinstance(store, SupabaseJobStore):
        db_schedules = store.load_schedules()
        if db_schedules:
            return db_schedules
    return default_schedules()


def main() -> int:
    router = build_router()
    engine = ContentGenerationEngine(
        router=router,
        dedupe=DuplicateDetector(),
        validator=ContentValidator(),
        fallback=DeterministicContentFallback(),
    )

    client = SupabaseRestClient.from_env()
    if client is not None:
        store = SupabaseJobStore(client)
        content_repo = SupabaseContentRepository(client)
        persistence_mode = "supabase"
        on_usage = store.record_provider_usage
    else:
        store = InMemoryJobStore()
        content_repo = InMemoryContentRepository()
        persistence_mode = "in_memory"
        on_usage = None

    admin = AdminContentService(repository=content_repo, router=router)
    scheduler = GenerationScheduler(
        engine,
        store,
        on_review=admin.submit_draft,
        on_usage=on_usage,
    )
    schedules = load_schedules(store)
    report = scheduler.run(schedules)

    if isinstance(store, SupabaseJobStore):
        store.record_run(report)

    output = {
        "persistence": persistence_mode,
        "drafts_queued_for_review": len(admin.pending_reviews()),
        **report.model_dump(),
    }
    print(json.dumps(output, indent=2, ensure_ascii=False))
    return 0 if report.jobs_failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
