"""
Lexilume — AI content & discovery contracts.

Phase 1 delivers interfaces and schemas only. Nothing here is wired to a
provider, scheduler, or database yet.
"""

from .content_types import (
    CEFR_LEVELS,
    ContentType,
    GenerationContext,
    GenerationTask,
    LanguageContext,
    TaskType,
)
from .discovery import (
    DiscoveryCategory,
    DiscoveryResource,
    DiscoverySourceAdapter,
)
from .discovery_manager import DiscoveryManager, DiscoveryResult, detect_language, enrich_resource
from .discovery_adapters import (
    FrequencyListAdapter,
    OpenLibraryDiscoveryAdapter,
    RssDiscoveryAdapter,
    TatoebaDiscoveryAdapter,
    WikidataDiscoveryAdapter,
    WikipediaDiscoveryAdapter,
    WiktionaryDiscoveryAdapter,
)
from .provider import (
    AIProvider,
    CapabilityRecord,
    FailureCategory,
    GenerationRequest,
    GenerationResult,
    ProviderConfig,
    ProviderRouter,
    ProviderUsage,
)
from .registry import BUILTIN_CAPABILITIES, get_capability
from .router import DefaultProviderRouter
from .providers import GeminiProvider, GroqProvider, DeepSeekProvider
from .generation import ContentGenerationEngine, ContentDraft, GenerationOutcome
from .scheduling import (
    ContentSchedule,
    CoveragePlanner,
    GenerationJob,
    GenerationScheduler,
    InMemoryJobStore,
    JobStatus,
    JobStore,
    SchedulerRunReport,
    canonical_coverage_key,
)
from .supabase_store import (
    SupabaseJobStore,
    SupabasePersistenceError,
    SupabaseRestClient,
)

__all__ = [
    "CEFR_LEVELS",
    "ContentType",
    "GenerationContext",
    "GenerationTask",
    "LanguageContext",
    "TaskType",
    "DiscoveryCategory",
    "DiscoveryResource",
    "DiscoverySourceAdapter",
    "DiscoveryManager",
    "DiscoveryResult",
    "detect_language",
    "enrich_resource",
    "FrequencyListAdapter",
    "OpenLibraryDiscoveryAdapter",
    "RssDiscoveryAdapter",
    "TatoebaDiscoveryAdapter",
    "WikidataDiscoveryAdapter",
    "WikipediaDiscoveryAdapter",
    "WiktionaryDiscoveryAdapter",
    "AIProvider",
    "CapabilityRecord",
    "FailureCategory",
    "GenerationRequest",
    "GenerationResult",
    "ProviderConfig",
    "ProviderRouter",
    "ProviderUsage",
    "BUILTIN_CAPABILITIES",
    "get_capability",
    "DefaultProviderRouter",
    "GeminiProvider",
    "GroqProvider",
    "DeepSeekProvider",
    "ContentGenerationEngine",
    "ContentDraft",
    "GenerationOutcome",
    "ContentSchedule",
    "CoveragePlanner",
    "GenerationJob",
    "GenerationScheduler",
    "InMemoryJobStore",
    "JobStatus",
    "JobStore",
    "SchedulerRunReport",
    "canonical_coverage_key",
    "SupabaseJobStore",
    "SupabasePersistenceError",
    "SupabaseRestClient",
]
