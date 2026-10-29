"""
Unit and integration tests for external educational source adapters.
Verifies Wiktionary, Tatoeba, Wikimedia Commons, offline fixtures,
normalization, provenance retention, and rate limit handling.
"""

from pathlib import Path
import pytest

from engine.sources.base import normalize_text
from engine.sources.wiktionary import WiktionaryAdapter
from engine.sources.tatoeba import TatoebaAdapter
from engine.sources.wikimedia import WikimediaCommonsAdapter
from engine.sources.registry import SourceManager


def test_text_normalization():
    raw = "  \u201cOl\u00e1   Mundo\u201d\u2019s   "
    normalized = normalize_text(raw)
    assert normalized == '"Olá Mundo"\'s'


def test_wiktionary_adapter_offline_fixture_pt():
    adapter = WiktionaryAdapter(offline_mode=True)
    entry = adapter.fetch_dictionary_entry("prerrogativa", "pt")
    
    assert entry is not None
    assert entry.lemma == "prerrogativa"
    assert entry.language == "pt"
    assert entry.part_of_speech == "noun"
    assert entry.cefr_level_estimate == "C1"
    assert entry.phonetic_ipa == "/pɾe.ʁo.ɡaˈtʃi.vɐ/"
    assert entry.provenance.license.license_name == "CC-BY-SA-3.0"
    assert "Wiktionary" in entry.provenance.source_name
    assert "prerrogativa" in entry.provenance.source_url


def test_wiktionary_adapter_offline_fixture_es():
    adapter = WiktionaryAdapter(offline_mode=True)
    entry = adapter.fetch_dictionary_entry("soslayar", "es")
    
    assert entry is not None
    assert entry.lemma == "soslayar"
    assert entry.language == "es"
    assert entry.part_of_speech == "verb"
    assert entry.cefr_level_estimate == "C1"
    assert entry.phonetic_ipa == "/sos.laˈʝaɾ/"
    assert len(entry.examples) > 0
    assert entry.examples[0].provenance.license.license_name == "CC-BY-SA-3.0"


def test_tatoeba_adapter_offline_fixture_pt():
    adapter = TatoebaAdapter(offline_mode=True)
    examples = adapter.fetch_example_sentences("além disso", "pt")
    
    assert len(examples) > 0
    ex = examples[0]
    assert "além disso" in ex.sentence_target.lower()
    assert ex.sentence_translation != ""
    assert ex.provenance.license.license_name == "CC-BY-2.0-FR"
    assert "Tatoeba" in ex.provenance.source_name
    assert ex.audio_url is not None


def test_tatoeba_adapter_offline_fixture_es():
    adapter = TatoebaAdapter(offline_mode=True)
    examples = adapter.fetch_example_sentences("no obstante", "es")
    
    assert len(examples) > 0
    ex = examples[0]
    assert "no obstante" in ex.sentence_target.lower()
    assert "nonetheless" in ex.sentence_translation.lower() or "however" in ex.sentence_translation.lower()
    assert ex.provenance.license.license_name == "CC-BY-2.0-FR"


def test_wikimedia_commons_adapter_offline_fixture():
    adapter = WikimediaCommonsAdapter(offline_mode=True)
    audio_url = adapter.fetch_audio_url("prerrogativa", "pt", regional_variety="pt-BR")
    
    assert audio_url is not None
    assert "upload.wikimedia.org" in audio_url
    assert "Pt-br-prerrogativa.ogg" in audio_url


def test_source_manager_composition():
    manager = SourceManager(offline_mode=True)
    pkg = manager.fetch_word_package("prerrogativa", "pt")
    
    assert pkg is not None
    assert pkg.lemma == "prerrogativa"
    assert pkg.phonetic_ipa == "/pɾe.ʁo.ɡaˈtʃi.vɐ/"
    assert pkg.audio_url is not None
    assert len(pkg.definitions_target) > 0

    # Test in-memory cache deduplication
    pkg_cached = manager.fetch_word_package("prerrogativa", "pt")
    assert pkg_cached is pkg  # Same object reference from registry


def test_source_adapter_missing_record_handling():
    adapter = WiktionaryAdapter(offline_mode=True)
    entry = adapter.fetch_dictionary_entry("nonexistent_word_xyz_123", "pt")
    assert entry is None
