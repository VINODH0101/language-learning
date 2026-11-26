"""
Tests for the HTTP API router (Step 3).
"""

from __future__ import annotations

from engine.ai import (
    ContentGenerationEngine,
    ContentSchedule,
    DefaultProviderRouter,
    DiscoveryManager,
    FrequencyListAdapter,
    GenerationScheduler,
    InMemoryJobStore,
    TatoebaDiscoveryAdapter,
)
from engine.api import (
    AdminContentService,
    ContentAccessService,
    ContentRecord,
    DiscoveryAccessService,
    HttpApiRouter,
    InMemoryContentRepository,
)


def _make_router(admin_token: str = "secret-admin-token") -> HttpApiRouter:
    repo = InMemoryContentRepository(
        items=[
            ContentRecord(
                id="pub-1",
                content_type="story",
                target_language="pt",
                explanation_language="en",
                cefr_level="B1",
                title="Café no Porto",
                summary="Uma manhã no Porto",
                status="published",
                current_version_id="ver-1",
                published_at="2026-01-03T00:00:00Z",
                body={"narrative": "Era uma manhã tranquila."},
                activities=[{"type": "multiple_choice", "instruction": "Answer"}],
            ),
            ContentRecord(
                id="draft-1",
                content_type="story",
                target_language="pt",
                explanation_language="en",
                cefr_level="B1",
                title="Rascunho privado",
                status="draft",
                body={"narrative": "Not published"},
            ),
        ]
    )
    discovery = DiscoveryManager()
    discovery.register(FrequencyListAdapter())
    discovery.register(TatoebaDiscoveryAdapter())

    ai_router = DefaultProviderRouter()
    admin = AdminContentService(
        repository=repo,
        router=ai_router,
        discovery_sources=[FrequencyListAdapter()],
    )
    scheduler = GenerationScheduler(
        ContentGenerationEngine(router=ai_router),
        InMemoryJobStore(),
        sleep_fn=lambda _: None,
    )
    return HttpApiRouter(
        content_service=ContentAccessService(repo),
        discovery_service=DiscoveryAccessService(discovery),
        admin_service=admin,
        scheduler=scheduler,
        admin_token=admin_token,
    )


def test_http_content_endpoints_enforce_published_visibility():
    router = _make_router()

    status, _, body = router.dispatch(
        "GET", "/api/content", query={"contentType": ["story"], "targetLanguage": ["pt"]}
    )
    assert status == 200
    assert body["total"] == 1
    assert body["data"][0]["id"] == "pub-1"
    assert body["data"][0]["contentType"] == "story"

    # Drafts are hidden with 404
    status, _, _ = router.dispatch("GET", "/api/content/draft-1")
    assert status == 404

    # Specific version & activities
    status, _, rec = router.dispatch("GET", "/api/content/pub-1/versions/ver-1")
    assert status == 200
    assert rec["title"] == "Café no Porto"

    status, _, acts = router.dispatch("GET", "/api/content/pub-1/activities")
    assert status == 200
    assert len(acts) == 1

    # Invalid filter -> 400
    status, _, err = router.dispatch("GET", "/api/content", query={"cefrLevel": ["Z9"]})
    assert status == 400
    assert "error" in err


def test_http_discovery_endpoints():
    router = _make_router()

    status, _, cats = router.dispatch("GET", "/api/discovery/categories")
    assert status == 200
    assert "vocabulary" in cats["data"]

    status, _, page = router.dispatch("GET", "/api/discovery/search", query={"targetLanguage": ["pt"]})
    assert status == 200
    assert page["total"] >= 1


def test_http_admin_auth_and_generation_review_publish_flow():
    router = _make_router(admin_token="top-secret")

    # Unauthorized without token
    status, _, _ = router.dispatch("GET", "/api/admin/overview")
    assert status == 401

    auth_headers = {"Authorization": "Bearer top-secret"}

    # Trigger generation for a new schedule
    status, _, report = router.dispatch(
        "POST",
        "/api/admin/generation/run",
        headers=auth_headers,
        body={
            "schedules": [
                ContentSchedule(
                    id="gen-vocab",
                    content_type="vocabulary",
                    target_language="es",
                    explanation_language="en",
                    cefr_level="A2",
                    topic="café",
                ).model_dump()
            ]
        },
    )
    assert status == 200
    assert report["jobs_completed"] == 1

    # Review queue has the generated draft, learner API still does not
    status, _, reviews = router.dispatch("GET", "/api/admin/reviews", headers=auth_headers)
    assert status == 200
    assert len(reviews["data"]) == 1
    review_id = reviews["data"][0]["id"]

    status, _, vocab = router.dispatch(
        "GET", "/api/content/vocabulary", query={"targetLanguage": ["es"]}
    )
    assert status == 200
    assert vocab == []

    # Approve via HTTP -> immediately visible in learner /content/vocabulary
    status, _, approved = router.dispatch(
        "POST", f"/api/admin/reviews/{review_id}/approve", headers=auth_headers
    )
    assert status == 200
    assert approved["status"] == "published"

    status, _, vocab_after = router.dispatch(
        "GET", "/api/content/vocabulary", query={"targetLanguage": ["es"]}
    )
    assert status == 200
    assert len(vocab_after) == 1
    assert vocab_after[0]["title"] == "café"
