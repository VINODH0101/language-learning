"""Unit tests for Portuguese-Spanish false friends and interlinguistic interference."""

from engine.models.enums import Language, CEFRLevel, LicenseType
from engine.models.content import FalseFriendItem, Attribution
from engine.generators.false_friends import FalseFriendsManager


def test_false_friend_detection():
    ff = FalseFriendItem(
        id="ff-1",
        portuguese_term="esquisito",
        spanish_term="exquisito",
        pt_meaning_en="weird, strange",
        es_meaning_en="delicious, superb",
        pt_example="Comportamento esquisito.",
        es_example="Vino exquisito.",
        interference_warning="Nunca use esquisito em português como elogio gastronômico!",
        cefr_level=CEFRLevel.A2,
        attribution=Attribution(
            source_name="Polyglot C1 Daily",
            source_url="https://github.com",
            license_type=LicenseType.ORIGINAL_CURATED,
            attribution_text="Original note",
        ),
    )

    mgr = FalseFriendsManager([ff])

    # Search for PT vocabulary containing 'esquisito'
    alerts_pt = mgr.find_alerts_for_vocabulary(["conquanto", "esquisito", "ponderar"], Language.PORTUGUESE)
    assert len(alerts_pt) == 1
    assert alerts_pt[0].portuguese_term == "esquisito"
    assert "elogio" in alerts_pt[0].interference_warning

    # Search for ES vocabulary containing 'exquisito'
    alerts_es = mgr.find_alerts_for_vocabulary(["exquisito", "menester"], Language.SPANISH)
    assert len(alerts_es) == 1
    assert alerts_es[0].spanish_term == "exquisito"
