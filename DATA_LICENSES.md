# Polyglot C1 Daily — Educational Data Licenses & Provenance

Polyglot C1 Daily strictly adheres to open educational licensing standards. This document records the provenance, licensing terms, attribution statements, and legal reuse policies for all educational and linguistic assets used across the application.

---

## 1. Primary Educational Data Sources

### 1.1 Wiktionary (Wikimedia Foundation)
- **Content**: Lexical definitions, part-of-speech classifications, IPA phonetic transcriptions, and inflection tables.
- **License**: **Creative Commons Attribution-ShareAlike 3.0 Unported (CC-BY-SA 3.0)** and GNU Free Documentation License (GFDL).
- **License URL**: [https://creativecommons.org/licenses/by-sa/3.0/](https://creativecommons.org/licenses/by-sa/3.0/)
- **Attribution Statement**:
  > *"Dictionary content from Wiktionary, a collaborative project of the Wikimedia Foundation, licensed under CC-BY-SA 3.0."*
- **Compliance Requirements**:
  - Modifications to definitions are noted in provenance metadata (`modifications` list).
  - Derived dictionary datasets must be released under compatible ShareAlike terms.

### 1.2 Tatoeba Project
- **Content**: Authentic bilingual sentence pairs (Portuguese-English, Spanish-English) and native speaker audio recordings.
- **License**: **Creative Commons Attribution 2.0 France (CC-BY 2.0 FR)**.
- **License URL**: [https://creativecommons.org/licenses/by/2.0/fr/](https://creativecommons.org/licenses/by/2.0/fr/)
- **Attribution Statement**:
  > *"Example sentences and audio recordings from the Tatoeba Project (https://tatoeba.org), contributed by native volunteers and licensed under CC-BY 2.0 FR."*
- **Compliance Requirements**:
  - Direct sentence identifiers (`tat-<id>`) and original author contributions are linked in lesson payloads and database records.

### 1.3 Wikimedia Commons
- **Content**: Pronunciation `.ogg` and `.mp3` sound files recorded by native contributors.
- **Licenses**: **Public Domain**, **CC0 1.0**, **CC-BY 3.0**, or **CC-BY-SA 4.0**.
- **License URL**: [https://commons.wikimedia.org/wiki/Commons:Licensing](https://commons.wikimedia.org/wiki/Commons:Licensing)
- **Attribution Statement**:
  > *"Spoken pronunciation files courtesy of Wikimedia Commons contributors, licensed under Creative Commons or Public Domain."*

### 1.4 Wikipedia (Wikimedia Foundation)
- **Content**: Authentic Portuguese (`pt.wikipedia.org`) and Spanish (`es.wikipedia.org`) encyclopedic extracts, topic descriptions, and media metadata.
- **License**: **Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA 4.0)**.
- **License URL**: [https://creativecommons.org/licenses/by-sa/4.0/](https://creativecommons.org/licenses/by-sa/4.0/)
- **Attribution Statement**:
  > *"Text from Wikipedia (pt.wikipedia.org / es.wikipedia.org), available under the Creative Commons Attribution-ShareAlike License 4.0."*
- **Compliance & Attribution Rules**:
  - Each reading section explicitly displays the source article URL, page title, and CC-BY-SA 4.0 license identifier.
  - No bulk article texts or Wikipedia database dumps are imported or persisted in PostgreSQL.
  - Derived reading comprehension questions cite the original article URL and revision identifier.

### 1.5 Polyglot C1 Daily Original Pedagogical Syntheses
- **Content**:
  - Structured CEFR A1–C1 syllabi (`pt_curriculum.json`, `es_curriculum.json`).
  - Reading comprehension passages and negotiation dialogues (`reading_and_dialogues.json`).
  - Portuguese-Spanish false friends contrastive analyses (`pt_es_false_friends.json`).
  - Deterministic exercise templates, distractors, and pedagogical feedback (`exercise_templates.json`).
- **License**: **Creative Commons Attribution 4.0 International (CC-BY 4.0)**.
- **Attribution Statement**:
  > *"Polyglot C1 Daily Open Curriculum (https://github.com/polyglot-c1-daily), licensed under CC-BY 4.0."*

---

## 2. Prohibition of Indiscriminate Scraping & Synthetic Fabrication

1. **No Indiscriminate Web Scraping**: The application does not scrape arbitrary copyrighted websites, commercial language course materials, or paywalled grammar repositories.
2. **No Fabricated Citations**: The engine does not generate fake academic citations, imaginary corpus references, or synthetic attribution claims. All authentic examples originate from verified CC-BY entries in Tatoeba or Wiktionary.
3. **Explicit Synthetic Marking**: Where example sentences are generated deterministically by slot-filling templates rather than sourced from an external corpus, they are explicitly tagged in metadata with `license_type: "Original-Curated"`.
