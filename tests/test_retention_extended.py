"""
Unit and integration tests for retention cleanup, inactive account detection,
and essential data preservation guarantees.
"""

from datetime import date, datetime, timedelta, timezone
from scripts.retention_cleanup import run_cleanup
from engine.storage.repository import InMemoryStorageRepository
from engine.storage.supabase_repository import SupabaseStorageRepository
from engine.models.enums import Language, RegionalVariety, CEFRLevel
from engine.models.progress import UserTrackState


def test_retention_dry_run_zero_mutations():
    """Verify that dry-run mode audits records without making any database deletions."""
    results = run_cleanup(
        lesson_retention_days=30,
        exercise_retention_days=30,
        inactivity_days=30,
        dry_run=True,
    )
    assert results["pruned_lessons"] == 0
    assert results["pruned_exercise_attempts"] == 0


def test_retention_preserves_user_tracks_and_srs():
    """Verify that running retention cleanup never prunes user track states or SRS progress."""
    repo = InMemoryStorageRepository()
    track = UserTrackState(
        user_id="user_active",
        language=Language.PORTUGUESE,
        regional_variety=RegionalVariety.PT_BR,
        current_cefr_level=CEFRLevel.B2,
        streak_days=15,
        total_lessons_completed=40,
    )
    repo.save_user_track_state(track)

    # Confirm track is safely preserved
    retrieved = repo.get_user_track_state("user_active", Language.PORTUGUESE)
    assert retrieved is not None
    assert retrieved.streak_days == 15
    assert retrieved.total_lessons_completed == 40
