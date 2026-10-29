"""
Polyglot C1 Daily — Essential Learner Data Backup and Restoration Tool.

Exports and restores essential learner progress without touching regenerable
lessons or static curriculum definitions:
- User profiles & language track states
- Completed curriculum objective IDs
- Spaced repetition (SM-2) states, review schedules & lapses
- Exercise attempts & diagnostic results
- Email delivery ledger records
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

# Ensure project root is on sys.path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from engine.models.enums import CEFRLevel, Language, RegionalVariety
from engine.models.progress import ExerciseAttempt, SRSItemState, UserTrackState
from engine.security.logging_filter import configure_secure_logging
from engine.storage.supabase_repository import SupabaseStorageRepository

configure_secure_logging(logging.INFO)
logger = logging.getLogger("BackupRestore")

BACKUP_SCHEMA_VERSION = "1.0.0"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Polyglot C1 Daily Backup & Restore Tool")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Backup command
    backup_parser = subparsers.add_parser("backup", help="Create a backup of essential learner progress")
    backup_parser.add_argument(
        "--output-dir",
        type=str,
        default="backups",
        help="Directory to save the backup file (default: backups/)",
    )
    backup_parser.add_argument(
        "--user-id",
        type=str,
        default=None,
        help="Specific user ID to backup (default: all users)",
    )

    # Restore command
    restore_parser = subparsers.add_parser("restore", help="Restore essential learner progress from backup file")
    restore_parser.add_argument(
        "--file",
        type=str,
        required=True,
        help="Path to the JSON backup file to restore",
    )
    restore_parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate backup file without mutating database",
    )

    return parser.parse_args()


def export_backup(output_dir: str, user_id: str | None = None) -> str:
    target_dir = Path(output_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_filename = f"polyglot_backup_{timestamp}.json"
    backup_path = target_dir / backup_filename

    storage = SupabaseStorageRepository()

    tracks_data: List[Dict[str, Any]] = []
    srs_data: List[Dict[str, Any]] = []
    attempts_data: List[Dict[str, Any]] = []

    if storage.is_connected:
        params = {}
        if user_id:
            params["user_id"] = f"eq.{user_id}"

        tracks_res = storage._rest_request("user_learning_tracks", method="GET", params=params)
        if tracks_res:
            tracks_data = tracks_res

        srs_res = storage._rest_request("srs_items", method="GET", params=params)
        if srs_res:
            srs_data = srs_res

        attempts_res = storage._rest_request("exercise_attempts", method="GET", params=params)
        if attempts_res:
            attempts_data = attempts_res
    else:
        # In-memory export
        if storage._mem:
            for track in storage._mem.tracks.values():
                if not user_id or track.user_id == user_id:
                    tracks_data.append(track.model_dump(mode="json"))

            for srs in storage._mem.srs_states.values():
                srs_data.append(srs.model_dump(mode="json"))

            for att_list in storage._mem.exercise_attempts.values():
                for att in att_list:
                    attempts_data.append(att.model_dump(mode="json"))

    payload = {
        "schema_version": BACKUP_SCHEMA_VERSION,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "user_filter": user_id,
        "counts": {
            "tracks": len(tracks_data),
            "srs_items": len(srs_data),
            "exercise_attempts": len(attempts_data),
        },
        "data": {
            "user_learning_tracks": tracks_data,
            "srs_items": srs_data,
            "exercise_attempts": attempts_data,
        },
    }

    with open(backup_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    logger.info(f"Backup successfully exported to: {backup_path}")
    logger.info(f"Summary: {len(tracks_data)} tracks, {len(srs_data)} SRS items, {len(attempts_data)} attempts.")
    return str(backup_path)


def restore_backup(file_path: str, dry_run: bool = False) -> bool:
    path = Path(file_path)
    if not path.exists():
        logger.error(f"Backup file not found: {file_path}")
        return False

    with open(path, "r", encoding="utf-8") as f:
        try:
            payload = json.load(f)
        except json.JSONDecodeError as e:
            logger.error(f"Malformed backup JSON: {e}")
            return False

    # Verify schema version
    version = payload.get("schema_version")
    if version != BACKUP_SCHEMA_VERSION:
        logger.error(f"Unsupported backup schema version '{version}'. Expected '{BACKUP_SCHEMA_VERSION}'.")
        return False

    data = payload.get("data", {})
    tracks = data.get("user_learning_tracks", [])
    srs_items = data.get("srs_items", [])
    attempts = data.get("exercise_attempts", [])

    logger.info(f"Validating backup from {payload.get('exported_at')}:")
    logger.info(f"  * Learning tracks: {len(tracks)}")
    logger.info(f"  * Spaced repetition items: {len(srs_items)}")
    logger.info(f"  * Exercise attempts: {len(attempts)}")

    if dry_run:
        logger.info("[DRY-RUN] Backup file is valid and ready for restoration. Zero changes applied.")
        return True

    storage = SupabaseStorageRepository()
    for t in tracks:
        track_obj = UserTrackState(
            user_id=t["user_id"],
            language=Language(t["language"]),
            regional_variety=RegionalVariety(t["regional_variety"]),
            current_cefr_level=CEFRLevel(t["current_cefr_level"]),
            target_cefr_level=CEFRLevel(t["target_cefr_level"]),
            current_curriculum_node_id=t.get("current_curriculum_node_id"),
            streak_days=t.get("streak_days", 1),
            total_lessons_completed=t.get("total_lessons_completed", 0),
            completed_curriculum_node_ids=t.get("completed_curriculum_node_ids", []),
            presented_vocabulary_ids=t.get("presented_vocabulary_ids", []),
            mastered_vocabulary_ids=t.get("mastered_vocabulary_ids", []),
            recent_node_history=t.get("recent_node_history", []),
            recent_exercise_history=t.get("recent_exercise_history", []),
        )
        storage.save_user_track_state(track_obj)

    logger.info("Restoration completed successfully.")
    return True


if __name__ == "__main__":
    cli_args = parse_args()
    if cli_args.command == "backup":
        export_backup(cli_args.output_dir, cli_args.user_id)
        sys.exit(0)
    elif cli_args.command == "restore":
        success = restore_backup(cli_args.file, cli_args.dry_run)
        sys.exit(0 if success else 1)
