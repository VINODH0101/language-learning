/**
 * Lexilume — Content-Centred Service (Phase 7)
 * 
 * Provides unified, offline-first access to:
 * 1. Authentic Content Items, Versions, and Activities.
 * 2. Learner Content Progress telemetry.
 * 3. Personal Lexicon with SM-2 Spaced Repetition.
 * 4. Pedagogical Mistake Notebook.
 * 
 * Invariants:
 * - Local-First: works seamlessly offline via Dexie v5 and memory fallback.
 * - Cache-Aside: fetches published content from Supabase when connected, caches in Dexie.
 * - Published versions are immutable; updates spawn new draft editions.
 * - Multilingual lemma collision protection.
 */

import {
  ContentItem,
  ContentVersion,
  LearningActivity,
  LearnerContentProgress,
  UserSavedWord,
  UserMistake,
  ContentGenre,
  ContentStatus,
  MistakeStatus,
  ErrorCategory,
  validateStructuredPayload,
  validateActivityConfiguration,
} from '../types/contentCentred';
import { Language, ExplanationLanguage, CEFRLevel } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  localDb,
  cacheContentItemLocal,
  getCachedContentItemsLocal,
  getCachedContentItemLocal,
  saveLearnerProgressLocal,
  getLearnerProgressLocal,
  getAllLearnerProgressLocal,
  saveUserWordLocal,
  getUserSavedWordsLocal,
  saveUserMistakeLocal,
  getUserMistakesLocal,
  getUserMistakeByIdLocal,
} from './localDb';
import { SRSService } from './srs';
import { syncEngine } from './syncEngine';
import { authService } from './auth';

// ============================================================================
// SEED AUTHENTIC LEARNING CONTENT
// ============================================================================

