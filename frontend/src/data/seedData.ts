import {
  CurriculumNode,
  DiagnosticQuestion,
} from '../types';

/**
 * Structural CEFR curriculum blueprints and placement test rubric.
 * Learning items (vocabulary, grammar lessons, reading, dialogues, exercises)
 * are served exclusively from AI Content Engine publications and external open APIs.
 */

export const ptCurriculum: CurriculumNode[] = [
  {
    id: "pt-a1-01",
    language: "pt",
    cefr_level: "A1",
    sequence_order: 1,
    title: "Apresentações e Verbos Regulares no Presente",
    slug: "apresentacoes-presente-regular",
    skill_category: "grammar",
    can_do_statement: "Pode apresentar-se e usar saudações e verbos regulares em -ar, -er e -ir no presente do indicativo.",
    description: "Fundamentos da conjugação no presente e pronomes pessoais.",
    regional_relevance: "all",
    prerequisite_node_id: null,
    is_consolidation_review: false
  },
  {
    id: "pt-a2-01",
    language: "pt",
    cefr_level: "A2",
    sequence_order: 1,
    title: "Pretérito Perfeito vs. Imperfeito do Indicativo",
    slug: "passado-perfeito-imperfeito",
    skill_category: "grammar",
    can_do_statement: "Pode narrar eventos passados distinguindo ações pontuais concluídas de hábitos contínuos ou descrições no passado.",
    description: "Contraste narrativo entre pretérito perfeito e imperfeito.",
    regional_relevance: "all",
    prerequisite_node_id: "pt-a1-01",
    is_consolidation_review: false
  },
  {
    id: "pt-b1-01",
    language: "pt",
    cefr_level: "B1",
    sequence_order: 1,
    title: "Presente do Subjuntivo e Expressão de Desejo e Dúvida",
    slug: "presente-subjuntivo-desejo",
    skill_category: "grammar",
    can_do_statement: "Pode formular hipóteses, desejos e conselhos subordinados utilizando o presente do conjuntivo/subjuntivo.",
    description: "Estruturas que exigem o subjuntivo após verbos de opinião, dúvida e vontade.",
    regional_relevance: "all",
    prerequisite_node_id: "pt-a2-01",
    is_consolidation_review: false
  },
  {
    id: "pt-b2-01",
    language: "pt",
    cefr_level: "B2",
    sequence_order: 1,
    title: "Pretérito Imperfeito do Subjuntivo e Orações Condicionais",
    slug: "imperfeito-subjuntivo-condicional",
    skill_category: "grammar",
    can_do_statement: "Pode construir hipóteses irreais ou improváveis utilizando 'Se eu pudesse, faria'.",
    description: "Articulação entre o imperfeito do subjuntivo (-sse) e o futuro do pretérito (-ria).",
    regional_relevance: "all",
    prerequisite_node_id: "pt-b1-01",
    is_consolidation_review: false
  },
  {
    id: "pt-c1-01",
    language: "pt",
    cefr_level: "C1",
    sequence_order: 1,
    title: "Infinitivo Pessoal Flexionado em Orações Reduzidas",
    slug: "infinitivo-pessoal-flexionado",
    skill_category: "grammar",
    can_do_statement: "Pode expressar relações causais, finais e temporais complexas empregando o infinitivo pessoal flexionado com clareza estilística C1.",
    description: "Flexão e sintaxe do infinitivo pessoal (-es, -mos, -des, -em) após preposições e sujeitos expressos.",
    regional_relevance: "all",
    prerequisite_node_id: "pt-b2-01",
    is_consolidation_review: false
  },
  {
    id: "pt-c1-02",
    language: "pt",
    cefr_level: "C1",
    sequence_order: 2,
    title: "Futuro do Subjuntivo e Conectores Temporais e Condicionais",
    slug: "futuro-do-subjuntivo-conectores",
    skill_category: "grammar",
    can_do_statement: "Pode estruturar cláusulas futuras subordinadas com precisão idiomática empregando quando, se, assim que e enquanto.",
    description: "Conjugação e regência do futuro do subjuntivo (quando eu for, se você quiser).",
    regional_relevance: "all",
    prerequisite_node_id: "pt-c1-01",
    is_consolidation_review: false
  },
  {
    id: "pt-c1-03",
    language: "pt",
    cefr_level: "C1",
    sequence_order: 3,
    title: "Colocação Pronominal: Próclise, Ênclise e Mesóclise",
    slug: "colocacao-pronominal-c1",
    skill_category: "grammar",
    can_do_statement: "Pode alternar com fluência natural entre padrões brasileiros e europeus de colocação de pronomes clíticos em registros formais.",
    description: "Regras clássicas de colocação pronominal e contrastes sociolinguísticos entre Brasil e Portugal.",
    regional_relevance: "all",
    prerequisite_node_id: "pt-c1-02",
    is_consolidation_review: false
  },
  {
    id: "pt-c1-04",
    language: "pt",
    cefr_level: "C1",
    sequence_order: 4,
    title: "Consolidação e Revisão C1: Articulação Discursiva Avançada",
    slug: "consolidacao-revisao-c1-pt",
    skill_category: "discourse",
    can_do_statement: "Pode sintetizar ideias complexas de múltiplos domínios e defender teses com sofisticação vocabular e argumentativa.",
    description: "Revisão e consolidação de competências C1 em orações subordinadas e marcadores discursivos.",
    regional_relevance: "all",
    prerequisite_node_id: "pt-c1-03",
    is_consolidation_review: true
  }
];

