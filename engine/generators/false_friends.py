"""Portuguese-Spanish false cognates and interlinguistic interference manager."""

from typing import List, Optional
from engine.models.enums import Language, CEFRLevel
from engine.models.content import FalseFriendItem


class FalseFriendsManager:
    """Detects and alerts learners to high-risk false friends and syntactic interference between PT and ES."""

    def __init__(self, items: Optional[List[FalseFriendItem]] = None):
        self._items: List[FalseFriendItem] = items or []

    def add_item(self, item: FalseFriendItem) -> None:
        self._items.append(item)

    def get_all(self) -> List[FalseFriendItem]:
        return list(self._items)

    def find_alerts_for_vocabulary(
        self,
        lemmas: List[str],
        language: Language,
    ) -> List[FalseFriendItem]:
        """Finds interference warnings triggered by any vocabulary lemmas in the lesson."""
        cleaned_lemmas = {lemma.strip().lower() for lemma in lemmas}
        alerts: List[FalseFriendItem] = []

        for item in self._items:
            pt_key = item.portuguese_term.strip().lower()
            es_key = item.spanish_term.strip().lower()

            if language == Language.PORTUGUESE and pt_key in cleaned_lemmas:
                alerts.append(item)
            elif language == Language.SPANISH and es_key in cleaned_lemmas:
                alerts.append(item)

        return alerts

    def get_curated_pair_alerts(
        self,
        cefr_level: Optional[CEFRLevel] = None,
        limit: int = 2,
    ) -> List[FalseFriendItem]:
        """Returns high-value comparative warnings appropriate for the CEFR level."""
        items = self._items
        if cefr_level:
            items = [i for i in items if i.cefr_level <= cefr_level]
        return items[:limit]