export const SEED_CONTENT_ITEMS: Array<ContentItem & { version: ContentVersion; activities: LearningActivity[] }> = [
  {
    id: 'ci_coffee_dublin_001',
    title: 'A Morning Coffee in Dublin',
    slug: 'a-morning-coffee-in-dublin',
    target_language: 'en' as Language,
    explanation_language: 'pt' as ExplanationLanguage,
    source_language: 'en',
    summary: 'A short descriptive narrative exploring the atmosphere and conversational nuances of a traditional Dublin café.',
    genre: 'culture_and_travel' as ContentGenre,
    primary_cefr: 'B1' as CEFRLevel,
    estimated_read_minutes: 3,
    status: 'published' as ContentStatus,
    current_version_id: 'cv_coffee_dublin_v1',
    rights_status: 'public_domain',
    attribution_notice: 'Authentic educational dialogue crafted for Lexilume.',
    author: 'Lexilume Pedagogical Editorial',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    version: {
      id: 'cv_coffee_dublin_v1',
      content_item_id: 'ci_coffee_dublin_001',
      version_number: 1,
      cefr_level: 'B1' as CEFRLevel,
      word_count: 85,
      sentence_count: 5,
      lexical_density: 0.52,
      is_published: true,
      published_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      audio_metadata: {},
      structured_payload: {
        title: 'A Morning Coffee in Dublin',
        paragraphs: [
          {
            id: 'p1',
            order: 1,
            sentences: [
              {
                id: 's1',
                order: 1,
                text: 'The barista poured the velvety flat white into a warm ceramic cup with gentle precision.',
                translations: {
                  pt: 'O barista despejou o flat white aveludado em uma xícara de cerâmica quente com suave precisão.',
                  es: 'El barista sirvió el flat white aterciopelado en una taza de cerámica caliente con suave precisión.',
                },
                tokens: [
                  { text: 'The', lemma: 'the', pos: 'DET', cefr: 'A1' },
                  { text: 'barista', lemma: 'barista', pos: 'NOUN', cefr: 'B1' },
                  { text: 'poured', lemma: 'pour', pos: 'VERB', cefr: 'A2' },
                  { text: 'the', lemma: 'the', pos: 'DET', cefr: 'A1' },
                  { text: 'velvety', lemma: 'velvety', pos: 'ADJ', cefr: 'B2', gloss_id: 'g_velvety' },
                  { text: 'flat white', lemma: 'flat white', pos: 'NOUN', cefr: 'B1', gloss_id: 'g_flat_white' },
                  { text: 'into', lemma: 'into', pos: 'PREP', cefr: 'A1' },
                  { text: 'a', lemma: 'a', pos: 'DET', cefr: 'A1' },
                  { text: 'warm', lemma: 'warm', pos: 'ADJ', cefr: 'A2' },
                  { text: 'ceramic', lemma: 'ceramic', pos: 'ADJ', cefr: 'B1' },
                  { text: 'cup', lemma: 'cup', pos: 'NOUN', cefr: 'A1' },
                  { text: 'with', lemma: 'with', pos: 'PREP', cefr: 'A1' },
                  { text: 'gentle', lemma: 'gentle', pos: 'ADJ', cefr: 'B1' },
                  { text: 'precision', lemma: 'precision', pos: 'NOUN', cefr: 'B2', gloss_id: 'g_precision' },
                ],
              },
              {
                id: 's2',
                order: 2,
                text: 'Outside, morning rain tapped rhythmic patterns against the tall Victorian window panes.',
                translations: {
                  pt: 'Do lado de fora, a chuva matinal tamborilava padrões rítmicos contra as altas vidraças vitorianas.',
                  es: 'Afuera, la lluvia matutina repiqueteaba patrones rítmicos contra los altos cristales victorianos.',
                },
                tokens: [
                  { text: 'Outside', lemma: 'outside', pos: 'ADV', cefr: 'A1' },
                  { text: 'morning', lemma: 'morning', pos: 'NOUN', cefr: 'A1' },
                  { text: 'rain', lemma: 'rain', pos: 'NOUN', cefr: 'A1' },
                  { text: 'tapped', lemma: 'tap', pos: 'VERB', cefr: 'B1', gloss_id: 'g_tap' },
                  { text: 'rhythmic', lemma: 'rhythmic', pos: 'ADJ', cefr: 'B2' },
                  { text: 'patterns', lemma: 'pattern', pos: 'NOUN', cefr: 'B1' },
                  { text: 'against', lemma: 'against', pos: 'PREP', cefr: 'A2' },
                  { text: 'the', lemma: 'the', pos: 'DET', cefr: 'A1' },
                  { text: 'tall', lemma: 'tall', pos: 'ADJ', cefr: 'A1' },
                  { text: 'Victorian', lemma: 'Victorian', pos: 'ADJ', cefr: 'B1' },
                  { text: 'window panes', lemma: 'window pane', pos: 'NOUN', cefr: 'B2' },
                ],
              },
            ],
          },
          {
            id: 'p2',
            order: 2,
            sentences: [
              {
                id: 's3',
                order: 3,
                text: 'Commuters shook their umbrellas near the doorway, greeting the owner with warm familiar smiles.',
                translations: {
                  pt: 'Os passageiros sacudiam seus guarda-chuvas perto da entrada, cumprimentando o proprietário com sorrisos calorosos e familiares.',
                  es: 'Los viajeros sacudían sus paraguas cerca de la puerta, saludando al dueño con cálidas sonrisas familiares.',
                },
                tokens: [
                  { text: 'Commuters', lemma: 'commuter', pos: 'NOUN', cefr: 'B2', gloss_id: 'g_commuter' },
                  { text: 'shook', lemma: 'shake', pos: 'VERB', cefr: 'A2' },
                  { text: 'their', lemma: 'their', pos: 'DET', cefr: 'A1' },
                  { text: 'umbrellas', lemma: 'umbrella', pos: 'NOUN', cefr: 'A1' },
                  { text: 'near', lemma: 'near', pos: 'PREP', cefr: 'A1' },
                  { text: 'the', lemma: 'the', pos: 'DET', cefr: 'A1' },
                  { text: 'doorway', lemma: 'doorway', pos: 'NOUN', cefr: 'B1' },
                ],
              },
              {
                id: 's4',
                order: 4,
                text: 'The rich aroma of freshly roasted Ethiopian beans filled the room, offering comfort from the chilly Dublin breeze.',
                translations: {
                  pt: 'O aroma encorpado de grãos etíopes recém-torrados preenchia o ambiente, oferecendo conforto contra a brisa fria de Dublin.',
                  es: 'El rico aroma de los granos etíopes recién tostados llenaba la habitación, ofreciendo consuelo contra la fría brisa de Dublín.',
                },
                tokens: [
                  { text: 'aroma', lemma: 'aroma', pos: 'NOUN', cefr: 'B1', gloss_id: 'g_aroma' },
                  { text: 'roasted', lemma: 'roast', pos: 'ADJ', cefr: 'B1' },
                  { text: 'comfort', lemma: 'comfort', pos: 'NOUN', cefr: 'B1' },
                  { text: 'chilly', lemma: 'chilly', pos: 'ADJ', cefr: 'B1', gloss_id: 'g_chilly' },
                  { text: 'breeze', lemma: 'breeze', pos: 'NOUN', cefr: 'B1' },
                ],
              },
            ],
          },
        ],
        annotations: {
          g_velvety: {
            id: 'g_velvety',
            term: 'velvety',
            lemma: 'velvety',
            pos: 'adjective',
            cefr: 'B2' as CEFRLevel,
            ipa: '/ˈvɛl.və.ti/',
            contextual_meaning: 'Having a soft, smooth, creamy texture pleasant to the palate.',
            general_definition: 'Resembling or having the soft feel of velvet.',
            context_translation: {
              pt: 'aveludado, cremoso',
              es: 'aterciopelado, cremoso',
            },
            example_sentence: 'The barista poured the velvety flat white into a warm ceramic cup.',
          },
          g_commuter: {
            id: 'g_commuter',
            term: 'commuter',
            lemma: 'commuter',
            pos: 'noun',
            cefr: 'B2' as CEFRLevel,
            ipa: '/kəˈmjuː.tər/',
            contextual_meaning: 'A person who travels some distance to work on a regular basis.',
            general_definition: 'Someone traveling regularly between home and workplace.',
            context_translation: {
              pt: 'trabalhador pendular, passageiro diário',
              es: 'persona que viaja diariamente al trabajo',
            },
            example_sentence: 'Commuters shook their umbrellas near the doorway.',
          },
          g_chilly: {
            id: 'g_chilly',
            term: 'chilly',
            lemma: 'chilly',
            pos: 'adjective',
            cefr: 'B1' as CEFRLevel,
            ipa: '/ˈtʃɪl.i/',
            contextual_meaning: 'Noticeably cold and crisp, causing slight shivering.',
            general_definition: 'Unpleasantly cold.',
            context_translation: {
              pt: 'frio, gelado',
              es: 'frío, fresco',
            },
            example_sentence: 'Offering comfort from the chilly Dublin breeze.',
          },
        },
        grammar_points: [
          {
            id: 'gram_past_simple_desc',
            title: 'Simple Past for Narrative Scene Setting',
            target_tokens: ['poured', 'tapped', 'shook', 'filled'],
            explanation_summary: 'English narratives frequently use past simple verbs (regular -ed and irregular forms) to describe sequential actions in a story.',
            explanations: {
              pt: 'Verbos no passado simples descrevem ações sequenciais e concluídas em narrativas literárias.',
              es: 'Los verbos en pasado simple describen acciones secuenciales y completadas en narrativas.',
            },
          },
        ],
      },
    },
    activities: [
      {
        id: 'act_dublin_01',
        content_version_id: 'cv_coffee_dublin_v1',
        activity_type: 'reading_comprehension',
        activity_title: 'Reading Comprehension',
        activity_order: 1,
        estimated_minutes: 4,
        created_at: new Date().toISOString(),
        configuration: {
          instructions: 'Choose the best answer based on the story details.',
          questions: [
            {
              id: 'q1',
              type: 'multiple_choice',
              stem: 'What was the weather like outside the café?',
              options: [
                { id: 'opt_1', text: 'It was a clear and sunny morning' },
                { id: 'opt_2', text: 'It was raining and chilly' },
                { id: 'opt_3', text: 'There was heavy snow blocking the entrance' },
                { id: 'opt_4', text: 'It was stormy with loud thunder' },
              ],
              correct_answer: 'It was raining and chilly',
              explanation: 'The text states that "morning rain tapped rhythmic patterns" and mentions the "chilly Dublin breeze".',
              reference_sentence_id: 's2',
            },
            {
              id: 'q2',
              type: 'true_false',
              stem: 'The customers entered the café silently without greeting anyone.',
              options: [
                { id: 'opt_t', text: 'True' },
                { id: 'opt_f', text: 'False' },
              ],
              correct_answer: 'False',
              explanation: 'The story notes that commuters greeted the owner with warm familiar smiles.',
              reference_sentence_id: 's3',
            },
            {
              id: 'q3',
              type: 'multiple_choice',
              stem: 'In the sentence, what does "velvety" flat white describe?',
              options: [
                { id: 'opt_v1', text: 'The dark black color of the liquid' },
                { id: 'opt_v2', text: 'The smooth, creamy texture of the milk and espresso' },
                { id: 'opt_v3', text: 'The bitter temperature of the drink' },
                { id: 'opt_v4', text: 'The cup made from soft fabric' },
              ],
              correct_answer: 'The smooth, creamy texture of the milk and espresso',
              explanation: '"Velvety" is used to describe a soft, rich, smooth texture reminiscent of velvet.',
              reference_sentence_id: 's1',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'ci_lisbon_morning_002',
    title: 'Um Passeio pelo Bairro Alto',
    slug: 'um-passeio-pelo-bairro-alto',
    target_language: 'pt' as Language,
    explanation_language: 'en' as ExplanationLanguage,
    source_language: 'pt',
    summary: 'Uma caminhada matinal pelas ladeiras históricas de Lisboa ao som do elétrico 28.',
    genre: 'culture_and_travel' as ContentGenre,
    primary_cefr: 'A2' as CEFRLevel,
    estimated_read_minutes: 2,
    status: 'published' as ContentStatus,
    current_version_id: 'cv_lisbon_v1',
    rights_status: 'public_domain',
    attribution_notice: 'Authentic educational dialogue crafted for Lexilume.',
    author: 'Lexilume Pedagogical Editorial',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    version: {
      id: 'cv_lisbon_v1',
      content_item_id: 'ci_lisbon_morning_002',
      version_number: 1,
      cefr_level: 'A2' as CEFRLevel,
      word_count: 70,
      sentence_count: 4,
      lexical_density: 0.48,
      is_published: true,
      published_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      audio_metadata: {},
      structured_payload: {
        title: 'Um Passeio pelo Bairro Alto',
        paragraphs: [
          {
            id: 'p1',
            order: 1,
            sentences: [
              {
                id: 's1',
                order: 1,
                text: 'O elétrico amarelo sobe a ladeira de paralelepípedos com o seu som característico.',
                translations: {
                  en: 'The yellow tram climbs the cobblestone slope with its characteristic sound.',
                  es: 'El tranvía amarillo sube la cuesta empedrada con su sonido característico.',
                },
                tokens: [
                  { text: 'O', lemma: 'o', pos: 'DET', cefr: 'A1' },
                  { text: 'elétrico', lemma: 'elétrico', pos: 'NOUN', cefr: 'A1', gloss_id: 'g_eletrico' },
                  { text: 'amarelo', lemma: 'amarelo', pos: 'ADJ', cefr: 'A1' },
                  { text: 'sobe', lemma: 'subir', pos: 'VERB', cefr: 'A1' },
                  { text: 'a', lemma: 'o', pos: 'DET', cefr: 'A1' },
                  { text: 'ladeira', lemma: 'ladeira', pos: 'NOUN', cefr: 'A2', gloss_id: 'g_ladeira' },
                  { text: 'de', lemma: 'de', pos: 'PREP', cefr: 'A1' },
                  { text: 'paralelepípedos', lemma: 'paralelepípedo', pos: 'NOUN', cefr: 'B1' },
                ],
              },
              {
                id: 's2',
                order: 2,
                text: 'Os azulejos coloridos nas fachadas dos edifícios refletem a luz dourada do sol da manhã.',
                translations: {
                  en: 'The colorful ceramic tiles on the building facades reflect the golden morning sunlight.',
                  es: 'Los azulejos coloridos en las fachadas de los edificios reflejan la luz dorada del sol de la mañana.',
                },
                tokens: [
                  { text: 'azulejos', lemma: 'azulejo', pos: 'NOUN', cefr: 'A2', gloss_id: 'g_azulejo' },
                  { text: 'coloridos', lemma: 'colorido', pos: 'ADJ', cefr: 'A1' },
                  { text: 'fachadas', lemma: 'fachada', pos: 'NOUN', cefr: 'B1' },
                  { text: 'luz', lemma: 'luz', pos: 'NOUN', cefr: 'A1' },
                  { text: 'dourada', lemma: 'dourado', pos: 'ADJ', cefr: 'A2' },
                ],
              },
            ],
          },
        ],
        annotations: {
          g_ladeira: {
            id: 'g_ladeira',
            term: 'ladeira',
            lemma: 'ladeira',
            pos: 'noun',
            cefr: 'A2' as CEFRLevel,
            contextual_meaning: 'A steep urban street or slope.',
            general_definition: 'Terreno inclinado, subida íngreme.',
            context_translation: {
              en: 'steep hill, slope, incline',
              es: 'cuesta, pendiente',
            },
            example_sentence: 'O elétrico amarelo sobe a ladeira de paralelepípedos.',
          },
          g_azulejo: {
            id: 'g_azulejo',
            term: 'azulejo',
            lemma: 'azulejo',
            pos: 'noun',
            cefr: 'A2' as CEFRLevel,
            contextual_meaning: 'Traditional glazed ceramic tile used to decorate Portuguese architecture.',
            general_definition: 'Placa de cerâmica vitrificada com motivos ornamentais.',
            context_translation: {
              en: 'ceramic tile, azulejo',
              es: 'azulejo',
            },
            example_sentence: 'Os azulejos coloridos nas fachadas dos edifícios.',
          },
        },
        grammar_points: [
          {
            id: 'gram_presente_habitual',
            title: 'Presente do Indicativo para Descrição',
            target_tokens: ['sobe', 'refletem'],
            explanation_summary: 'O presente simples é utilizado para descrever cenas habituais e características físicas.',
            explanations: {
              en: 'Present tense is used for narrative description of ongoing or habitual states.',
            },
          },
        ],
      },
    },
    activities: [
      {
        id: 'act_lisbon_01',
        content_version_id: 'cv_lisbon_v1',
        activity_type: 'reading_comprehension',
        activity_title: 'Compreensão de Leitura',
        activity_order: 1,
        estimated_minutes: 3,
        created_at: new Date().toISOString(),
        configuration: {
          instructions: 'Responda às perguntas sobre o texto.',
          questions: [
            {
              id: 'q_lisbon_1',
              type: 'multiple_choice',
              stem: 'O que sobe a ladeira de paralelepípedos?',
              options: [
                { id: 'opt_pt_1', text: 'Um elétrico amarelo' },
                { id: 'opt_pt_2', text: 'Um autocarro moderno' },
                { id: 'opt_pt_3', text: 'Uma bicicleta antiga' },
              ],
              correct_answer: 'Um elétrico amarelo',
              explanation: 'O texto diz explicitamente: "O elétrico amarelo sobe a ladeira...".',
              reference_sentence_id: 's1',
            },
          ],
        },
      },
    ],
  },
  {
    id: 'ci_madrid_mercado_003',
    title: 'Tapas en el Mercado de San Miguel',
    slug: 'tapas-en-el-mercado-de-san-miguel',
    target_language: 'es' as Language,
    explanation_language: 'en' as ExplanationLanguage,
    source_language: 'es',
    summary: 'Una visita gastronómica por los puestos de un bullicioso mercado madrileño.',
    genre: 'dialogue' as ContentGenre,
    primary_cefr: 'A2' as CEFRLevel,
    estimated_read_minutes: 2,
    status: 'published' as ContentStatus,
    current_version_id: 'cv_madrid_v1',
    rights_status: 'public_domain',
    attribution_notice: 'Authentic educational dialogue crafted for Lexilume.',
    author: 'Lexilume Pedagogical Editorial',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    version: {
      id: 'cv_madrid_v1',
      content_item_id: 'ci_madrid_mercado_003',
      version_number: 1,
      cefr_level: 'A2' as CEFRLevel,
      word_count: 65,
      sentence_count: 4,
      lexical_density: 0.46,
      is_published: true,
      published_at: new Date(Date.now() - 86400000).toISOString(),
      created_at: new Date(Date.now() - 86400000).toISOString(),
      audio_metadata: {},
      structured_payload: {
        title: 'Tapas en el Mercado de San Miguel',
        paragraphs: [
          {
            id: 'p1',
            order: 1,
            sentences: [
              {
                id: 's1',
                order: 1,
                text: 'El aroma a jamón ibérico y pan tostado llena los pasillos animados del mercado.',
                translations: {
                  en: 'The aroma of Iberian ham and toasted bread fills the lively corridors of the market.',
                  pt: 'O aroma de presunto ibérico e pão torrado preenche os corredores animados do mercado.',
                },
                tokens: [
                  { text: 'El', lemma: 'el', pos: 'DET', cefr: 'A1' },
                  { text: 'aroma', lemma: 'aroma', pos: 'NOUN', cefr: 'A2' },
                  { text: 'jamón', lemma: 'jamón', pos: 'NOUN', cefr: 'A1', gloss_id: 'g_jamon' },
                  { text: 'ibérico', lemma: 'ibérico', pos: 'ADJ', cefr: 'B1' },
                  { text: 'pasillos', lemma: 'pasillo', pos: 'NOUN', cefr: 'A2', gloss_id: 'g_pasillo' },
                  { text: 'animados', lemma: 'animado', pos: 'ADJ', cefr: 'A2' },
                ],
              },
            ],
          },
        ],
        annotations: {
          g_jamon: {
            id: 'g_jamon',
            term: 'jamón',
            lemma: 'jamón',
            pos: 'noun',
            cefr: 'A1' as CEFRLevel,
            contextual_meaning: 'Traditional Spanish cured ham.',
            general_definition: 'Carne curada de la pata del cerdo.',
            context_translation: {
              en: 'cured ham, Spanish ham',
              pt: 'presunto curado',
            },
            example_sentence: 'El aroma a jamón ibérico y pan tostado.',
          },
          g_pasillo: {
            id: 'g_pasillo',
            term: 'pasillo',
            lemma: 'pasillo',
            pos: 'noun',
            cefr: 'A2' as CEFRLevel,
            contextual_meaning: 'A corridor or aisle inside a market or building.',
            general_definition: 'Paso largo y estrecho de un edificio.',
            context_translation: {
              en: 'aisle, corridor, hallway',
              pt: 'corredor',
            },
            example_sentence: 'Llena los pasillos animados del mercado.',
          },
        },
        grammar_points: [
          {
            id: 'gram_adjetivo_posicion',
            title: 'Posición de los Adjetivos Calificativos',
            target_tokens: ['ibérico', 'tostado', 'animados'],
            explanation_summary: 'En español, la mayoría de los adjetivos descriptivos van después del sustantivo.',
            explanations: {
              en: 'In Spanish, descriptive adjectives typically follow the noun they modify.',
            },
          },
        ],
      },
    },
    activities: [
      {
        id: 'act_madrid_01',
        content_version_id: 'cv_madrid_v1',
        activity_type: 'reading_comprehension',
        activity_title: 'Comprensión Lectora',
        activity_order: 1,
        estimated_minutes: 3,
        created_at: new Date().toISOString(),
        configuration: {
          instructions: 'Elige la opción correcta según el texto.',
          questions: [
            {
              id: 'q_es_1',
              type: 'multiple_choice',
              stem: '¿Qué aroma llena los pasillos del mercado?',
              options: [
                { id: 'opt_es_1', text: 'Jamón ibérico y pan tostado' },
                { id: 'opt_es_2', text: 'Pescado frito y limones' },
                { id: 'opt_es_3', text: 'Flores frescas y frutas' },
              ],
              correct_answer: 'Jamón ibérico y pan tostado',
              explanation: 'El texto menciona directamente el aroma a jamón ibérico y pan tostado.',
              reference_sentence_id: 's1',
            },
          ],
        },
      },
    ],
  },
];

// In-memory registry of items and versions for fast synchronous lookup & offline operation
const localItemsRegistry = new Map<string, ContentItem & { version?: ContentVersion; activities?: LearningActivity[] }>();
const localVersionsRegistry = new Map<string, ContentVersion>();
const localActivitiesRegistry = new Map<string, LearningActivity[]>();

// Initialize memory seed registry
for (const seed of SEED_CONTENT_ITEMS) {
  localItemsRegistry.set(seed.id, seed);
  localVersionsRegistry.set(seed.version.id, seed.version);
  localActivitiesRegistry.set(seed.version.id, seed.activities);
}

// ============================================================================
// CONTENT CENTRED SERVICE CLASS
// ============================================================================

export class ContentCentredService {
  private static instance: ContentCentredService;

  private constructor() {
    this.hydrateFromDexie();
  }

  public static getInstance(): ContentCentredService {
    if (!ContentCentredService.instance) {
      ContentCentredService.instance = new ContentCentredService();
    }
    return ContentCentredService.instance;
  }

  private async hydrateFromDexie(): Promise<void> {
    try {
      const items = await getCachedContentItemsLocal();
      for (const item of items) {
        localItemsRegistry.set(item.id, item);
        if (item.version) {
          localVersionsRegistry.set(item.version.id, item.version);
        }
      }
      // Cache seeds in localDb if empty
      if (items.length === 0) {
        for (const seed of SEED_CONTENT_ITEMS) {
          await cacheContentItemLocal(seed);
        }
      }
    } catch (e) {
      console.warn('[ContentCentredService] Error hydrating from localDb:', e);
    }
  }

  // ==========================================================================
  // 1. CONTENT CATALOG OPERATIONS
  // ==========================================================================

  public async getContentItems(filters?: {
    target_language?: Language;
    cefr_level?: CEFRLevel;
    genre?: ContentGenre;
    status?: ContentStatus;
  }): Promise<ContentItem[]> {
    let items: ContentItem[] = [];

    // 1. Attempt query from Supabase if online
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('content_items').select('*');
        if (filters?.status) {
          query = query.eq('status', filters.status);
        } else {
          query = query.eq('status', 'published');
        }
        if (filters?.target_language) query = query.eq('target_language', filters.target_language);
        if (filters?.genre) query = query.eq('genre', filters.genre);
        if (filters?.cefr_level) query = query.eq('primary_cefr', filters.cefr_level);

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          items = data as ContentItem[];
          for (const it of items) {
            localItemsRegistry.set(it.id, it);
            cacheContentItemLocal(it);
          }
        }
      } catch (err) {
        // Fall back to local
      }
    }

    // 2. Fall back to local registry & Dexie cache
    if (items.length === 0) {
      const allLocal = Array.from(localItemsRegistry.values());
      items = allLocal.filter(it => {
        if (filters?.status && it.status !== filters.status) return false;
        if (!filters?.status && it.status !== 'published') return false;
        if (filters?.target_language && it.target_language !== filters.target_language) return false;
        if (filters?.genre && it.genre !== filters.genre) return false;
        if (filters?.cefr_level && it.primary_cefr !== filters.cefr_level) return false;
        return true;
      });
    }

    return items;
  }

  public async getContentItemById(id: string): Promise<(ContentItem & { version?: ContentVersion }) | null> {
    // Check local memory first
    const cached = localItemsRegistry.get(id);
    if (cached && cached.version) return cached;

    // Check Dexie
    const local = await getCachedContentItemLocal(id);
    if (local && local.version) return local;

    // Check Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('content_items').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          const item = data as ContentItem;
          if (item.current_version_id) {
            const version = await this.getContentVersion(item.current_version_id);
            const combined = { ...item, version: version || undefined };
            localItemsRegistry.set(item.id, combined);
            cacheContentItemLocal(combined);
            return combined;
          }
          return item;
        }
      } catch (e) {
        // Ignore
      }
    }

    return cached || local || null;
  }

  public async getContentVersion(versionId: string): Promise<ContentVersion | null> {
    if (localVersionsRegistry.has(versionId)) {
      return localVersionsRegistry.get(versionId)!;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('content_versions').select('*').eq('id', versionId).maybeSingle();
        if (!error && data) {
          const version = data as ContentVersion;
          localVersionsRegistry.set(version.id, version);
          return version;
        }
      } catch (e) {
        // Ignore
      }
    }

    return null;
  }

  public async getActivitiesForVersion(versionId: string): Promise<LearningActivity[]> {
    if (localActivitiesRegistry.has(versionId)) {
      return localActivitiesRegistry.get(versionId)!;
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('learning_activities')
          .select('*')
          .eq('content_version_id', versionId)
          .order('activity_order', { ascending: true });
        if (!error && data && data.length > 0) {
          const acts = data as LearningActivity[];
          localActivitiesRegistry.set(versionId, acts);
          return acts;
        }
      } catch (e) {
        // Ignore
      }
    }

    return [];
  }

  // ==========================================================================
  // 2. ADMIN CREATION & PUBLICATION (Immutability & Role Enforced)
  // ==========================================================================

  private assertAdminRole(systemBypass: boolean = false): void {
    if (systemBypass) return;
    const auth = authService.getState();
    if (auth.role !== 'admin') {
      throw new Error('Access denied: Administrative privileges required to modify learning content catalog.');
    }
  }

  private assertUserAccess(targetUserId: string): void {
    const auth = authService.getState();
    if (!auth.isGuest && auth.user && auth.role !== 'admin' && auth.user.id !== targetUserId) {
      throw new Error(`Access denied: Cross-tenant access violation. User ${auth.user.id} cannot access data belonging to ${targetUserId}.`);
    }
  }

  public async saveContentItem(item: Partial<ContentItem>, options?: { systemBypass?: boolean }): Promise<ContentItem> {
    this.assertAdminRole(options?.systemBypass);
    const id = item.id || `ci_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullItem: ContentItem = {
      id,
      title: item.title || 'Untitled Learning Text',
      slug: item.slug || `item-${Date.now()}`,
      target_language: item.target_language || ('en' as Language),
      explanation_language: item.explanation_language || ('en' as ExplanationLanguage),
      source_language: item.source_language || 'en',
      summary: item.summary || '',
      genre: item.genre || ('conversation' as ContentGenre),
      primary_cefr: item.primary_cefr || ('B1' as CEFRLevel),
      estimated_read_minutes: item.estimated_read_minutes || 3,
      status: item.status || ('draft' as ContentStatus),
      current_version_id: item.current_version_id,
      source_id: item.source_id,
      rights_status: item.rights_status || 'public_domain',
      rights_notes: item.rights_notes,
      source_url: item.source_url,
      author: item.author || 'Editorial Staff',
      created_by: item.created_by,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    localItemsRegistry.set(fullItem.id, fullItem);
    await cacheContentItemLocal(fullItem);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('content_items').upsert(fullItem, { onConflict: 'id' });
      } catch (e) {
        console.warn('[ContentCentredService] Supabase item save failed, retained in local storage:', e);
      }
    }

    return fullItem;
  }

  public async saveContentVersion(version: Partial<ContentVersion>, options?: { systemBypass?: boolean }): Promise<ContentVersion> {
    this.assertAdminRole(options?.systemBypass);
    if (!version.content_item_id) {
      throw new Error('content_item_id is required to create a content version');
    }

    // Strict immutability enforcement on published versions (RISK-804)
    if (version.id && localVersionsRegistry.has(version.id)) {
      const existing = localVersionsRegistry.get(version.id)!;
      if (existing.is_published) {
        if (
          version.structured_payload !== undefined ||
          (version.cefr_level !== undefined && version.cefr_level !== existing.cefr_level) ||
          version.is_published === false
        ) {
          throw new Error('Published content versions are immutable. Create a new version edition instead (version_number + 1).');
        }
      }
    }

    // Validate structured payload bounds and schema (Milestone 8.1 / Section 5.4)
    if (version.structured_payload) {
      const validation = validateStructuredPayload(version.structured_payload);
      if (!validation.valid) {
        throw new Error(`Invalid structured payload: ${validation.errors.join('; ')}`);
      }
    }

    const id = version.id || `cv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullVersion: ContentVersion = {
      id,
      content_item_id: version.content_item_id,
      version_number: version.version_number || 1,
      cefr_level: version.cefr_level || ('B1' as CEFRLevel),
      structured_payload: version.structured_payload || {
        title: 'Untitled',
        paragraphs: [],
        annotations: {},
        grammar_points: [],
      },
      audio_metadata: version.audio_metadata || {},
      word_count: version.word_count || 0,
      sentence_count: version.sentence_count || 0,
      lexical_density: version.lexical_density || 0.5,
      is_published: Boolean(version.is_published),
      change_summary: version.change_summary,
      created_by: version.created_by,
      published_at: version.is_published ? (version.published_at || new Date().toISOString()) : undefined,
      created_at: version.created_at || new Date().toISOString(),
    };

    localVersionsRegistry.set(fullVersion.id, fullVersion);

    // Update parent item in local registry
    const parent = localItemsRegistry.get(fullVersion.content_item_id);
    if (parent) {
      parent.version = fullVersion;
      if (fullVersion.is_published) {
        parent.current_version_id = fullVersion.id;
      }
      cacheContentItemLocal(parent);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('content_versions').upsert(fullVersion, { onConflict: 'id' });
      } catch (e) {
        console.warn('[ContentCentredService] Supabase version save failed, retained in localDb:', e);
      }
    }

    return fullVersion;
  }

  public async publishContentVersion(itemId: string, versionId: string, options?: { systemBypass?: boolean }): Promise<void> {
    this.assertAdminRole(options?.systemBypass);
    const version = await this.getContentVersion(versionId);
    if (!version) throw new Error(`Content version ${versionId} not found`);

    version.is_published = true;
    version.published_at = new Date().toISOString();
    localVersionsRegistry.set(version.id, version);

    const item = await this.getContentItemById(itemId);
    if (item) {
      item.status = 'published';
      item.current_version_id = version.id;
      item.version = version;
      localItemsRegistry.set(item.id, item);
      await cacheContentItemLocal(item);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('content_versions').update({
          is_published: true,
          published_at: version.published_at,
        }).eq('id', version.id);

        await supabase.from('content_items').update({
          status: 'published',
          current_version_id: version.id,
          updated_at: new Date().toISOString(),
        }).eq('id', itemId);
      } catch (e) {
        console.warn('[ContentCentredService] Remote publish update failed, saved locally:', e);
      }
    }
  }

  public async saveLearningActivity(activity: Partial<LearningActivity>, options?: { systemBypass?: boolean }): Promise<LearningActivity> {
    this.assertAdminRole(options?.systemBypass);
    if (!activity.content_version_id) {
      throw new Error('content_version_id is required');
    }

    if (activity.configuration) {
      const validation = validateActivityConfiguration(activity.configuration);
      if (!validation.valid) {
        throw new Error(`Invalid activity configuration: ${validation.errors.join('; ')}`);
      }
    }
    const id = activity.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullActivity: LearningActivity = {
      id,
      content_version_id: activity.content_version_id,
      activity_type: activity.activity_type || 'reading_comprehension',
      activity_title: activity.activity_title || 'Comprehension Activity',
      activity_order: activity.activity_order || 1,
      estimated_minutes: activity.estimated_minutes || 5,
      configuration: activity.configuration || { instructions: '', questions: [] },
      created_at: activity.created_at || new Date().toISOString(),
    };

    const existing = localActivitiesRegistry.get(fullActivity.content_version_id) || [];
    const index = existing.findIndex(a => a.id === fullActivity.id);
    if (index >= 0) {
      existing[index] = fullActivity;
    } else {
      existing.push(fullActivity);
    }
    localActivitiesRegistry.set(fullActivity.content_version_id, existing);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('learning_activities').upsert(fullActivity, { onConflict: 'id' });
      } catch (e) {
        console.warn('[ContentCentredService] Activity save to Supabase failed:', e);
      }
    }

    return fullActivity;
  }

  // ==========================================================================
  // 3. LEARNER PROGRESS TELEMETRY
  // ==========================================================================

  public async getLearnerProgress(userId: string, contentItemId: string, versionId?: string): Promise<LearnerContentProgress | null> {
    this.assertUserAccess(userId);
    const local = await getLearnerProgressLocal(userId, contentItemId, versionId);
    if (local) return local;

    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('learner_content_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('content_item_id', contentItemId);
        if (versionId) {
          query = query.eq('content_version_id', versionId);
        }
        const { data, error } = await query
          .order('last_studied_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          const rec = data as LearnerContentProgress;
          await saveLearnerProgressLocal(rec);
          return rec;
        }
      } catch (e) {
        // ignore
      }
    }

    return null;
  }

  public async getAllLearnerProgress(userId: string): Promise<LearnerContentProgress[]> {
    this.assertUserAccess(userId);
    const local = await getAllLearnerProgressLocal(userId);
    if (local.length > 0) return local;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('learner_content_progress')
          .select('*')
          .eq('user_id', userId);
        if (!error && data) {
          const records = data as LearnerContentProgress[];
          for (const rec of records) {
            await saveLearnerProgressLocal(rec);
          }
          return records;
        }
      } catch (e) {
        // ignore
      }
    }

    return local;
  }

  public async updateLearnerProgress(
    progress: Partial<LearnerContentProgress> & { user_id: string; content_item_id: string; content_version_id?: string }
  ): Promise<LearnerContentProgress> {
    this.assertUserAccess(progress.user_id);
    const existing = await this.getLearnerProgress(progress.user_id, progress.content_item_id, progress.content_version_id);
    const id = existing?.id || progress.id || `lcp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const fullRecord: LearnerContentProgress = {
      id,
      user_id: progress.user_id,
      content_item_id: progress.content_item_id,
      content_version_id: progress.content_version_id || existing?.content_version_id || 'v1',
      status: progress.status || existing?.status || 'in_progress',
      percent_complete: progress.percent_complete !== undefined ? progress.percent_complete : (existing?.percent_complete || 0),
      completed_activity_ids: progress.completed_activity_ids || existing?.completed_activity_ids || [],
      time_spent_seconds: (existing?.time_spent_seconds || 0) + (progress.time_spent_seconds || 0),
      comprehension_score: progress.comprehension_score !== undefined ? progress.comprehension_score : existing?.comprehension_score,
      client_mutation_id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      first_opened_at: existing?.first_opened_at || new Date().toISOString(),
      last_studied_at: new Date().toISOString(),
      completed_at: progress.percent_complete === 100 ? (existing?.completed_at || new Date().toISOString()) : existing?.completed_at,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveLearnerProgressLocal(fullRecord);
    syncEngine.queueAction('SYNC_LEARNER_PROGRESS', fullRecord, progress.user_id);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('learner_content_progress').upsert(fullRecord, { onConflict: 'user_id,content_item_id' });
      } catch (e) {
        console.warn('[ContentCentredService] Cloud progress sync queued locally:', e);
      }
    }

    return fullRecord;
  }

  // ==========================================================================
  // 4. PERSONAL VOCABULARY & SM-2 SPDCED REPETITION
  // ==========================================================================

  public async getUserSavedWords(userId: string, targetLanguage?: Language): Promise<UserSavedWord[]> {
    this.assertUserAccess(userId);
    const localWords = await getUserSavedWordsLocal(userId, targetLanguage);
    if (localWords.length > 0) return localWords;

    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('user_saved_words').select('*').eq('user_id', userId);
        if (targetLanguage) q = q.eq('target_language', targetLanguage);
        const { data, error } = await q.order('next_review', { ascending: true });
        if (!error && data) {
          const words = data as UserSavedWord[];
          for (const w of words) {
            await saveUserWordLocal(w);
          }
          return words;
        }
      } catch (e) {
        // ignore
      }
    }

    return localWords;
  }

  public async saveUserWord(
    word: Partial<UserSavedWord> & {
      user_id: string;
      term: string;
      lemma: string;
      target_language: Language;
      explanation_language: ExplanationLanguage;
      definition: string;
    }
  ): Promise<UserSavedWord> {
    this.assertUserAccess(word.user_id);
    const existingWords = await this.getUserSavedWords(word.user_id, word.target_language);
    const pos = word.pos || 'other';
    const existing = existingWords.find(
      w => w.lemma.toLowerCase() === word.lemma.toLowerCase() &&
           w.pos === pos &&
           w.explanation_language === word.explanation_language
    );

    const id = existing?.id || word.id || `usw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullWord: UserSavedWord = {
      id,
      user_id: word.user_id,
      target_language: word.target_language,
      explanation_language: word.explanation_language,
      term: word.term,
      lemma: word.lemma,
      pos,
      cefr_level: word.cefr_level || existing?.cefr_level,
      definition: word.definition,
      context_sentence: word.context_sentence || existing?.context_sentence,
      context_translation: word.context_translation || existing?.context_translation,
      source_content_id: word.source_content_id || existing?.source_content_id,
      source_version_id: word.source_version_id || existing?.source_version_id,
      audio_url: word.audio_url || existing?.audio_url,
      ipa: word.ipa || existing?.ipa,
      client_mutation_id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ease_factor: word.ease_factor || existing?.ease_factor || 2.5,
      interval_days: word.interval_days !== undefined ? word.interval_days : (existing?.interval_days || 0),
      repetitions: word.repetitions !== undefined ? word.repetitions : (existing?.repetitions || 0),
      lapses: word.lapses !== undefined ? word.lapses : (existing?.lapses || 0),
      last_reviewed_at: word.last_reviewed_at || existing?.last_reviewed_at,
      next_review: word.next_review || existing?.next_review || new Date().toISOString().split('T')[0],
      legacy_srs_item_id: word.legacy_srs_item_id || existing?.legacy_srs_item_id,
      state: word.state || existing?.state || 'learning',
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveUserWordLocal(fullWord);
    syncEngine.queueAction('SYNC_USER_SAVED_WORD', fullWord, word.user_id);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('user_saved_words').upsert(fullWord, {
          onConflict: 'user_id,target_language,lemma,pos,explanation_language',
        });
      } catch (e) {
        console.warn('[ContentCentredService] Supabase word save failed, kept locally:', e);
      }
    }

    return fullWord;
  }

  public async recordWordReview(userId: string, wordId: string, rating: number): Promise<UserSavedWord> {
    this.assertUserAccess(userId);
    const words = await this.getUserSavedWords(userId);
    const word = words.find(w => w.id === wordId);
    if (!word) throw new Error(`Saved word ${wordId} not found`);

    const srsState = {
      user_id: word.user_id,
      language: word.target_language,
      vocabulary_item_id: word.lemma,
      ease_factor: word.ease_factor,
      interval_days: word.interval_days,
      repetition_count: word.repetitions,
      lapse_count: word.lapses,
      last_reviewed_at: word.last_reviewed_at || null,
      next_review_date: word.next_review,
      mastery_status: word.state as any,
      history: [],
    };

    const nextState = SRSService.calculateNextState(srsState as any, rating);

    word.ease_factor = nextState.ease_factor;
    word.interval_days = nextState.interval_days;
    word.repetitions = nextState.repetition_count;
    word.lapses = nextState.lapse_count;
    word.last_reviewed_at = new Date().toISOString();
    word.next_review = nextState.next_review_date;
    word.state = nextState.mastery_status as any;
    word.updated_at = new Date().toISOString();

    await saveUserWordLocal(word);
    syncEngine.queueAction('SYNC_USER_SAVED_WORD', word, userId);
    syncEngine.queueAction('SYNC_WORD_REVIEW_EVENT', {
      user_id: userId,
      saved_word_id: word.id,
      rating,
      previous_interval_days: srsState.interval_days,
      new_interval_days: nextState.interval_days,
      previous_ease_factor: srsState.ease_factor,
      new_ease_factor: nextState.ease_factor,
      reviewed_at: new Date().toISOString(),
    }, userId);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('user_saved_words').update({
          ease_factor: word.ease_factor,
          interval_days: word.interval_days,
          repetitions: word.repetitions,
          lapses: word.lapses,
          last_reviewed_at: word.last_reviewed_at,
          next_review: word.next_review,
          state: word.state,
          updated_at: word.updated_at,
        }).eq('id', word.id);

        await supabase.from('user_word_review_events').insert({
          user_id: userId,
          saved_word_id: word.id,
          rating,
          previous_interval_days: srsState.interval_days,
          new_interval_days: nextState.interval_days,
          previous_ease_factor: srsState.ease_factor,
          new_ease_factor: nextState.ease_factor,
          reviewed_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[ContentCentredService] Supabase review sync queued locally:', e);
      }
    }

    return word;
  }

  // ==========================================================================
  // 5. MISTAKE NOTEBOOK
  // ==========================================================================

  public async getUserMistakes(
    userId: string,
    status?: MistakeStatus,
    category?: ErrorCategory
  ): Promise<UserMistake[]> {
    this.assertUserAccess(userId);
    const local = await getUserMistakesLocal(userId);
    let filtered = local;
    if (status) filtered = filtered.filter(m => m.status === status);
    if (category) filtered = filtered.filter(m => m.error_category === category);

    if (filtered.length > 0) return filtered;

    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('user_mistakes').select('*').eq('user_id', userId);
        if (status) q = q.eq('status', status);
        if (category) q = q.eq('error_category', category);
        const { data, error } = await q.order('last_occurred_at', { ascending: false });
        if (!error && data) {
          const remoteMistakes = data as UserMistake[];
          for (const m of remoteMistakes) {
            await saveUserMistakeLocal(m);
          }
          return remoteMistakes;
        }
      } catch (e) {
        // ignore
      }
    }

    return filtered;
  }

  public async recordUserMistake(
    mistake: Partial<UserMistake> & {
      user_id: string;
      stimulus: string;
      user_response: string;
      correct_response: string;
      pedagogical_explanation: string;
    }
  ): Promise<UserMistake> {
    this.assertUserAccess(mistake.user_id);
    const allMistakes = await this.getUserMistakes(mistake.user_id);
    const existing = allMistakes.find(
      m => m.stimulus === mistake.stimulus && m.status !== 'dismissed' && m.status !== 'mastered'
    );

    const id = existing?.id || mistake.id || `mstk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullMistake: UserMistake = {
      id,
      user_id: mistake.user_id,
      content_item_id: mistake.content_item_id || existing?.content_item_id,
      content_version_id: mistake.content_version_id || existing?.content_version_id,
      activity_id: mistake.activity_id || existing?.activity_id,
      activity_type: mistake.activity_type || existing?.activity_type || 'reading_comprehension',
      error_category: mistake.error_category || existing?.error_category || 'general',
      stimulus: mistake.stimulus,
      user_response: mistake.user_response,
      correct_response: mistake.correct_response,
      pedagogical_explanation: mistake.pedagogical_explanation,
      status: 'unresolved',
      occurrences_count: (existing?.occurrences_count || 0) + 1,
      client_mutation_id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      first_occurred_at: existing?.first_occurred_at || new Date().toISOString(),
      last_occurred_at: new Date().toISOString(),
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await saveUserMistakeLocal(fullMistake);
    syncEngine.queueAction('SYNC_USER_MISTAKE', fullMistake, mistake.user_id);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('user_mistakes').upsert(fullMistake, { onConflict: 'id' });
      } catch (e) {
        console.warn('[ContentCentredService] Supabase mistake save queued locally:', e);
      }
    }

    return fullMistake;
  }

  public async resolveUserMistake(mistakeId: string, status: MistakeStatus = 'mastered'): Promise<UserMistake> {
    const local = await getUserMistakesLocal('guest'); // Query all or by ID
    const mistake = await getUserMistakeByIdLocal(mistakeId);
    if (!mistake) {
      throw new Error(`Mistake ${mistakeId} not found`);
    }
    this.assertUserAccess(mistake.user_id);

    mistake.status = status;
    mistake.resolved_at = new Date().toISOString();
    mistake.updated_at = new Date().toISOString();

    await saveUserMistakeLocal(mistake);
    syncEngine.queueAction('SYNC_USER_MISTAKE', mistake, mistake.user_id);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('user_mistakes').update({
          status: mistake.status,
          resolved_at: mistake.resolved_at,
          updated_at: mistake.updated_at,
        }).eq('id', mistakeId);
      } catch (e) {
        // ignore
      }
    }

    return mistake;
  }
}

export const contentCentredService = ContentCentredService.getInstance();
