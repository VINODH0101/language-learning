"""
Zero-dependency HTTP transport for the shared content, discovery, and admin APIs.

Implements the REST endpoints documented in ``docs/ai-platform/09-module-api-contracts.md``
over Python's stdlib ``http.server`` while exposing a transport-agnostic
``HttpApiRouter.dispatch(...)`` method for fast, socket-free unit testing.

Usage:
    python -m engine.api.http_server --host 127.0.0.1 --port 8080
"""

from __future__ import annotations

import argparse
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import parse_qs, unquote, urlparse

from ..ai import (
    ContentGenerationEngine,
    ContentSchedule,
    DefaultProviderRouter,
    DiscoveryManager,
    FrequencyListAdapter,
    GenerationScheduler,
    InMemoryJobStore,
    SupabaseJobStore,
    SupabaseRestClient,
    TatoebaDiscoveryAdapter,
    WikipediaDiscoveryAdapter,
    WiktionaryDiscoveryAdapter,
)
from ..ai.dedupe import DuplicateDetector
from ..ai.fallback import DeterministicContentFallback
from ..ai.scheduling import SchedulerRunReport, default_schedules
from ..ai.validation import ContentValidator
from .admin_service import AdminContentService
from .content_service import ContentAccessService, InMemoryContentRepository
from .discovery_service import DiscoveryAccessService
from .models import ContentFilters, ContentListItem, ContentPage, DiscoveryFilters
from .supabase_repository import SupabaseContentRepository


def _to_camel_list_item(item: ContentListItem) -> Dict[str, Any]:
    return {
        "id": item.id,
        "contentType": item.content_type,
        "targetLanguage": item.target_language,
        "explanationLanguage": item.explanation_language,
        "cefrLevel": item.cefr_level,
        "title": item.title,
        "summary": item.summary,
        "topic": item.topic,
        "tags": item.tags,
        "currentVersionId": item.current_version_id,
        "estimatedReadMinutes": item.estimated_read_minutes,
        "publishedAt": item.published_at,
    }


def _to_camel_page(page: ContentPage) -> Dict[str, Any]:
    return {
        "data": [_to_camel_list_item(it) for it in page.data],
        "page": page.page,
        "pageSize": page.page_size,
        "total": page.total,
        "nextCursor": page.next_cursor,
    }


def _first(query: Dict[str, List[str]], *names: str) -> Optional[str]:
    for name in names:
        vals = query.get(name)
        if vals and vals[0] != "":
            return vals[0]
    return None


def _parse_int(query: Dict[str, List[str]], *names: str, default: int) -> int:
    raw = _first(query, *names)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError as exc:
        raise ValueError(f"invalid integer parameter: {raw}") from exc


def _content_filters_from_query(query: Dict[str, List[str]]) -> ContentFilters:
    return ContentFilters(
        content_type=_first(query, "contentType", "content_type"),
        target_language=_first(query, "targetLanguage", "target_language"),
        explanation_language=_first(query, "explanationLanguage", "explanation_language"),
        cefr_level=_first(query, "cefrLevel", "cefr_level"),
        topic=_first(query, "topic"),
        page=_parse_int(query, "page", default=1),
        page_size=_parse_int(query, "pageSize", "page_size", default=20),
        sort=_first(query, "sort") or "recent",
    )


def _discovery_filters_from_query(query: Dict[str, List[str]]) -> DiscoveryFilters:
    return DiscoveryFilters(
        target_language=_first(query, "targetLanguage", "target_language"),
        explanation_language=_first(query, "explanationLanguage", "explanation_language"),
        cefr_level=_first(query, "cefrLevel", "cefr_level"),
        category=_first(query, "category"),
        topic=_first(query, "topic"),
        page=_parse_int(query, "page", default=1),
        page_size=_parse_int(query, "pageSize", "page_size", default=20),
    )