export const esCurriculum: CurriculumNode[] = [
  {
    id: "es-a1-01",
    language: "es",
    cefr_level: "A1",
    sequence_order: 1,
    title: "Presente de Indicativo y Verbos Ser, Estar y Tener",
    slug: "presente-indicativo-ser-estar",
    skill_category: "grammar",
    can_do_statement: "Puede presentarse, pedir y dar información básica y usar los verbos fundamentales ser, estar y tener.",
    description: "Bases de la conjugación regular e irregular en presente y distinción ser vs estar.",
    regional_relevance: "all",
    prerequisite_node_id: null,
    is_consolidation_review: false
  },
  {
    id: "es-a2-01",
    language: "es",
    cefr_level: "A2",
    sequence_order: 1,
    title: "Pretérito Indefinido vs. Pretérito Imperfecto",
    slug: "indefinido-vs-imperfecto",
    skill_category: "grammar",
    can_do_statement: "Puede relatar anécdotas y biografías contrastando acciones puntuales terminadas y descripciones habituales.",
    description: "Contraste en el pasado entre pretérito perfecto simple (indefinido) e imperfecto.",
    regional_relevance: "all",
    prerequisite_node_id: "es-a1-01",
    is_consolidation_review: false
  },
  {
    id: "es-b1-01",
    language: "es",
    cefr_level: "B1",
    sequence_order: 1,
    title: "Presente de Subjuntivo: Deseos, Valoraciones y Emociones",
    slug: "presente-subjuntivo-deseos",
    skill_category: "grammar",
    can_do_statement: "Puede expresar opiniones personales, dudas y valoraciones subjetivas utilizando el presente de subjuntivo.",
    description: "Subjuntivo en oraciones sustantivas tras matrices de emoción, juicio de valor y duda.",
    regional_relevance: "all",
    prerequisite_node_id: "es-a2-01",
    is_consolidation_review: false
  },
  {
    id: "es-b2-01",
    language: "es",
    cefr_level: "B2",
    sequence_order: 1,
    title: "Imperfecto de Subjuntivo y Oraciones Condicionales con Si",
    slug: "imperfecto-subjuntivo-condicionales",
    skill_category: "grammar",
    can_do_statement: "Puede argumentar sobre situaciones hipotéticas poco probables o irreales ('Si tuviera tiempo, lo haría').",
    description: "Conjugaciones en -ra y -se del imperfecto de subjuntivo y prótasis condicionales.",
    regional_relevance: "all",
    prerequisite_node_id: "es-b1-01",
    is_consolidation_review: false
  },
  {
    id: "es-c1-01",
    language: "es",
    cefr_level: "C1",
    sequence_order: 1,
    title: "Subjuntivo en Oraciones Concesivas Complejas",
    slug: "subjuntivo-concesivas-c1",
    skill_category: "grammar",
    can_do_statement: "Puede matizar argumentos formales empleando nexos concesivos avanzados como por mucho que, por más que, aun cuando y a riesgo de que.",
    description: "Selección modal entre indicativo y subjuntivo en estructuras concesivas de alta complejidad.",
    regional_relevance: "all",
    prerequisite_node_id: "es-b2-01",
    is_consolidation_review: false
  },
  {
    id: "es-c1-02",
    language: "es",
    cefr_level: "C1",
    sequence_order: 2,
    title: "Hipótesis en el Pasado y Pluscuamperfecto de Subjuntivo",
    slug: "hipotesis-pasado-pluscuamperfecto",
    skill_category: "grammar",
    can_do_statement: "Puede formular reflexiones retrospectivas y lamentos condicionales con 'si hubiera/hubiese sabido... habría/hubiera hecho'.",
    description: "Condicionales irreales en el pasado y correlaciones temporales de alta precisión.",
    regional_relevance: "all",
    prerequisite_node_id: "es-c1-01",
    is_consolidation_review: false
  },
  {
    "id": "es-c1-03",
    "language": "es",
    "cefr_level": "C1",
    "sequence_order": 3,
    "title": "Conectores Discursivos Metatextuales y Argumentativos",
    "slug": "conectores-discursivos-c1",
    "skill_category": "discourse",
    "can_do_statement": "Puede estructurar exposiciones orales y ensayos académicos con conectores de reformulación, contraargumentación y digresión.",
    "description": "Uso de marcadores discursivos C1: no obstante, por consiguiente, antes bien, en resumidas cuentas.",
    "regional_relevance": "all",
    "prerequisite_node_id": "es-c1-02",
    "is_consolidation_review": false
  },
  {
    "id": "es-c1-04",
    "language": "es",
    "cefr_level": "C1",
    "sequence_order": 4,
    "title": "Consolidación C1: Matices Sociolingüísticos y Estilísticos",
    "slug": "consolidacion-revision-c1-es",
    "skill_category": "discourse",
    "can_do_statement": "Puede modular su registro con flexibilidad estilística y discernir variantes peninsulares y americanas.",
    "description": "Revisión integrada de estructuras gramaticales complejas y contrastes peninsular vs americano.",
    "regional_relevance": "all",
    "prerequisite_node_id": "es-c1-03",
    "is_consolidation_review": true
  }
];

