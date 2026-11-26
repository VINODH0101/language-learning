"""
Shared content/discovery API service layer.
"""

from .models import (
    ContentFilters,
    ContentListItem,
    ContentPage,
    ContentRecord,
    DiscoveryFilters,
    DiscoveryPage,
)
from .content_service import (
    ContentAccessService,
    ContentRepository,
    InMemoryContentRepository,
)
from .supabase_repository import SupabaseContentRepository
from .http_server import HttpApiRouter, build_default_router, create_http_server
from .discovery_service import DiscoveryAccessService
from .admin_service import (
    AdminContentService,
    AdminOverview,
    ProviderSnapshot,
    ReviewItem,
    ReviewStatus,
    SourceSnapshot,
    content_record_from_draft,
)

__all__ = [
    "ContentFilters",
    "ContentListItem",
    "ContentPage",
    "ContentRecord",
    "DiscoveryFilters",
    "DiscoveryPage",
    "ContentAccessService",
    "ContentRepository",
    "InMemoryContentRepository",
    "SupabaseContentRepository",
    "HttpApiRouter",
    "build_default_router",
    "create_http_server",
    "DiscoveryAccessService",
    "AdminContentService",
    "AdminOverview",
    "ProviderSnapshot",
    "ReviewItem",
    "ReviewStatus",
    "SourceSnapshot",
    "content_record_from_draft",
]
