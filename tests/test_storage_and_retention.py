"""
Tests for storage retention pruning, essential progress preservation,
and backup creation & restoration.
"""

from datetime import date, timedelta
from pathlib import Path
import json
import pytest

from engine.models.enums import Language, RegionalVariety, CEFRLevel
from engine.models.progress import UserTrackState, SRSItemState
from engine.storage.supabase_repository import SupabaseStorageRepository
from scripts.retention_cleanup import run_cleanup
from scripts.backup_restore import export_backup, restore_backup


def test_essential_progress_survives_cleanup(tmp_path):
    storage = SupabaseStorageRepository()
    user_id = "retention-test-learner"

    # 1. Setup learner track
    track = UserTrackState(
        user_id=user_id,
        language=Language.PORTUGUESE,
        regional_variety=RegionalVariety.PT_BR,
        current_cefr_level=CEFRLevel.B2,
        target_cefr_level=CEFRLevel.C1,
        total_lessons_completed=10,
        completed_curriculum_node_ids=["pt-a1-01", "pt-a2-01", "pt-b1-01"],
    )
    storage.save_user_track_state(track)

    # 2. Setup SRS items
    srs = SRSItemState(
        vocabulary_item_id="pt-voc-01",
        language=Language.PORTUGUESE,
        repetition_count=4,
        ease_factor=2.4,
        interval_days=15,
        next_review_date=date.today() + timedelta(days=5),
        mastery_status="reviewing",
    )
    storage.save_srs_state(user_id, srs)

    # 3. Run retention cleanup (e.g. 90-day window)
    exit_code = run_cleanup(retention_days=90, dry_run=False)
    assert exit_code == 0

    # 4. Verify learner track is 100% intact
    recovered_track = storage.get_user_track_state(user_id, Language.PORTUGUESE)
    assert recovered_track is not None
    assert recovered_track.current_cefr_level == CEFRLevel.B2
    assert recovered_track.total_lessons_completed == 10
    assert len(recovered_track.completed_curriculum_node_ids) == 3

    # 5. Verify SRS item is 100% intact
    recovered_srs = storage.get_srs_states(user_id, Language.PORTUGUESE)
    assert len(recovered_srs) == 1
    assert recovered_srs[0].vocabulary_item_id == "pt-voc-01"
    assert recovered_srs[0].ease_factor == 2.4


def test_backup_and_restore_cycle(tmp_path):
    storage = SupabaseStorageRepository()
    user_id = "backup-user-cycle"

    # Setup initial state
    track = UserTrackState(
        user_id=user_id,
        language=Language.SPANISH,
        regional_variety=RegionalVariety.ES_ES,
        current_cefr_level=CEFRLevel.C1,
        target_cefr_level=CEFRLevel.C1,
        total_lessons_completed=25,
        completed_curriculum_node_ids=["es-a1-01", "es-b1-01", "es-c1-01"],
    )
    storage.save_user_track_state(track)

    # Export backup
    backup_file = export_backup(str(tmp_path), user_id=user_id)
    assert Path(backup_file).exists()

    # Dry-run restore
    assert restore_backup(backup_file, dry_run=True) is True

    # Real restore
    assert restore_backup(backup_file, dry_run=False) is True

    # Verify restored state
    restored_track = storage.get_user_track_state(user_id, Language.SPANISH)
    assert restored_track is not None
    assert restored_track.total_lessons_completed == 25
    assert restored_track.current_cefr_level == CEFRLevel.C1
    assert "es-c1-01" in restored_track.completed_curriculum_node_ids
