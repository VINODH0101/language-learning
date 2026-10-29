# Polyglot C1 Daily — Source Adapters Guide

This guide documents the design, usage, and extension of the modular educational data source adapters in `engine/sources/`.

---

## 1. Adapter Architecture

All source adapters inherit from [`BaseSourceAdapter`](file:///C:/Users/vinod/OneDrive/Desktop/language-learning/engine/sources/base.py) and provide:
1. **Provenance Tracking**: Captures source ID, source URL, license type, attribution text, and import timestamp.
2. **Text Normalization**: Unicode NFC normalization, diacritic cleaning, quote standardization.
3. **Polite Crawling & Rate Limiting**: Built-in delay between requests (`request_delay_seconds`) and exponential backoff on HTTP 429.
4. **Local Disk Caching**: Hashed cache files stored in `.cache/` to prevent redundant network requests.
5. **Offline Fallback**: Seamless fallback to bundled test fixtures when in `offline_mode` or during network interruptions.

```
engine/sources/
├── __init__.py           # Package exports
├── base.py               # Abstract base adapter, models, normalizer
├── registry.py           # SourceManager orchestrator
├── wiktionary.py         # Wiktionary dictionary adapter (CC-BY-SA 3.0)
├── tatoeba.py            # Tatoeba sentence & audio adapter (CC-BY 2.0 FR)
├── wikimedia.py          # Wikimedia Commons audio adapter
└── fixtures/             # Curated offline fixture datasets
    ├── wiktionary_pt_fixtures.json
    ├── wiktionary_es_fixtures.json
    ├── tatoeba_pt_fixtures.json
    ├── tatoeba_es_fixtures.json
    └── wikimedia_fixtures.json
```

---

## 2. Usage Examples

### 2.1 Fetching a Word Package
```python
from engine.sources.registry import SourceManager

# Initialize manager (offline_mode=True for offline/test environments)
manager = SourceManager(offline_mode=True)

# Assemble dictionary definition, authentic example sentence, and native audio
word_pkg = manager.fetch_word_package("prerrogativa", language="pt", regional_variety="pt-BR")

print(word_pkg.lemma)               # "prerrogativa"
print(word_pkg.phonetic_ipa)        # "/pɾe.ʁo.ɡaˈtʃi.vɐ/"
print(word_pkg.audio_url)           # "https://upload.wikimedia.org/.../Pt-br-prerrogativa.ogg"
print(word_pkg.provenance.license)  # LicenseMetadata(license_name="CC-BY-SA-3.0", ...)
```

### 2.2 Searching Tatoeba Sentences
```python
from engine.sources.tatoeba import TatoebaAdapter

adapter = TatoebaAdapter(offline_mode=True)
examples = adapter.fetch_example_sentences("no obstante", language="es", limit=3)

for ex in examples:
    print(ex.sentence_target)       # "Los resultados financieros fueron modestos; no obstante..."
    print(ex.sentence_translation)  # "The financial results were modest; nonetheless..."
    print(ex.audio_url)             # "https://audio.tatoeba.org/sentences/spa/201.mp3"
```

---

## 3. Adding a New Source Adapter

To add a new linguistic dataset:
1. Inherit from `BaseSourceAdapter` in `engine/sources/`.
2. Define the exact `LicenseMetadata` governing the source (verify redistributability and attribution clauses).
3. Implement `fetch_dictionary_entry` and `fetch_example_sentences`.
4. Add offline test fixtures in `engine/sources/fixtures/`.
5. Register the new adapter in `SourceManager` (`engine/sources/registry.py`).
6. Add unit tests in `tests/test_sources.py`.
