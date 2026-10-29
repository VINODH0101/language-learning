import { describe, it, expect, beforeEach } from 'vitest';
import { ClientLessonGenerator } from '../services/lessonGenerator';
import { StorageService } from '../services/storage';

describe('ClientLessonGenerator', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates a full Portuguese lesson payload with 12 sections', () => {
    const lesson = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-29');

    expect(lesson).toBeDefined();
    expect(lesson.language).toBe('pt');
    expect(lesson.regional_variety).toBe('pt-BR');
    expect(lesson.cefr_level).toBe('A1'); // Initial default starting level
    expect(lesson.section_1_objectives.length).toBeGreaterThan(0);
    expect(lesson.section_2_vocabulary.length).toBeGreaterThanOrEqual(12);
    expect(lesson.section_3_grammar).toBeDefined();
    expect(lesson.section_4_reading.passage_target.length).toBeGreaterThan(50);
    expect(lesson.section_5_conversation.dialogue.length).toBeGreaterThan(0);
    expect(lesson.section_6_speaking.prompt).toBeDefined();
    expect(lesson.section_7_writing.structural_guidelines.length).toBeGreaterThan(0);
    expect(lesson.section_8_listening.audio_source_url).toBeDefined();
    expect(lesson.section_9_exercises.length).toBeGreaterThan(0);
    expect(lesson.section_10_answer_keys.length).toBeGreaterThan(0);
    expect(lesson.section_11_review).toBeDefined();
    expect(lesson.section_12_further_resources.length).toBeGreaterThan(0);
    expect(lesson.false_friend_alerts.length).toBeGreaterThan(0);
  });

  it('generates Spanish daily lesson with appropriate variety', () => {
    const lesson = ClientLessonGenerator.generateOrGetLesson('es', '2026-10-29');

    expect(lesson.language).toBe('es');
    expect(lesson.regional_variety).toBe('es-ES');
    expect(lesson.section_2_vocabulary.length).toBeGreaterThanOrEqual(12);
    expect(lesson.section_3_grammar.title).toContain('Subjuntivo');
  });

  it('caches generated lesson for the same day in localStorage', () => {
    const lesson1 = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-29');
    const lesson2 = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-29');

    expect(lesson1.curriculum_node_id).toBe(lesson2.curriculum_node_id);
    const stored = StorageService.getDailyLesson('pt', '2026-10-29');
    expect(stored).not.toBeNull();
    expect(stored?.lesson_date).toBe('2026-10-29');
  });

  it('initializes SRS items for presented vocabulary', () => {
    ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-29');
    const srsItems = StorageService.getSRSItems('pt');
    expect(srsItems.length).toBeGreaterThanOrEqual(12);
    expect(srsItems[0].mastery_status).toBe('presented');
  });

  it('supplies authentic Wikipedia reading section with attribution and metadata', () => {
    const lessonPt = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-30');
    expect(lessonPt.section_4_reading.provider).toBe('wikipedia');
    expect(lessonPt.section_4_reading.article_url).toContain('wikipedia.org');
    expect(lessonPt.section_4_reading.attribution.license_type).toBe('CC-BY-SA-4.0');
    expect(lessonPt.section_4_reading.thumbnail_url).toBeDefined();

    const lessonEs = ClientLessonGenerator.generateOrGetLesson('es', '2026-10-30');
    expect(lessonEs.section_4_reading.provider).toBe('wikipedia');
    expect(lessonEs.section_4_reading.article_url).toContain('wikipedia.org');
    expect(lessonEs.section_4_reading.attribution.license_type).toBe('CC-BY-SA-4.0');
  });

  it('dynamically rotates vocabulary, conversation scenario, and contextual exercises on consecutive calendar days', () => {
    // Portuguese Rotation across consecutive days
    const day1Pt = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-29');
    const day2Pt = ClientLessonGenerator.generateOrGetLesson('pt', '2026-10-30');

    const day1PtVocabIds = new Set(day1Pt.section_2_vocabulary.map(v => v.id));
    const day2PtVocabIds = new Set(day2Pt.section_2_vocabulary.map(v => v.id));

    // Vocabulary lists must be distinct sets
    expect(day1Pt.section_2_vocabulary[0].id).not.toBe(day2Pt.section_2_vocabulary[0].id);
    const ptOverlap = [...day1PtVocabIds].filter(id => day2PtVocabIds.has(id));
    expect(ptOverlap.length).toBe(0); // Completely disjoint 12-item rotating batches

    // Conversation scenarios must rotate
    expect(day1Pt.section_5_conversation.title).not.toBe(day2Pt.section_5_conversation.title);

    // Dynamic vocabulary cloze/definition exercises must be created targeting today's words
    expect(day1Pt.section_9_exercises.some(e => e.id.includes('dyn-vocab-cloze'))).toBe(true);
    expect(day1Pt.section_9_exercises.some(e => e.id.includes('dyn-vocab-def'))).toBe(true);
    expect(day2Pt.section_9_exercises.some(e => e.id.includes('dyn-vocab-cloze'))).toBe(true);

    // Spanish Rotation across consecutive days
    const day1Es = ClientLessonGenerator.generateOrGetLesson('es', '2026-10-29');
    const day2Es = ClientLessonGenerator.generateOrGetLesson('es', '2026-10-30');

    const day1EsVocabIds = new Set(day1Es.section_2_vocabulary.map(v => v.id));
    const day2EsVocabIds = new Set(day2Es.section_2_vocabulary.map(v => v.id));

    expect(day1Es.section_2_vocabulary[0].id).not.toBe(day2Es.section_2_vocabulary[0].id);
    const esOverlap = [...day1EsVocabIds].filter(id => day2EsVocabIds.has(id));
    expect(esOverlap.length).toBe(0);
    expect(day1Es.section_5_conversation.title).not.toBe(day2Es.section_5_conversation.title);

    // English Rotation across consecutive days
    const day1En = ClientLessonGenerator.generateOrGetLesson('en', '2026-10-29');
    const day2En = ClientLessonGenerator.generateOrGetLesson('en', '2026-10-30');

    const day1EnVocabIds = new Set(day1En.section_2_vocabulary.map(v => v.id));
    const day2EnVocabIds = new Set(day2En.section_2_vocabulary.map(v => v.id));

    expect(day1En.section_2_vocabulary[0].id).not.toBe(day2En.section_2_vocabulary[0].id);
    const enOverlap = [...day1EnVocabIds].filter(id => day2EnVocabIds.has(id));
    expect(enOverlap.length).toBe(0);
  });
});