class HttpApiRouter:
    """Transport-agnostic HTTP router for Content, Discovery, and Admin APIs."""

    def __init__(
        self,
        content_service: ContentAccessService,
        discovery_service: DiscoveryAccessService,
        admin_service: AdminContentService,
        scheduler: Optional[GenerationScheduler] = None,
        admin_token: Optional[str] = None,
        cors_origin: str = "*",
    ) -> None:
        self.content_service = content_service
        self.discovery_service = discovery_service
        self.admin_service = admin_service
        self.scheduler = scheduler
        self.admin_token = admin_token if admin_token is not None else os.getenv("ADMIN_API_TOKEN")
        self.cors_origin = cors_origin

    def _base_headers(self) -> Dict[str, str]:
        return {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": self.cors_origin,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Role",
        }

    def _is_admin_authorized(self, headers: Dict[str, str]) -> bool:
        lowered = {k.lower(): v for k, v in headers.items()}
        auth = lowered.get("authorization", "")
        if self.admin_token:
            return auth == f"Bearer {self.admin_token}"
        # Local development fallback when ADMIN_API_TOKEN is unset.
        return lowered.get("x-admin-role", "").lower() == "admin"

    def dispatch(
        self,
        method: str,
        raw_path: str,
        query: Optional[Dict[str, List[str]]] = None,
        headers: Optional[Dict[str, str]] = None,
        body: Optional[Dict[str, Any]] = None,
    ) -> Tuple[int, Dict[str, str], Any]:
        resp_headers = self._base_headers()
        method = method.upper()
        if method == "OPTIONS":
            return 204, resp_headers, None

        query = query or {}
        headers = headers or {}
        path = raw_path.rstrip("/") or "/"
        if path.startswith("/api/"):
            path = path[4:]
        elif path == "/api":
            path = "/"

        try:
            if method == "GET" and path == "/health":
                return 200, resp_headers, {"status": "ok"}

            if path == "/content" or path.startswith("/content/"):
                return self._handle_content(method, path, query, resp_headers)

            if path == "/discovery" or path.startswith("/discovery/"):
                return self._handle_discovery(method, path, query, resp_headers)

            if path == "/admin" or path.startswith("/admin/"):
                if not self._is_admin_authorized(headers):
                    return 401, resp_headers, {"error": "Admin authorization required"}
                return self._handle_admin(method, path, body or {}, resp_headers)

            return 404, resp_headers, {"error": f"Not found: {path}"}
        except ValueError as exc:
            return 400, resp_headers, {"error": str(exc)}

    def _handle_content(
        self,
        method: str,
        path: str,
        query: Dict[str, List[str]],
        headers: Dict[str, str],
    ) -> Tuple[int, Dict[str, str], Any]:
        if method != "GET":
            return 405, headers, {"error": "Method not allowed"}

        if path == "/content":
            page = self.content_service.list_content(_content_filters_from_query(query))
            return 200, headers, _to_camel_page(page)

        if path == "/content/daily":
            return 200, headers, _to_camel_page(self.content_service.daily())

        if path == "/content/recommendations":
            target = _first(query, "targetLanguage", "target_language") or "pt"
            cefr = _first(query, "cefrLevel", "cefr_level") or "B1"
            limit = _parse_int(query, "limit", default=5)
            items = self.content_service.recommendations(target, cefr, limit=limit)
            return 200, headers, [_to_camel_list_item(it) for it in items]

        if path == "/content/search":
            q = _first(query, "q", "query") or ""
            page = self.content_service.search(q, _content_filters_from_query(query))
            return 200, headers, _to_camel_page(page)

        if path == "/content/vocabulary":
            target = _first(query, "targetLanguage", "target_language") or "pt"
            exp = _first(query, "explanationLanguage", "explanation_language") or "en"
            items = self.content_service.vocabulary(target, exp)
            return 200, headers, [_to_camel_list_item(it) for it in items]

        if path == "/content/grammar":
            target = _first(query, "targetLanguage", "target_language") or "pt"
            exp = _first(query, "explanationLanguage", "explanation_language") or "en"
            items = self.content_service.grammar(target, exp)
            return 200, headers, [_to_camel_list_item(it) for it in items]

        parts = [unquote(p) for p in path.split("/") if p]
        if len(parts) == 2:
            record = self.content_service.get_content(parts[1])
            if record is None:
                return 404, headers, {"error": "Content not found"}
            return 200, headers, record.model_dump()

        if len(parts) == 3 and parts[2] == "activities":
            record = self.content_service.get_content(parts[1])
            if record is None:
                return 404, headers, {"error": "Content not found"}
            return 200, headers, self.content_service.get_activities(parts[1])

        if len(parts) == 4 and parts[2] == "versions":
            record = self.content_service.get_content(parts[1], version=parts[3])
            if record is None:
                return 404, headers, {"error": "Content version not found"}
            return 200, headers, record.model_dump()

        return 404, headers, {"error": f"Not found: {path}"}

    def _handle_discovery(
        self,
        method: str,
        path: str,
        query: Dict[str, List[str]],
        headers: Dict[str, str],
    ) -> Tuple[int, Dict[str, str], Any]:
        if method != "GET":
            return 405, headers, {"error": "Method not allowed"}

        if path == "/discovery/categories":
            return 200, headers, {"data": self.discovery_service.categories()}

        if path in ("/discovery", "/discovery/search"):
            q = _first(query, "q", "query") or ""
            lang = _first(query, "targetLanguage", "target_language", "language") or "pt"
            page = self.discovery_service.list_discovery(
                q, lang, _discovery_filters_from_query(query)
            )
            return 200, headers, page.model_dump()

        parts = [unquote(p) for p in path.split("/") if p]
        if len(parts) == 3:
            resource = self.discovery_service.get_discovery(parts[1], parts[2])
            if resource is None:
                return 404, headers, {"error": "Discovery resource not found"}
            return 200, headers, resource.model_dump()

        return 404, headers, {"error": f"Not found: {path}"}

    def _handle_admin(
        self,
        method: str,
        path: str,
        body: Dict[str, Any],
        headers: Dict[str, str],
    ) -> Tuple[int, Dict[str, str], Any]:
        if method == "GET" and path == "/admin/overview":
            return 200, headers, self.admin_service.overview().model_dump()

        if method == "GET" and path == "/admin/reviews":
            return 200, headers, {
                "data": [r.model_dump() for r in self.admin_service.pending_reviews()]
            }

        parts = [unquote(p) for p in path.split("/") if p]
        if method == "POST" and len(parts) == 4 and parts[1] == "reviews":
            review_id, action = parts[2], parts[3]
            if action == "approve":
                record = self.admin_service.approve(review_id)
                if record is None:
                    return 404, headers, {"error": "Pending review item not found"}
                return 200, headers, record.model_dump()
            if action == "reject":
                if not self.admin_service.reject(review_id):
                    return 404, headers, {"error": "Review item not found"}
                return 200, headers, {"rejected": True, "id": review_id}

        if method == "POST" and path == "/admin/generation/run":
            if self.scheduler is None:
                return 503, headers, {"error": "Generation scheduler not configured"}
            schedules_raw = body.get("schedules")
            if isinstance(schedules_raw, list) and schedules_raw:
                self.admin_service.set_schedules(
                    [ContentSchedule(**item) for item in schedules_raw]
                )
            elif not self.admin_service.schedules:
                if isinstance(self.scheduler.store, SupabaseJobStore):
                    loaded = self.scheduler.store.load_schedules()
                    self.admin_service.set_schedules(loaded or default_schedules())
                else:
                    self.admin_service.set_schedules(default_schedules())
            report = self.admin_service.run_generation(self.scheduler)
            if isinstance(self.scheduler.store, SupabaseJobStore):
                self.scheduler.store.record_run(SchedulerRunReport(**report))
            return 200, headers, report

        return 404, headers, {"error": f"Not found: {path}"}


