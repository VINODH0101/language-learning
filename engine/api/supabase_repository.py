"""
Supabase-backed ContentRepository bridging AI drafts, review queue, and published catalogue.

Maps the eight centralized AI content types into ``content_items`` (migration 015 + 016),
``content_versions`` (immutable snapshots), and ``content_review_items`` (migration 014 + 017).
Learners see only ``status = 'published'`` rows.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..ai.generation import ContentDraft
from ..ai.supabase_store import SupabaseRestClient
from .content_service import ContentRepository
from .models import ContentRecord

# Maps the 8 AI content types to a valid migration-015 legacy `genre` value.
_CONTENT_TYPE_TO_GENRE: Dict[str, str] = {
    "story": "short_story",
    "conversation": "conversation",
    "poetry": "literature",
    "grammar": "grammar_in_action",
    "vocabulary": "grammar_in_action",
    "academic_essay": "academic_essay",
    "cultural_article": "culture_and_travel",
    "practice": "grammar_in_action",
}

_GENRE_TO_CONTENT_TYPE: Dict[str, str] = {
    "short_story": "story",
    "literature": "story",
    "conversation": "conversation",
    "dialogue": "conversation",
    "academic_essay": "academic_essay",
    "grammar_in_action": "grammar",
    "culture_and_travel": "cultural_article",
}


def _slugify(title: str, suffix: str) -> str:
    base = re.sub(r"[^\w\s-]", "", (title or "").lower()).strip()
    base = re.sub(r"[\s_-]+", "-", base).strip("-") or "content"
    return f"{base[:180]}-{suffix[:8]}"


def _infer_content_type(row: Dict[str, Any]) -> str:
    ct = row.get("content_type")
    if ct:
        return str(ct)
    return _GENRE_TO_CONTENT_TYPE.get(str(row.get("genre", "")), "story")


def _extract_reader_lines(draft: ContentDraft) -> List[tuple[str, str]]:
    """Extract (target_sentence, optional_translation) pairs from any AI content type."""
    body = draft.content
    pairs: List[tuple[str, str]] = []

    if isinstance(body.get("narrative"), str) and body["narrative"].strip():
        for sent in re.split(r"(?<=[.!?])\s+", body["narrative"].strip()):
            if sent.strip():
                pairs.append((sent.strip(), ""))
    elif isinstance(body.get("article_body"), str) and body["article_body"].strip():
        for sent in re.split(r"(?<=[.!?])\s+", body["article_body"].strip()):
            if sent.strip():
                pairs.append((sent.strip(), ""))
    elif isinstance(body.get("dialogue"), list):
        for turn in body["dialogue"]:
            if isinstance(turn, dict) and turn.get("line"):
                speaker = turn.get("speaker", "Speaker")
                pairs.append((f"{speaker}: {turn['line']}", str(turn.get("translation") or "")))
    elif isinstance(body.get("lines"), list):
        interp = str(body.get("interpretation") or "")
        for idx, line in enumerate(body["lines"]):
            if str(line).strip():
                pairs.append((str(line).strip(), interp if idx == 0 else ""))
    elif isinstance(body.get("examples"), list) and body.get("grammar_topic"):
        pairs.append((str(body["grammar_topic"]), str(body.get("explanation") or "")))
        for ex in body["examples"]:
            if isinstance(ex, dict) and ex.get("sentence"):
                pairs.append((str(ex["sentence"]), str(ex.get("note") or "")))
    elif body.get("lemma"):
        pairs.append(
            (
                f"{body['lemma']} ({body.get('part_of_speech', 'word')})",
                str(body.get("definition") or ""),
            )
        )
    elif body.get("thesis"):
        for field in ("introduction", "thesis", "conclusion"):
            if isinstance(body.get(field), str) and body[field].strip():
                pairs.append((body[field].strip(), ""))
    elif body.get("instructions"):
        pairs.append((str(body["instructions"]), ""))
        for q in body.get("questions") or []:
            if isinstance(q, dict) and q.get("prompt"):
                pairs.append((str(q["prompt"]), ""))

    if not pairs:
        pairs.append((draft.title or draft.content_type, draft.summary or ""))
    return pairs


def _build_reader_structured_payload(draft: ContentDraft) -> tuple[Dict[str, Any], int, int]:
    """Ensure structured_payload works in both ContentAccessService and ReaderView."""
    payload = dict(draft.content)
    pairs = _extract_reader_lines(draft)
    exp_lang = draft.explanation_language or "en"

    if not payload.get("paragraphs"):
        sentences = []
        for idx, (text, trans) in enumerate(pairs, start=1):
            translations = {exp_lang: trans} if trans else {}
            sentences.append(
                {
                    "id": f"s{idx}",
                    "order": idx,
                    "text": text,
                    "translations": translations,
                    "tokens": [],
                }
            )
        payload["title"] = draft.title
        payload["paragraphs"] = [{"id": "p1", "order": 1, "sentences": sentences}]

    word_count = sum(len(text.split()) for text, _ in pairs)
    sentence_count = max(1, len(pairs))
    return payload, word_count, sentence_count


def _build_learning_activities(draft: ContentDraft, version_id: str) -> List[Dict[str, Any]]:
    body = draft.content
    raw_questions: List[Dict[str, Any]] = []

    if isinstance(body.get("comprehension_questions"), list):
        for idx, item in enumerate(body["comprehension_questions"], start=1):
            if isinstance(item, dict) and item.get("question") and item.get("answer"):
                ans = str(item["answer"])
                raw_questions.append(
                    {
                        "id": f"q_{idx}",
                        "prompt": str(item["question"]),
                        "options": [
                            {"id": "opt_1", "text": ans, "is_correct": True},
                        ],
                        "correct_answer": ans,
                    }
                )

    if isinstance(body.get("questions"), list):
        for idx, item in enumerate(body["questions"], start=1):
            if isinstance(item, dict) and item.get("prompt"):
                correct = str(item.get("correct") or "")
                opts = [
                    {
                        "id": f"opt_{o_idx}",
                        "text": str(opt),
                        "is_correct": str(opt) == correct,
                    }
                    for o_idx, opt in enumerate(item.get("options") or [], start=1)
                ]
                if not opts and correct:
                    opts = [{"id": "opt_1", "text": correct, "is_correct": True}]
                raw_questions.append(
                    {
                        "id": f"q_{idx}",
                        "prompt": str(item["prompt"]),
                        "options": opts,
                        "correct_answer": correct,
                    }
                )

    if not raw_questions:
        return []

    act_type = "reading_comprehension" if draft.content_type != "practice" else "short_answer"
    return [
        {
            "id": str(uuid.uuid4()),
            "content_version_id": version_id,
            "activity_type": act_type,
            "activity_title": f"{draft.title[:100]} — Practice",
            "activity_order": 1,
            "estimated_minutes": 3,
            "configuration": {"questions": raw_questions},
        }
    ]


class SupabaseContentRepository(ContentRepository):
    """Persists drafts to review queue and reads/publishes unified content records."""

    def __init__(self, client: SupabaseRestClient) -> None:
        self.client = client

    def save_draft_for_review(self, draft: ContentDraft) -> str:
        """Persist a generated draft as an unpublished item + pending review row."""
        existing = self.client.select(
            "content_review_items",
            {"select": "id", "idempotency_key": f"eq.{draft.idempotency_key}", "limit": "1"},
        )
        if existing:
            return str(existing[0]["id"])

        item_id = str(uuid.uuid4())
        version_id = str(uuid.uuid4())
        review_id = str(uuid.uuid4())
        meta = draft.content.get("meta") or {}
        read_minutes = max(1, int(meta.get("estimated_read_minutes") or 1))
        genre = _CONTENT_TYPE_TO_GENRE.get(draft.content_type, "short_story")

        self.client.insert(
            "content_items",
            {
                "id": item_id,
                "title": draft.title[:255],
                "slug": _slugify(draft.title, item_id),
                "target_language": draft.target_language,
                "explanation_language": draft.explanation_language,
                "summary": draft.summary,
                "genre": genre,
                "content_type": draft.content_type,
                "primary_cefr": draft.cefr_level,
                "estimated_read_minutes": read_minutes,
                "status": "review_required",
                "rights_status": "original",
                "author": "Lexilume AI Content Engine",
            },
        )

        structured_payload, word_count, sentence_count = _build_reader_structured_payload(draft)

        self.client.insert(
            "content_versions",
            {
                "id": version_id,
                "content_item_id": item_id,
                "version_number": 1,
                "cefr_level": draft.cefr_level,
                "structured_payload": structured_payload,
                "word_count": word_count,
                "sentence_count": sentence_count,
                "is_published": False,
                "change_summary": f"Generated by {draft.provider}",
            },
        )

        for activity in _build_learning_activities(draft, version_id):
            self.client.insert("learning_activities", activity)

        self.client.update(
            "content_items",
            {"id": f"eq.{item_id}"},
            {"current_version_id": version_id},
        )

        self.client.insert(
            "content_review_items",
            {
                "id": review_id,
                "content_type": draft.content_type,
                "title_or_term": draft.title[:255],
                "language": draft.target_language,
                "explanation_language": draft.explanation_language,
                "cefr_level": draft.cefr_level,
                "source": draft.provider,
                "status": "pending",
                "content_item_id": item_id,
                "content_version_id": version_id,
                "idempotency_key": draft.idempotency_key,
                "draft_payload": draft.model_dump(),
            },
        )
        return review_id

    def published_items(self) -> List[ContentRecord]:
        items = self.client.select(
            "content_items",
            {"status": "eq.published", "order": "created_at.desc"},
        )
        if not items:
            return []
        versions = self.client.select(
            "content_versions",
            {"is_published": "eq.true"},
        )
        by_version = {str(v["id"]): v for v in versions}
        activities = self.client.select("learning_activities", {"order": "activity_order.asc"})
        acts_by_version: Dict[str, List[Dict[str, Any]]] = {}
        for act in activities:
            vid = str(act.get("content_version_id") or "")
            acts_by_version.setdefault(vid, []).append(act)
        return [
            self._to_record(
                row,
                by_version.get(str(row.get("current_version_id"))),
                acts_by_version.get(str(row.get("current_version_id")), []),
            )
            for row in items
        ]

    def get_item(self, item_id: str) -> Optional[ContentRecord]:
        rows = self.client.select(
            "content_items",
            {"id": f"eq.{item_id}", "status": "eq.published", "limit": "1"},
        )
        if not rows:
            return None
        row = rows[0]
        version_row: Optional[Dict[str, Any]] = None
        activities: List[Dict[str, Any]] = []
        if row.get("current_version_id"):
            v_rows = self.client.select(
                "content_versions",
                {"id": f"eq.{row['current_version_id']}", "is_published": "eq.true", "limit": "1"},
            )
            if v_rows:
                version_row = v_rows[0]
            activities = self.client.select(
                "learning_activities",
                {"content_version_id": f"eq.{row['current_version_id']}", "order": "activity_order.asc"},
            )
        return self._to_record(row, version_row, activities)

    def publish(self, item: ContentRecord) -> None:
        now = datetime.now(timezone.utc).isoformat()
        existing = self.client.select(
            "content_items",
            {"select": "id,current_version_id", "id": f"eq.{item.id}", "limit": "1"},
        )
        if existing:
            self.client.update(
                "content_items",
                {"id": f"eq.{item.id}"},
                {"status": "published"},
            )
            vid = existing[0].get("current_version_id") or item.current_version_id
            if vid:
                self.client.update(
                    "content_versions",
                    {"id": f"eq.{vid}"},
                    {"is_published": True, "published_at": now},
                )
            return

        version_id = item.current_version_id or str(uuid.uuid4())
        self.client.insert(
            "content_items",
            {
                "id": item.id,
                "title": item.title[:255],
                "slug": _slugify(item.title, item.id),
                "target_language": item.target_language,
                "explanation_language": item.explanation_language,
                "summary": item.summary,
                "genre": _CONTENT_TYPE_TO_GENRE.get(item.content_type, "short_story"),
                "content_type": item.content_type,
                "primary_cefr": item.cefr_level,
                "estimated_read_minutes": max(1, item.estimated_read_minutes),
                "status": "published",
                "rights_status": "original",
            },
        )
        self.client.insert(
            "content_versions",
            {
                "id": version_id,
                "content_item_id": item.id,
                "version_number": 1,
                "cefr_level": item.cefr_level,
                "structured_payload": item.body,
                "is_published": True,
                "published_at": now,
            },
        )
        self.client.update(
            "content_items",
            {"id": f"eq.{item.id}"},
            {"current_version_id": version_id},
        )

    def approve_review(self, review_id: str) -> Optional[ContentRecord]:
        rows = self.client.select(
            "content_review_items",
            {"id": f"eq.{review_id}", "status": "eq.pending", "limit": "1"},
        )
        if not rows:
            return None
        review = rows[0]
        item_id = review.get("content_item_id")
        version_id = review.get("content_version_id")
        now = datetime.now(timezone.utc).isoformat()
        if item_id:
            self.client.update("content_items", {"id": f"eq.{item_id}"}, {"status": "published"})
        if version_id:
            self.client.update(
                "content_versions",
                {"id": f"eq.{version_id}"},
                {"is_published": True, "published_at": now},
            )
        self.client.update(
            "content_review_items",
            {"id": f"eq.{review_id}"},
            {"status": "approved", "reviewed_at": now},
        )
        return self.get_item(str(item_id)) if item_id else None

    def reject_review(self, review_id: str) -> bool:
        rows = self.client.select(
            "content_review_items",
            {"id": f"eq.{review_id}", "limit": "1"},
        )
        if not rows:
            return False
        now = datetime.now(timezone.utc).isoformat()
        self.client.update(
            "content_review_items",
            {"id": f"eq.{review_id}"},
            {"status": "rejected", "reviewed_at": now},
        )
        return True

    def pending_reviews(self) -> List[Dict[str, Any]]:
        return self.client.select(
            "content_review_items",
            {"status": "eq.pending", "order": "created_at.desc"},
        )

    def _to_record(
        self,
        row: Dict[str, Any],
        version_row: Optional[Dict[str, Any]],
        activities: Optional[List[Dict[str, Any]]] = None,
    ) -> ContentRecord:
        payload = (version_row or {}).get("structured_payload") or {}
        meta = payload.get("meta") if isinstance(payload, dict) else {}
        body = (
            {k: v for k, v in payload.items() if k != "meta"}
            if isinstance(payload, dict)
            else {}
        )
        return ContentRecord(
            id=str(row["id"]),
            content_type=_infer_content_type(row),
            target_language=row["target_language"],
            explanation_language=row.get("explanation_language", "en"),
            cefr_level=row["primary_cefr"],
            title=row["title"],
            summary=row.get("summary") or "",
            topic=meta.get("topic") if isinstance(meta, dict) else None,
            tags=list(meta.get("tags", [])) if isinstance(meta, dict) else [],
            status=row["status"],
            current_version_id=(
                str(row["current_version_id"]) if row.get("current_version_id") else None
            ),
            estimated_read_minutes=int(row.get("estimated_read_minutes") or 1),
            published_at=str(
                (version_row or {}).get("published_at") or row.get("created_at") or ""
            ),
            body=body,
            activities=activities or [],
        )
