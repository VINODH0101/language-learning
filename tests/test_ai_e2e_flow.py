"""
End-to-end QA test for the AI Content Engine (Step 4).

Exercises the complete lifecycle over HttpApiRouter + SupabaseRestClient
(simulated PostgREST):
  schedule -> generate (fallback/provider) -> persist draft & usage ->
  hidden from learner API -> admin review list -> admin approve ->
  visible to learner /api/content* endpoints.
"""

from __future__ import annotations

from engine.ai import (
    ContentGenerationEngine,
    ContentSchedule,
    DefaultProviderRouter,
    DiscoveryManager,
    FrequencyListAdapter,
    GenerationScheduler,
    SupabaseJobStore,
    SupabaseRestClient,
)
from engine.api import (
    AdminContentService,
    ContentAccessService,
    DiscoveryAccessService,
    HttpApiRouter,
    SupabaseContentRepository,
)
from tests.test_ai_supabase_persistence import FakePostgrestServer


def test_full_ai_platform_e2e_lifecycle():
    server = FakePostgrestServer()
    client = SupabaseRestClient("https://example.supabase.co", "service-key", rest_fn=server)

    job_store = SupabaseJobStore(client)
    content_repo = SupabaseContentRepository(client)
    ai_router = DefaultProviderRouter()
    admin_service = AdminContentService(
        repository=content_repo,
        router=ai_router,
        discovery_sources=[FrequencyListAdapter()],
    )
    scheduler = GenerationScheduler(
        ContentGenerationEngine(router=ai_router),
        job_store,
        max_attempts=1,
        sleep_fn=lambda _: None,
        on_review=admin_service.submit_draft,
        on_usage=job_store.record_provider_usage,
    )
    discovery_mgr = DiscoveryManager()
    discovery_mgr.register(FrequencyListAdapter())

    http_router = HttpApiRouter(
        content_service=ContentAccessService(content_repo),
        discovery_service=DiscoveryAccessService(discovery_mgr),
        admin_service=admin_service,
        scheduler=scheduler,
        admin_token="qa-admin-secret",
    )

    auth = {"Authorization": "Bearer qa-admin-secret"}

    # 1. Trigger generation for Portuguese story + Spanish vocabulary
    status, _, report = http_router.dispatch(
        "POST",
        "/api/admin/generation/run",
        headers=auth,
        body={
            "schedules": [
                ContentSchedule(
                    id="e2e-story",
                    content_type="story",
                    target_language="pt",
                    explanation_language="en",
                    cefr_level="B1",
                    topic="Lisboa",
                ).model_dump(),
                ContentSchedule(
                    id="e2e-vocab",
                    content_type="vocabulary",
                    target_language="es",
                    explanation_language="pt",
                    cefr_level="A2",
                    topic="tiempo",
                ).model_dump(),
            ]
        },
    )
    assert status == 200
    assert report["jobs_completed"] == 2
    assert report["jobs_failed"] == 0

    # 2. Learner endpoints must return 0 published items before approval
    status, _, learner_list = http_router.dispatch("GET", "/api/content")
    assert status == 200
    assert learner_list["total"] == 0

    # 3. Admin review queue contains both persisted drafts
    status, _, reviews = http_router.dispatch("GET", "/api/admin/reviews", headers=auth)
    assert status == 200
    assert len(reviews["data"]) == 2
    review_ids = [r["id"] for r in reviews["data"]]

    # 4. Approve only the first item -> visible via /api/content; second remains hidden
    status, _, approved = http_router.dispatch(
        "POST", f"/api/admin/reviews/{review_ids[0]}/approve", headers=auth
    )
    assert status == 200
    assert approved["status"] == "published"

    status, _, learner_after = http_router.dispatch("GET", "/api/content")
    assert status == 200
    assert learner_after["total"] == 1

    # 5. Fetch full item detail by ID — verify reader-ready paragraphs & activities
    pub_id = learner_after["data"][0]["id"]
    status, _, detail = http_router.dispatch("GET", f"/api/content/{pub_id}")
    assert status == 200
    assert detail["status"] == "published"
    assert len(detail["body"].get("paragraphs", [])) >= 1
    assert len(detail["activities"]) >= 1


def test_default_router_has_schedules_and_empty_body_run_generates():
    from engine.api import build_default_router

    router = build_default_router()
    status, _, report = router.dispatch(
        "POST",
        "/api/admin/generation/run",
        headers={"X-Admin-Role": "admin"},
        body={},
    )
    assert status == 200
    assert report["jobs_planned"] >= 1
    assert report["jobs_completed"] >= 1