def build_default_router() -> HttpApiRouter:
    """Construct a production/local router wired to Supabase when configured."""
    client = SupabaseRestClient.from_env()
    if client is not None:
        repo = SupabaseContentRepository(client)
        job_store = SupabaseJobStore(client)
    else:
        repo = InMemoryContentRepository()
        job_store = InMemoryJobStore()

    ai_router = DefaultProviderRouter()
    engine = ContentGenerationEngine(
        router=ai_router,
        dedupe=DuplicateDetector(),
        validator=ContentValidator(),
        fallback=DeterministicContentFallback(),
    )

    discovery_mgr = DiscoveryManager()
    discovery_mgr.register(FrequencyListAdapter())
    discovery_mgr.register(TatoebaDiscoveryAdapter())
    discovery_mgr.register(WiktionaryDiscoveryAdapter())
    discovery_mgr.register(WikipediaDiscoveryAdapter())

    initial_schedules = (
        job_store.load_schedules() if isinstance(job_store, SupabaseJobStore) else []
    ) or default_schedules()

    admin_service = AdminContentService(
        repository=repo,
        router=ai_router,
        schedules=initial_schedules,
        discovery_sources=[
            FrequencyListAdapter(),
            TatoebaDiscoveryAdapter(),
            WiktionaryDiscoveryAdapter(),
            WikipediaDiscoveryAdapter(),
        ],
    )
    on_usage = job_store.record_provider_usage if isinstance(job_store, SupabaseJobStore) else None
    scheduler = GenerationScheduler(
        engine,
        job_store,
        on_review=admin_service.submit_draft,
        on_usage=on_usage,
    )

    return HttpApiRouter(
        content_service=ContentAccessService(repo),
        discovery_service=DiscoveryAccessService(discovery_mgr),
        admin_service=admin_service,
        scheduler=scheduler,
        cors_origin=os.getenv("CONTENT_API_CORS_ORIGIN", "*"),
    )


def create_http_server(
    host: str = "127.0.0.1",
    port: int = 8080,
    router: Optional[HttpApiRouter] = None,
) -> ThreadingHTTPServer:
    active_router = router or build_default_router()

    class _Handler(BaseHTTPRequestHandler):
        def _send(self, method: str) -> None:
            parsed = urlparse(self.path)
            query = parse_qs(parsed.query)
            length = int(self.headers.get("Content-Length", "0") or 0)
            body_dict: Optional[Dict[str, Any]] = None
            if length > 0:
                raw = self.rfile.read(length).decode("utf-8")
                body_dict = json.loads(raw) if raw.strip() else {}
            status, headers, payload = active_router.dispatch(
                method,
                parsed.path,
                query=query,
                headers=dict(self.headers),
                body=body_dict,
            )
            self.send_response(status)
            for k, v in headers.items():
                self.send_header(k, v)
            self.end_headers()
            if payload is not None:
                self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

        def do_OPTIONS(self) -> None:
            self._send("OPTIONS")

        def do_GET(self) -> None:
            self._send("GET")

        def do_POST(self) -> None:
            self._send("POST")

        def log_message(self, format: str, *args: Any) -> None:  # noqa: A002
            return

    return ThreadingHTTPServer((host, port), _Handler)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Lexilume Content & Discovery HTTP API")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    server = create_http_server(host=args.host, port=args.port)
    print(f"Lexilume API listening on http://{args.host}:{args.port}")
    server.serve_forever()