export const enCurriculum: CurriculumNode[] = [
  {
    id: "en-a1-01",
    language: "en",
    cefr_level: "A1",
    sequence_order: 1,
    title: "Introductions and Daily Routines in the Present Simple",
    slug: "introductions-present-simple",
    skill_category: "grammar",
    can_do_statement: "Can introduce oneself, describe daily routines, and ask basic questions using the present simple.",
    description: "Core fundamentals of present simple, subject-verb agreement, and basic personal introductions.",
    regional_relevance: "all",
    prerequisite_node_id: null,
    is_consolidation_review: false
  },
  {
    id: "en-a2-01",
    language: "en",
    cefr_level: "A2",
    sequence_order: 1,
    title: "Past Simple Narratives and Time Expressions",
    slug: "past-simple-narratives",
    skill_category: "grammar",
    can_do_statement: "Can narrate past events, describe personal experiences, and use regular and irregular past verbs.",
    description: "Contrast between regular and irregular past verbs with sequential connectors.",
    regional_relevance: "all",
    prerequisite_node_id: "en-a1-01",
    is_consolidation_review: false
  },
  {
    id: "en-b1-01",
    language: "en",
    cefr_level: "B1",
    sequence_order: 1,
    title: "Present Perfect vs. Past Simple in Professional Contexts",
    slug: "present-perfect-vs-past-simple",
    skill_category: "grammar",
    can_do_statement: "Can explain project milestones and ongoing achievements contrasting present perfect with past simple.",
    description: "Distinguishing completed actions at specific past times from ongoing or recent life experiences.",
    regional_relevance: "all",
    prerequisite_node_id: "en-a2-01",
    is_consolidation_review: false
  },
  {
    id: "en-b2-01",
    language: "en",
    cefr_level: "B2",
    sequence_order: 1,
    title: "Modal Verbs of Deduction and Mixed Conditionals",
    slug: "modal-verbs-deduction-conditionals",
    skill_category: "grammar",
    can_do_statement: "Can hypothesize about past and present scenarios with modal verbs (must have, might have, could have).",
    description: "Nuanced epistemic modality and counterfactual reasoning.",
    regional_relevance: "all",
    prerequisite_node_id: "en-b1-01",
    is_consolidation_review: false
  },
  {
    id: "en-c1-01",
    language: "en",
    cefr_level: "C1",
    sequence_order: 1,
    title: "Negative Inversion and Rhetorical Fronting for Emphasis",
    slug: "negative-inversion-rhetorical-fronting",
    skill_category: "grammar",
    can_do_statement: "Can employ negative inversion (rarely, seldom, no sooner) and fronting to produce high-register academic and professional prose.",
    description: "Advanced syntactic transformation for emphasis, persuasion, and formal written discourse.",
    regional_relevance: "all",
    prerequisite_node_id: "en-b2-01",
    is_consolidation_review: false
  },
  {
    id: "en-c1-02",
    language: "en",
    cefr_level: "C1",
    sequence_order: 2,
    title: "Cleft Sentences and Nuanced Hedging in Discourse",
    slug: "cleft-sentences-hedging",
    skill_category: "discourse",
    can_do_statement: "Can use wh-clefts and it-clefts along with hedging markers to moderate claims in technical discussions.",
    description: "Syntactic clefting and epistemic hedges in executive discourse.",
    regional_relevance: "all",
    prerequisite_node_id: "en-c1-01",
    is_consolidation_review: false
  }
];

export const diagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: "diag-pt-a1-01",
    language: "pt",
    cefr_level: "A1",
    skill: "grammar",
    prompt: "Complete a frase: 'Olá, eu _____ brasileiro e moro em São Paulo.'",
    options: ["sou", "estou", "tem", "faço"],
    correct_option_index: 0,
    explanation: "Usa-se o verbo 'ser' ('sou') para indicar nacionalidade e identidade permanente.",
    grammatical_focus: "Verbos ser vs estar no presente do indicativo"
  },
  {
    id: "diag-pt-a2-01",
    language: "pt",
    cefr_level: "A2",
    skill: "grammar",
    prompt: "Ontem eu _____ o trabalho muito tarde, mas antigamente eu _____ sempre cedo.",
    options: [
      "terminei / saía",
      "terminava / saí",
      "terminei / saí",
      "terminava / saía"
    ],
    correct_option_index: 0,
    explanation: "'Ontem' pede pretérito perfeito pontual ('terminei'); 'antigamente' pede pretérito imperfeito habitual ('saía').",
    grammatical_focus: "Pretérito perfeito vs pretérito imperfeito"
  },
  {
    id: "diag-pt-b1-01",
    language: "pt",
    cefr_level: "B1",
    skill: "grammar",
    prompt: "Duvido muito que a diretoria _____ a proposta nesta semana.",
    options: ["aceite", "aceita", "aceitou", "aceitará"],
    correct_option_index: 0,
    explanation: "Verbos de dúvida ('duvidar que') regem obrigatoriamente o presente do subjuntivo ('aceite').",
    grammatical_focus: "Regência do presente do subjuntivo após dúvida"
  },
  {
    id: "diag-pt-b2-01",
    language: "pt",
    cefr_level: "B2",
    skill: "grammar",
    prompt: "Se nós _____ mais tempo hábil, teríamos viajado para Lisboa.",
    options: ["tivéssemos", "temos", "teríamos", "tínhamos"],
    correct_option_index: 0,
    explanation: "Na oração condicional contrafactual com apódose no condicional composto, a prótase exige o pretérito imperfeito do subjuntivo ('tivéssemos').",
    grammatical_focus: "Condicionais irreais com se + imperfeito do subjuntivo"
  },
  {
    id: "diag-es-a1-01",
    language: "es",
    cefr_level: "A1",
    skill: "grammar",
    prompt: "Complete: 'Nosotros _____ dos hermanos y vivimos en Valencia.'",
    options: ["tenemos", "somos", "estamos", "hacemos"],
    correct_option_index: 0,
    explanation: "Para expresar parentesco o posesión se utiliza el verbo 'tener' ('tenemos').",
    grammatical_focus: "Verbo tener en presente de indicativo"
  },
  {
    id: "diag-es-a2-01",
    language: "es",
    cefr_level: "A2",
    skill: "grammar",
    prompt: "El año pasado _____ a Buenos Aires; durante el vuelo _____ una película clásica.",
    options: [
      "viajé / vi",
      "viajaba / vi",
      "viajé / veía",
      "viajaba / veía"
    ],
    correct_option_index: 0,
    explanation: "Ambas acciones son hechos puntuales terminados en el pasado ('viajé' y 'vi').",
    grammatical_focus: "Pretérito indefinido puntual"
  },
  {
    id: "diag-es-b1-01",
    language: "es",
    cefr_level: "B1",
    skill: "grammar",
    prompt: "No creo que el equipo _____ el partido de mañana.",
    options: ["pierda", "pierde", "perdió", "perderá"],
    correct_option_index: 0,
    explanation: "La matriz negativa de opinión ('no creo que') rige obligatoriamente subjuntivo ('pierda').",
    grammatical_focus: "Subjuntivo tras negación de verbos de opinión"
  },
  {
    id: "diag-es-b2-01",
    language: "es",
    cefr_level: "B2",
    skill: "grammar",
    prompt: "Si ellos _____ llegado a la hora fijada, no habrían perdido el tren.",
    options: ["hubieran", "habrían", "tuvieran", "hayan"],
    correct_option_index: 0,
    explanation: "En las condicionales del pasado, la prótasis con 'si' exige pluscuamperfecto de subjuntivo ('hubieran' o 'hubiesen').",
    grammatical_focus: "Condicionales en el pasado con pluscuamperfecto de subjuntivo"
  },
  {
    id: "diag-en-a1-01",
    language: "en",
    cefr_level: "A1",
    skill: "grammar",
    prompt: "Complete the sentence: 'Hello, my name is Alex and I _____ from London.'",
    options: ["am", "is", "are", "have"],
    correct_option_index: 0,
    explanation: "First-person singular 'I' takes the auxiliary verb 'am'.",
    grammatical_focus: "Verb to be in the present simple"
  },
  {
    id: "diag-en-a2-01",
    language: "en",
    cefr_level: "A2",
    skill: "grammar",
    prompt: "While we _____ dinner last night, the power suddenly went out.",
    options: ["were having", "had", "are having", "have had"],
    correct_option_index: 0,
    explanation: "Continuous background actions in the past interrupted by a point event use past continuous ('were having').",
    grammatical_focus: "Past continuous vs past simple"
  },
  {
    id: "diag-en-b1-01",
    language: "en",
    cefr_level: "B1",
    skill: "grammar",
    prompt: "She _____ at the tech startup since 2021 and has led multiple key initiatives.",
    options: ["has worked", "worked", "is working", "works"],
    correct_option_index: 0,
    explanation: "Actions starting in the past and continuing to the present introduced by 'since' require the present perfect ('has worked').",
    grammatical_focus: "Present perfect with since/for"
  },
  {
    id: "diag-en-b2-01",
    language: "en",
    cefr_level: "B2",
    skill: "grammar",
    prompt: "If the engineering team _____ the critical vulnerability earlier, the security breach would not have occurred.",
    options: ["had patched", "would patch", "patched", "have patched"],
    correct_option_index: 0,
    explanation: "Third conditional if-clauses expressing counterfactual past conditions require the past perfect ('had patched').",
    grammatical_focus: "Third conditional with past perfect"
  },
  {
    id: "diag-en-c1-01",
    language: "en",
    cefr_level: "C1",
    skill: "grammar",
    prompt: "Rarely _____ such exceptional alignment between executive leadership and technical execution.",
    options: ["do we witness", "we witness", "we do witness", "witness we"],
    correct_option_index: 0,
    explanation: "Negative and restrictive adverbials fronted for rhetorical emphasis require subject-auxiliary inversion ('do we witness').",
    grammatical_focus: "Negative inversion with fronted adverbials"
  }
];
