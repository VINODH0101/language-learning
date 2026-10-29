import {
  Attribution,
  Language,
  CurriculumNode,
  VocabularyItem,
  GrammarRule,
  ExerciseTemplate,
  CuratedMaterial,
  FalseFriendItem,
  DiagnosticQuestion,
} from '../types';

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

export const ptVocabulary: VocabularyItem[] = [
  {
    id: "pt-voc-01",
    language: "pt",
    lemma: "conquanto",
    part_of_speech: "conjunction",
    cefr_level: "C1",
    definition_en: "although, even though, albeit (formal concessive conjunction)",
    definition_target: "Conjunção subordinativa concessiva formal que introduz uma oração indicativa de ressalva ou oposição.",
    phonetic_ipa: "/kõˈkwɐ̃.tu/",
    regional_tags: ["all"],
    example_sentence_target: "Conquanto houvesse divergências profundas, os delegados firmaram o tratado de cooperação.",
    example_sentence_en: "Although there were deep disagreements, the delegates signed the cooperation treaty.",
    collocations: ["conquanto seja verdade", "conquanto haja controvérsias"],
    audio_url: "https://tatoeba.org/audio/pt/conquanto_sample.mp3",
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Sentence example adapted from Tatoeba Project contributors under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-02",
    language: "pt",
    lemma: "paulatinamente",
    part_of_speech: "adverb",
    cefr_level: "C1",
    definition_en: "gradually, step by step, slowly but steadily",
    definition_target: "De modo paulatino; aos poucos, gradativamente, com vagar e constância.",
    phonetic_ipa: "/paw.la.tʃi.naˈmẽ.tʃi/",
    regional_tags: ["all"],
    example_sentence_target: "A economia nacional recuperou-se paulatinamente após as reformas estruturais implementadas.",
    example_sentence_en: "The national economy recovered gradually following the implemented structural reforms.",
    collocations: ["avançar paulatinamente", "evoluir paulatinamente"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://pt.wiktionary.org/wiki/paulatinamente",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition and usage notes from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "pt-voc-03",
    language: "pt",
    lemma: "primordial",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "essential, primordial, of paramount importance",
    definition_target: "Que é de suma importância; basilar, fundamental, originário.",
    phonetic_ipa: "/pɾi.mɔʁ.dʒiˈaw/",
    regional_tags: ["all"],
    example_sentence_target: "O diálogo construtivo revelou-se um elemento primordial para a manutenção da paz institucional.",
    example_sentence_en: "Constructive dialogue proved to be a primordial element for maintaining institutional peace.",
    collocations: ["papel primordial", "importância primordial"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://pt.wiktionary.org/wiki/primordial",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "pt-voc-04",
    language: "pt",
    lemma: "esquisito",
    part_of_speech: "adjective",
    cefr_level: "B2",
    definition_en: "weird, strange, odd, bizarre (NOT exquisite)",
    definition_target: "Que foge ao habitual; estranho, bizarro, singular, excêntrico.",
    phonetic_ipa: "/is.kiˈzi.tu/",
    regional_tags: ["all"],
    example_sentence_target: "Aquele comportamento esquisito durante a reunião surpreendeu todos os conselheiros presentes.",
    example_sentence_en: "That weird behavior during the meeting surprised all the board members present.",
    collocations: ["comportamento esquisito", "sensação esquisita"],
    audio_url: null,
    false_friend_warning: "Falso amigo crítico com o espanhol 'exquisito' (que significa delicioso/excelente). Em português significa estranho!",
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://pt.wiktionary.org/wiki/esquisito",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "pt-voc-05",
    language: "pt",
    lemma: "desfecho",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "outcome, conclusion, denouement, finale",
    definition_target: "Resultado final de um processo, narrativa, conflito ou negociação.",
    phonetic_ipa: "/desˈfe.ʃu/",
    regional_tags: ["all"],
    example_sentence_target: "O desfecho das deliberações parlamentares surpreendeu analistas políticos e cidadãos.",
    example_sentence_en: "The outcome of parliamentary deliberations surprised political analysts and citizens alike.",
    collocations: ["desfecho trágico", "desfecho inesperado", "desfecho favorável"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://pt.wiktionary.org/wiki/desfecho",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "pt-voc-06",
    language: "pt",
    lemma: "corroborar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to corroborate, to confirm, to give support to an argument",
    definition_target: "Confirmar, autenticar ou comprovar uma tese, alegação ou teoria com dados.",
    phonetic_ipa: "/ko.ʁo.boˈʁaʁ/",
    regional_tags: ["all"],
    example_sentence_target: "As evidências científicas recentemente coletadas corroboram as hipóteses iniciais do estudo.",
    example_sentence_en: "The newly collected scientific evidence corroborates the initial hypotheses of the study.",
    collocations: ["corroborar a tese", "corroborar evidências", "dados que corroboram"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Sample sentence adapted from Tatoeba Project under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-07",
    language: "pt",
    lemma: "propina",
    part_of_speech: "noun",
    cefr_level: "B2",
    definition_en: "bribe/kickback in Brazilian Portuguese; tuition/school fee in European Portuguese (NOT tip)",
    definition_target: "No Brasil: quantia paga a título de suborno; em Portugal: taxa ou anuidade universitária.",
    phonetic_ipa: "/pɾoˈpi.nɐ/",
    regional_tags: ["all"],
    example_sentence_target: "O escândalo envolveu acusações graves de pagamento ilícito de propina a agentes públicos.",
    example_sentence_en: "The scandal involved serious accusations of illicit bribe payments to public officials.",
    collocations: ["recebimento de propina", "pagar propinas universitárias"],
    audio_url: null,
    false_friend_warning: "Falso amigo com o espanhol 'propina' (que significa gorjeta/tip).",
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://pt.wiktionary.org/wiki/propina",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Linguistic notes from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "pt-voc-08",
    language: "pt",
    lemma: "inexorável",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "inexorable, relentless, unavoidable",
    definition_target: "Que não se deixa subornar nem demover; inflexível, implacável, inevitável.",
    phonetic_ipa: "/i.ne.zoˈɾa.vɛw/",
    regional_tags: ["all"],
    example_sentence_target: "A marcha inexorável do tempo transforma costumes e estruturas sociais consolidadas.",
    example_sentence_en: "The inexorable march of time transforms customs and consolidated social structures.",
    collocations: ["avanço inexorável", "realidade inexorável"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://pt.wiktionary.org/wiki/inexorável",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "pt-voc-09",
    language: "pt",
    lemma: "prerrogativa",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "prerogative, privilege, exclusive right inherent to an office",
    definition_target: "Direito exclusivo, privilégio ou regalia ligado a determinado cargo, função ou poder.",
    phonetic_ipa: "/pɾe.ʁo.ɡaˈtʃi.vɐ/",
    regional_tags: ["all"],
    example_sentence_target: "O julgamento constitucional compete como prerrogativa indelegável à Suprema Corte.",
    example_sentence_en: "Constitutional adjudication belongs as an indelegable prerogative to the Supreme Court.",
    collocations: ["prerrogativa legal", "exercer prerrogativas"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://pt.wiktionary.org/wiki/prerrogativa",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "pt-voc-10",
    language: "pt",
    lemma: "subsidiário",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "subsidiary, auxiliary, secondary but complementary",
    definition_target: "Que tem caráter auxiliar, complementar ou secundário em relação a um plano principal.",
    phonetic_ipa: "/sub.si.dʒiˈa.ɾju/",
    regional_tags: ["all"],
    example_sentence_target: "O comitê apresentou um parecer subsidiário para esclarecer dúvidas orçamentárias.",
    example_sentence_en: "The committee presented a subsidiary report to clarify budgetary doubts.",
    collocations: ["caráter subsidiário", "responsabilidade subsidiária"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://pt.wiktionary.org/wiki/subsidiário",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "pt-voc-11",
    language: "pt",
    lemma: "além disso",
    part_of_speech: "idiom",
    cefr_level: "B2",
    definition_en: "furthermore, moreover, besides",
    definition_target: "Locução conjuntiva aditiva usada para encadear novos argumentos ao discurso.",
    phonetic_ipa: "/aˈlẽj ˈdʒi.su/",
    regional_tags: ["all"],
    example_sentence_target: "O projeto reduziu despesas operacionais; além disso, ampliou a produtividade da equipe.",
    example_sentence_en: "The project reduced operating expenses; furthermore, it expanded team productivity.",
    collocations: ["além disso, vale notar"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Sentence sample from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-12",
    language: "pt",
    lemma: "ponderar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to weigh, to ponder, to reflect deeply upon, to evaluate thoughtfully",
    definition_target: "Pesar mentalmente as razões, prós e contras; refletir maduramente.",
    phonetic_ipa: "/põ.deˈʁaʁ/",
    regional_tags: ["all"],
    example_sentence_target: "Cumpre ponderar com prudência os impactos ecológicos antes de autorizar a exploração mineral.",
    example_sentence_en: "It is essential to weigh ecological impacts prudently before authorizing mineral exploration.",
    collocations: ["ponderar as consequências", "cumpre ponderar"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Sentence sample adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-13",
    language: "pt",
    lemma: "preponderância",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "preponderance, supremacy, superior influence or power",
    definition_target: "Qualidade do que é preponderante; peso superior, influência ou predomínio manifesto.",
    phonetic_ipa: "/pɾe.põ.deˈɾɐ̃.si.ɐ/",
    regional_tags: ["all"],
    example_sentence_target: "A preponderância dos fatores tecnológicos redefiniu a concorrência global.",
    example_sentence_en: "The preponderance of technological factors redefined global competition.",
    collocations: ["preponderância manifesta", "exercer preponderância"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-14",
    language: "pt",
    lemma: "salvaguardar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to safeguard, to protect, to preserve from harm",
    definition_target: "Defender, resguardar ou proteger contra ameaça, dano ou degradação.",
    phonetic_ipa: "/sal.va.ɡwaʁˈdaʁ/",
    regional_tags: ["all"],
    example_sentence_target: "É imperativo salvaguardar os mananciais hídricos para as futuras gerações.",
    example_sentence_en: "It is imperative to safeguard water resources for future generations.",
    collocations: ["salvaguardar interesses", "salvaguardar direitos"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-15",
    language: "pt",
    lemma: "conjetura",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "conjecture, hypothesis, supposition based on incomplete evidence",
    definition_target: "Opinião ou hipótese fundada em aparências ou probabilidades; suposição.",
    phonetic_ipa: "/kõ.ʒeˈtu.ɾɐ/",
    regional_tags: ["all"],
    example_sentence_target: "Sem dados empíricos rigorosos, tal conclusão permanece mera conjetura acadêmica.",
    example_sentence_en: "Without rigorous empirical data, such a conclusion remains mere academic conjecture.",
    collocations: ["mera conjetura", "formular conjeturas"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-16",
    language: "pt",
    lemma: "suscitar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to evoke, to prompt, to arouse or cause debate",
    definition_target: "Fazer nascer, provocar, despertar dúvidas, reflexões ou controvérsias.",
    phonetic_ipa: "/su.siˈtaʁ/",
    regional_tags: ["all"],
    example_sentence_target: "A reforma tributária proposta suscitou intensos debates na assembleia legislativa.",
    example_sentence_en: "The proposed tax reform aroused intense debate in the legislative assembly.",
    collocations: ["suscitar dúvidas", "suscitar questionamentos"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-17",
    language: "pt",
    lemma: "inerente",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "inherent, intrinsic, permanently existing in something",
    definition_target: "Inseparável por natureza; que está intrinsecamente ligado a algo.",
    phonetic_ipa: "/i.neˈɾẽ.tʃi/",
    regional_tags: ["all"],
    example_sentence_target: "O risco de volatilidade é inerente a qualquer investimento no mercado de capitais.",
    example_sentence_en: "Volatility risk is inherent to any capital markets investment.",
    collocations: ["inerente à condição humana", "risco inerente"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-18",
    language: "pt",
    lemma: "vicissitude",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "vicissitude, unexpected change of circumstance, hardship",
    definition_target: "Alternância de eventos prósperos e adversos; sucessão de mudanças na vida.",
    phonetic_ipa: "/vi.si.siˈtu.dʒi/",
    regional_tags: ["all"],
    example_sentence_target: "Apesar das vicissitudes econômicas, a instituição manteve seus programas sociais.",
    example_sentence_en: "Despite economic vicissitudes, the institution maintained its social programs.",
    collocations: ["vicissitudes da vida", "enfrentar vicissitudes"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-19",
    language: "pt",
    lemma: "elucidar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to elucidate, to clarify, to explain thoroughly",
    definition_target: "Tornar claro, compreensível; aclarar ou explicar minuciosamente.",
    phonetic_ipa: "/e.lu.siˈdaʁ/",
    regional_tags: ["all"],
    example_sentence_target: "O parecer do perito serviu para elucidar os pontos obscuros da investigação.",
    example_sentence_en: "The expert's report served to elucidate the obscure points of the investigation.",
    collocations: ["elucidar os fatos", "elucidar dúvidas"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-20",
    language: "pt",
    lemma: "pressuposto",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "premise, presupposition, underlying assumption",
    definition_target: "Circunstância ou condição prévia da qual se parte para estabelecer um raciocínio.",
    phonetic_ipa: "/pɾe.suˈpos.tu/",
    regional_tags: ["all"],
    example_sentence_target: "A teoria fundamenta-se no pressuposto de que os mercados operam com racionalidade perfeita.",
    example_sentence_en: "The theory is based on the premise that markets operate with perfect rationality.",
    collocations: ["pressuposto básico", "partir do pressuposto"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-21",
    language: "pt",
    lemma: "inadiável",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "urgent, pressing, that cannot be postponed",
    definition_target: "Que não se pode adiar ou prorrogar; inadiável, premente e imperioso.",
    phonetic_ipa: "/i.na.dʒiˈa.vɛw/",
    regional_tags: ["all"],
    example_sentence_target: "A transição energética tornou-se uma pauta inadiável diante da crise climática.",
    example_sentence_en: "The energy transition has become an unpostponable priority in light of the climate crisis.",
    collocations: ["tarefa inadiável", "necessidade inadiável"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-22",
    language: "pt",
    lemma: "vislumbrar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to glimpse, to discern faintly, to foresee opportunities",
    definition_target: "Enxergar distintamente ao longe; vislumbrar ou pressentir um desfecho favorável.",
    phonetic_ipa: "/viz.lũˈbɾaʁ/",
    regional_tags: ["all"],
    example_sentence_target: "Os analistas já vislumbram sinais consistentes de recuperação econômica.",
    example_sentence_en: "Analysts already glimpse consistent signs of economic recovery.",
    collocations: ["vislumbrar oportunidades", "vislumbrar uma solução"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-23",
    language: "pt",
    lemma: "subsídio",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "subsidy, financial aid, or intellectual contribution/foundation",
    definition_target: "Auxílio financeiro governamental ou conjunto de elementos que servem de base para estudo.",
    phonetic_ipa: "/subˈsi.dʒi.u/",
    regional_tags: ["all"],
    example_sentence_target: "O relatório ofereceu subsídios cruciais para a elaboração do plano diretor metropolitano.",
    example_sentence_en: "The report provided crucial foundations for developing the metropolitan master plan.",
    collocations: ["fornecer subsídios", "concessão de subsídios"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "pt-voc-24",
    language: "pt",
    lemma: "discriminar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to distinguish, to differentiate, to discern between items",
    definition_target: "Distinguir, discernir, especificar item por item (atenção: 'descriminar' significa descriminalizar).",
    phonetic_ipa: "/dis.kɾi.miˈnaʁ/",
    regional_tags: ["all"],
    example_sentence_target: "A nota fiscal deve discriminar pormenorizadamente cada serviço prestado.",
    example_sentence_en: "The invoice must itemize each service rendered in detail.",
    collocations: ["discriminar despesas", "saber discriminar"],
    audio_url: null,
    false_friend_warning: "Parônimo perigoso: 'discriminar' = diferenciar/discernir. 'Descriminar' = absolver de crime/descriminalizar.",
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  }
];

export const esVocabulary: VocabularyItem[] = [
  {
    id: "es-voc-01",
    language: "es",
    lemma: "no obstante",
    part_of_speech: "idiom",
    cefr_level: "C1",
    definition_en: "nevertheless, nonetheless, notwithstanding, however (formal adversative connector)",
    definition_target: "Locución conjuntiva o adverbial adversativa formal que introduce una objeción o contraste atenuado.",
    phonetic_ipa: "/no obʃˈtante/",
    regional_tags: ["all"],
    example_sentence_target: "Los resultados financieros fueron modestos; no obstante, la solvencia patrimonial se mantuvo intacta.",
    example_sentence_en: "The financial results were modest; nonetheless, corporate solvency remained intact.",
    collocations: ["no obstante lo anterior", "no obstante que"],
    audio_url: "https://tatoeba.org/audio/es/no_obstante_sample.mp3",
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Sentence sample from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-02",
    language: "es",
    lemma: "exquisito",
    part_of_speech: "adjective",
    cefr_level: "B2",
    definition_en: "delicious, exquisite, exceptionally tasteful (NOT weird)",
    definition_target: "De singular y extraordinaria calidad, primor o gusto en su especie.",
    phonetic_ipa: "/eks.kiˈsi.to/",
    regional_tags: ["all"],
    example_sentence_target: "El banquete servido durante la gala diplomática ofreció platos de un sabor verdaderamente exquisito.",
    example_sentence_en: "The banquet served during the diplomatic gala offered dishes of truly exquisite flavor.",
    collocations: ["trato exquisito", "sabor exquisito"],
    audio_url: null,
    false_friend_warning: "¡Falso amigo crítico con el portugués 'esquisito' (que significa raro/extraño)! En español denota delicia.",
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://es.wiktionary.org/wiki/exquisito",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "es-voc-03",
    language: "es",
    lemma: "por ende",
    part_of_speech: "idiom",
    cefr_level: "C1",
    definition_en: "therefore, hence, consequently (formal consecutive connector)",
    definition_target: "Locución adverbial consecutiva de registro formal equivalente a por tanto o por consiguiente.",
    phonetic_ipa: "/poɾ ˈen.de/",
    regional_tags: ["all"],
    example_sentence_target: "La tecnología redujo los costos marginales y, por ende, amplió el acceso al mercado.",
    example_sentence_en: "The technology reduced marginal costs and, therefore, broadened market access.",
    collocations: ["y, por ende,", "por ende necesario"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Sentence sample from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-04",
    language: "es",
    lemma: "menester",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "necessity, requirement; duty, occupation ('es menester que...')",
    definition_target: "Falta o necesidad de una cosa; ocupación o ministerio.",
    phonetic_ipa: "/me.nesˈteɾ/",
    regional_tags: ["all"],
    example_sentence_target: "Para consolidar una democracia pluralista, es menester que las instituciones garanticen la transparencia.",
    example_sentence_en: "To consolidate a pluralistic democracy, it is necessary that institutions guarantee transparency.",
    collocations: ["es menester que", "en estos menesteres"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://es.wiktionary.org/wiki/menester",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "es-voc-05",
    language: "es",
    lemma: "propina",
    part_of_speech: "noun",
    cefr_level: "A2",
    definition_en: "tip, gratuity (money given for service; NOT bribe)",
    definition_target: "Agasajo dinerario voluntario que se da a quien presta un servicio por cortesía.",
    phonetic_ipa: "/pɾoˈpi.na/",
    regional_tags: ["all"],
    example_sentence_target: "El cliente satisfecho dejó una generosa propina al camarero al finalizar la cena.",
    example_sentence_en: "The satisfied customer left a generous tip for the waiter upon finishing dinner.",
    collocations: ["dejar propina", "propina voluntaria"],
    audio_url: null,
    false_friend_warning: "¡Falso amigo con el portugués 'propina' (soborno ilícito en Brasil). En español es propina voluntaria.",
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://es.wiktionary.org/wiki/propina",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "es-voc-06",
    language: "es",
    lemma: "corroborar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to corroborate, to confirm, to validate an empirical claim",
    definition_target: "Dar mayor fuerza a una razón, opinión o argumento ya propuesto con nuevos datos.",
    phonetic_ipa: "/ko.ro.βoˈɾaɾ/",
    regional_tags: ["all"],
    example_sentence_target: "Los peritajes forenses permitieron corroborar la declaración testimonial de los testigos presenciales.",
    example_sentence_en: "Forensic inspections made it possible to corroborate the testimonial statement of eyewitnesses.",
    collocations: ["corroborar los hechos", "datos que corroboran"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Sentence sample from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-07",
    language: "es",
    lemma: "soslayar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to bypass, to sidestep, to avoid or skirt an awkward issue",
    definition_target: "Pasar por alto o eludir con habilidad una dificultad, cuestión espinosa o compromiso.",
    phonetic_ipa: "/sos.laˈʝaɾ/",
    regional_tags: ["all"],
    example_sentence_target: "El informe no pretendió soslayar los dilemas éticos que plantea la inteligencia artificial.",
    example_sentence_en: "The report did not aim to sidestep the ethical dilemmas posed by artificial intelligence.",
    collocations: ["soslayar un problema", "soslayar la responsabilidad"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://es.wiktionary.org/wiki/soslayar",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "es-voc-08",
    language: "es",
    lemma: "embarazada",
    part_of_speech: "adjective",
    cefr_level: "A2",
    definition_en: "pregnant (expecting a baby; NOT embarrassed)",
    definition_target: "Dicho de una mujer: que ha concebido y lleva en el útero el feto.",
    phonetic_ipa: "/em.ba.ɾaˈθa.ða/",
    regional_tags: ["all"],
    example_sentence_target: "La médica confirmó que la paciente estaba embarazada de doce semanas.",
    example_sentence_en: "The physician confirmed that the patient was twelve weeks pregnant.",
    collocations: ["mujer embarazada", "quedar embarazada"],
    audio_url: null,
    false_friend_warning: "¡Falso amigo con el portugués 'embaraçada' (avergonzada). En español embarazada significa que espera un bebé.",
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://es.wiktionary.org/wiki/embarazada",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "es-voc-09",
    language: "es",
    lemma: "a condición de que",
    part_of_speech: "idiom",
    cefr_level: "C1",
    definition_en: "on condition that, provided that (always requires subjunctive)",
    definition_target: "Locución conjuntiva condicional que introduce un requisito indispensable y rige subjuntivo.",
    phonetic_ipa: "/a kon.diˈθjon de ke/",
    regional_tags: ["all"],
    example_sentence_target: "El sindicato aceptará el acuerdo a condición de que la patronal respete las cláusulas salariales.",
    example_sentence_en: "The trade union will accept the agreement provided that management respects the wage clauses.",
    collocations: ["a condición de que se cumpla", "a condición de que acepte"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Sentence sample from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-10",
    language: "es",
    lemma: "polvo",
    part_of_speech: "noun",
    cefr_level: "A2",
    definition_en: "dust, powder (NOT octopus)",
    definition_target: "Parte menudísima y deshecha de la tierra que fácilmente se levanta en el aire.",
    phonetic_ipa: "/ˈpol.βo/",
    regional_tags: ["all"],
    example_sentence_target: "Una espesa capa de polvo cubría los manuscritos antiguos conservados en el desván.",
    example_sentence_en: "A thick layer of dust covered the ancient manuscripts preserved in the attic.",
    collocations: ["capa de polvo", "polvo en suspensión"],
    audio_url: null,
    false_friend_warning: "¡Falso amigo con el portugués 'polvo' (pulpo/octopus)! En español polvo es poeira.",
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://es.wiktionary.org/wiki/polvo",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "es-voc-11",
    language: "es",
    lemma: "presunto",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "alleged, presumed, suspected (NOT ham)",
    definition_target: "Que se supone o sospecha sin certeza plena; supuesto legal.",
    phonetic_ipa: "/pɾeˈsun.to/",
    regional_tags: ["all"],
    example_sentence_target: "El tribunal garantizó la presunción de inocencia para el presunto autor de la infracción.",
    example_sentence_en: "The court guaranteed the presumption of innocence for the alleged perpetrator of the violation.",
    collocations: ["presunto autor", "presunto culpable"],
    audio_url: null,
    false_friend_warning: "¡Falso amigo con el portugués 'presunto' (jamón/ham)! En español es supuesto/alegado.",
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://es.wiktionary.org/wiki/presunto",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Definition from Wiktionary under CC-BY-SA 3.0."
    }
  },
  {
    id: "es-voc-12",
    language: "es",
    lemma: "a tenor de",
    part_of_speech: "idiom",
    cefr_level: "C1",
    definition_en: "in accordance with, in light of, taking into account",
    definition_target: "Locución preposicional formal equivalente a conforme a o con arreglo a.",
    phonetic_ipa: "/a teˈnoɾ de/",
    regional_tags: ["all"],
    example_sentence_target: "A tenor de las últimas resoluciones judiciales, la empresa deberá modificar sus contratos.",
    example_sentence_en: "In accordance with the latest judicial rulings, the company will have to modify its contracts.",
    collocations: ["a tenor de lo dispuesto", "a tenor de los hechos"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Sentence sample from Tatoeba under CC-BY-2.0-FR."
    }
  },
  {
    id: "es-voc-13",
    language: "es",
    lemma: "preponderancia",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "preponderance, predominance, superior weight or influence",
    definition_target: "Cualidad de lo que es preponderante; predominio, superioridad o mayor peso de algo.",
    phonetic_ipa: "/pɾe.pon.deˈɾan.sja/",
    regional_tags: ["all"],
    example_sentence_target: "La preponderancia del sector de servicios impulsó el crecimiento de la economía urbana.",
    example_sentence_en: "The preponderance of the services sector drove urban economic growth.",
    collocations: ["preponderancia manifiesta", "ejercer preponderancia"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-14",
    language: "es",
    lemma: "salvaguardar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to safeguard, to protect, to preserve from degradation",
    definition_target: "Defender, amparar o proteger algo para asegurar su integridad o continuidad.",
    phonetic_ipa: "/sal.βwaɾˈdaɾ/",
    regional_tags: ["all"],
    example_sentence_target: "Es indispensable salvaguardar el patrimonio histórico durante las obras de modernización.",
    example_sentence_en: "It is indispensable to safeguard historical heritage during modernization works.",
    collocations: ["salvaguardar los derechos", "salvaguardar intereses"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-15",
    language: "es",
    lemma: "conjetura",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "conjecture, hypothesis, supposition based on preliminary signs",
    definition_target: "Juicio que se forma de las cosas o acaecimientos por indicios y observaciones.",
    phonetic_ipa: "/koŋ.xeˈtu.ɾa/",
    regional_tags: ["all"],
    example_sentence_target: "A falta de comprobación empírica, la teoría no pasa de ser una conjetura provisional.",
    example_sentence_en: "In the absence of empirical verification, the theory is nothing more than a provisional conjecture.",
    collocations: ["mera conjetura", "formular conjeturas"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-16",
    language: "es",
    lemma: "suscitar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to arouse, to provoke, to give rise to controversy or debate",
    definition_target: "Causar, promover o provocar dudas, comentarios, controversias o sentimientos.",
    phonetic_ipa: "/su.siˈtaɾ/",
    regional_tags: ["all"],
    example_sentence_target: "El anuncio de las nuevas medidas arancelarias suscitó críticas unánimes en el sector empresarial.",
    example_sentence_en: "The announcement of new tariff measures provoked unanimous criticism in the business sector.",
    collocations: ["suscitar dudas", "suscitar interés"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-17",
    language: "es",
    lemma: "inherente",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "inherent, intrinsic, essential to the nature of something",
    definition_target: "Que por su naturaleza está de tal manera unido a algo, que no se puede separar de ello.",
    phonetic_ipa: "/in.eˈɾen.te/",
    regional_tags: ["all"],
    example_sentence_target: "La incertidumbre es inherente a la toma de decisiones estratégicas en mercados globales.",
    example_sentence_en: "Uncertainty is inherent in strategic decision-making within global markets.",
    collocations: ["inherente a la función", "dificultad inherente"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-18",
    language: "es",
    lemma: "vicisitud",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "vicissitude, unexpected turn of fortune, hardship",
    definition_target: "Orden sucesivo o alternativo de cosas prósperas y adversas.",
    phonetic_ipa: "/bi.si.siˈtuð/",
    regional_tags: ["all"],
    example_sentence_target: "A pesar de las vicisitudes del trayecto, la expedición científica culminó con éxito su misión.",
    example_sentence_en: "Despite the vicissitudes of the journey, the scientific expedition successfully completed its mission.",
    collocations: ["vicisitudes del camino", "sortear vicisitudes"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-19",
    language: "es",
    lemma: "elucidar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to elucidate, to shed light on, to clarify thoroughly",
    definition_target: "Poner en claro, explicar, desvanecer lo que ofusca o dificulta la comprensión.",
    phonetic_ipa: "/e.lu.siˈdaɾ/",
    regional_tags: ["all"],
    example_sentence_target: "El estudio pretende elucidar las causas estructurales del abandono escolar temprano.",
    example_sentence_en: "The study aims to elucidate the structural causes of early school leaving.",
    collocations: ["elucidar dudas", "elucidar los mecanismos"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-20",
    language: "es",
    lemma: "presupuesto",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "premise, presupposition, or financial budget",
    definition_target: "Motivo, causa o pretexto con que se ejecuta algo; supuesto previo que sirve de base.",
    phonetic_ipa: "/pɾe.suˈpwes.to/",
    regional_tags: ["all"],
    example_sentence_target: "Partimos del presupuesto ético de que toda persona tiene derecho a un juicio imparcial.",
    example_sentence_en: "We proceed from the ethical premise that every person has the right to an impartial trial.",
    collocations: ["partir del presupuesto", "presupuesto básico"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-21",
    language: "es",
    lemma: "inaplazable",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "unpostponable, urgent, imperative",
    definition_target: "Que no admite aplazamiento; perentorio y de resolución inmediata.",
    phonetic_ipa: "/i.na.plaˈsa.βle/",
    regional_tags: ["all"],
    example_sentence_target: "La modernización de las infraestructuras ferroviarias constituye una necesidad inaplazable.",
    example_sentence_en: "The modernization of railway infrastructure constitutes an unpostponable necessity.",
    collocations: ["necesidad inaplazable", "urgencia inaplazable"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-22",
    language: "es",
    lemma: "vislumbrar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to glimpse, to discern, to anticipate intellectually",
    definition_target: "Ver un objeto tenuemente; conocer imperfectamente o conjeturar por leves indicios.",
    phonetic_ipa: "/biz.lumˈbɾaɾ/",
    regional_tags: ["all"],
    example_sentence_target: "Los diplomáticos vislumbran la posibilidad de alcanzar un alto el fuego en las próximas semanas.",
    example_sentence_en: "Diplomats glimpse the possibility of reaching a ceasefire in the coming weeks.",
    collocations: ["vislumbrar un acuerdo", "vislumbrar el futuro"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-23",
    language: "es",
    lemma: "subsidio",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "subsidy, public grant, financial contribution",
    definition_target: "Prestación pública asistencial de carácter económico concedida por la administración.",
    phonetic_ipa: "/subˈsi.ðjo/",
    regional_tags: ["all"],
    example_sentence_target: "El gobierno aprobó un subsidio extraordinario para apoyar la investigación en energías renovables.",
    example_sentence_en: "The government approved an extraordinary subsidy to support research into renewable energy.",
    collocations: ["concesión de subsidio", "subsidio por desempleo"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  },
  {
    id: "es-voc-24",
    language: "es",
    lemma: "discriminar",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "to distinguish, to differentiate between criteria",
    definition_target: "Seleccionar separando; distinguir o discernir con criterio analítico.",
    phonetic_ipa: "/dis.kɾi.miˈnaɾ/",
    regional_tags: ["all"],
    example_sentence_target: "Un investigador experimentado sabe discriminar las fuentes primarias fiables de los rumores no verificados.",
    example_sentence_en: "An experienced researcher knows how to distinguish reliable primary sources from unverified rumors.",
    collocations: ["discriminar entre opciones", "saber discriminar"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba Project",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Adapted from Tatoeba under CC-BY 2.0 FR."
    }
  }
];

export const enVocabulary: VocabularyItem[] = [
  {
    id: "en-voc-01",
    language: "en",
    lemma: "prerogative",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "An exclusive right, privilege, or immunity peculiar to a person, office, or group.",
    definition_target: "Direito exclusivo, privilégio ou regalia inerente a um cargo ou função.",
    definition_pt: "Direito exclusivo, privilégio ou regalia inerente a um cargo ou função pública/institucional.",
    definition_es: "Derecho exclusivo, privilegio o prerrogativa inherente a un cargo o función oficial.",
    phonetic_ipa: "/prɪˈrɒɡ.ə.tɪv/",
    regional_tags: ["all"],
    example_sentence_target: "Constitutional review is an exclusive prerogative of the Supreme Court.",
    example_sentence_en: "Constitutional review is an exclusive prerogative of the Supreme Court.",
    example_sentence_pt: "O controle de constitucionalidade é uma prerrogativa exclusiva da Suprema Corte.",
    example_sentence_es: "El control de constitucionalidad es una prerrogativa exclusiva del Tribunal Supremo.",
    collocations: ["exclusive prerogative", "executive prerogative", "prerogative of power"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary & Tatoeba",
      source_url: "https://en.wiktionary.org/wiki/prerogative",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Lexical entry adapted from Wiktionary."
    }
  },
  {
    id: "en-voc-02",
    language: "en",
    lemma: "scrutiny",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "Critical observation, rigorous examination, or close inspection.",
    definition_target: "Exame minucioso, investigação atenta e rigorosa.",
    definition_pt: "Exame minucioso, investigação atenta e rigorosa inspeção crítica.",
    definition_es: "Examen minucioso, escrutinio detallado e inspección crítica rigurosa.",
    phonetic_ipa: "/ˈskruː.tɪ.ni/",
    regional_tags: ["all"],
    example_sentence_target: "The proposed regulatory framework will undergo rigorous public scrutiny.",
    example_sentence_en: "The proposed regulatory framework will undergo rigorous public scrutiny.",
    example_sentence_pt: "O marco regulatório proposto passará por um rigoroso escrutínio público.",
    example_sentence_es: "El marco regulatorio propuesto será sometido a un riguroso escrutinio público.",
    collocations: ["rigorous scrutiny", "close scrutiny", "come under scrutiny"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/scrutiny",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Entry derived from English Wiktionary."
    }
  },
  {
    id: "en-voc-03",
    language: "en",
    lemma: "mitigate",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "To make something less severe, harmful, or painful.",
    definition_target: "Atenuar, suavizar, diminuir a intensidade de um impacto negativo.",
    definition_pt: "Atenuar, abrandar ou diminuir a gravidade ou impacto de algo prejudicial.",
    definition_es: "Mitigar, atenuar o reducir la gravedad o el impacto de algo perjudicial.",
    phonetic_ipa: "/ˈmɪt.ɪ.ɡeɪt/",
    regional_tags: ["all"],
    example_sentence_target: "Strategic risk management helps companies mitigate potential financial losses.",
    example_sentence_en: "Strategic risk management helps companies mitigate potential financial losses.",
    example_sentence_pt: "A gestão estratégica de riscos ajuda as empresas a mitigar potenciais perdas financeiras.",
    example_sentence_es: "La gestión estratégica de riesgos ayuda a las empresas a mitigar posibles pérdidas financieras.",
    collocations: ["mitigate risks", "mitigate impact", "mitigate damage"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/mitigate",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Lexical entry derived from English Wiktionary."
    }
  },
  {
    id: "en-voc-04",
    language: "en",
    lemma: "nevertheless",
    part_of_speech: "adverb",
    cefr_level: "C1",
    definition_en: "In spite of that; however; nonetheless (formal contrast connector).",
    definition_target: "Não obstante, apesar disso, contudo, todavia.",
    definition_pt: "Não obstante, contudo, todavia, apesar disso (conector formal de contraste).",
    definition_es: "No obstante, sin embargo, a pesar de ello (conector formal de contraste).",
    phonetic_ipa: "/ˌnev.ə.ðəˈles/",
    regional_tags: ["all"],
    example_sentence_target: "Market volatility escalated; nevertheless, long-term investors sustained their positions.",
    example_sentence_en: "Market volatility escalated; nevertheless, long-term investors sustained their positions.",
    example_sentence_pt: "A volatilidade do mercado aumentou; não obstante, os investidores de longo prazo mantiveram suas posições.",
    example_sentence_es: "La volatilidad del mercado aumentó; no obstante, los inversores a largo plazo mantuvieron sus posiciones.",
    collocations: ["nevertheless, however", "nonetheless and nevertheless"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Tatoeba",
      source_url: "https://tatoeba.org",
      license_type: "CC-BY-2.0-FR",
      attribution_text: "Example from Tatoeba Project."
    }
  },
  {
    id: "en-voc-05",
    language: "en",
    lemma: "unprecedented",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "Never having happened or existed before.",
    definition_target: "Inédito, sem precedentes na história ou registro anterior.",
    definition_pt: "Inédito, sem precedentes históricos ou registros anteriores comparáveis.",
    definition_es: "Sin precedentes, inédito, que no tiene antecedentes históricos comparables.",
    phonetic_ipa: "/ʌnˈpres.ɪ.den.tɪd/",
    regional_tags: ["all"],
    example_sentence_target: "The technological shift triggered an unprecedented expansion in global productivity.",
    example_sentence_en: "The technological shift triggered an unprecedented expansion in global productivity.",
    example_sentence_pt: "A transformação tecnológica desencadeou uma expansão sem precedentes na produtividade global.",
    example_sentence_es: "La transformación tecnológica desató una expansión sin precedentes en la productividad global.",
    collocations: ["unprecedented growth", "unprecedented scale", "unprecedented challenges"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/unprecedented",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-06",
    language: "en",
    lemma: "plausible",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "Seeming likely to be true, reasonable, or believable.",
    definition_target: "Plausível, verossímil, defensável pela razão.",
    definition_pt: "Plausível, verossímil, razoável e defensável logicamente.",
    definition_es: "Plausible, verosímil, razonable y admisible lógicamente.",
    phonetic_ipa: "/ˈplɔː.zə.bəl/",
    regional_tags: ["all"],
    example_sentence_target: "Scientists offered a highly plausible explanation for the sudden atmospheric anomaly.",
    example_sentence_en: "Scientists offered a highly plausible explanation for the sudden atmospheric anomaly.",
    example_sentence_pt: "Os cientistas apresentaram uma explicação altamente plausível para a súbita anomalia atmosférica.",
    example_sentence_es: "Los científicos ofrecieron una explicación muy plausible para la repentina anomalía atmosférica.",
    collocations: ["plausible explanation", "plausible scenario", "eminently plausible"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/plausible",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-07",
    language: "en",
    lemma: "stringent",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "Extremely strict, rigorous, and demanding adherence to high standards.",
    definition_target: "Rigoroso, estrito, severo em normas e padrões.",
    definition_pt: "Rigoroso, estrito, severo e exigente quanto a padrões e conformidade.",
    definition_es: "Estricto, riguroso, severo y exigente en cuanto a normas y cumplimiento.",
    phonetic_ipa: "/ˈstrɪn.dʒənt/",
    regional_tags: ["all"],
    example_sentence_target: "International aviation adheres to stringent safety and emissions regulations.",
    example_sentence_en: "International aviation adheres to stringent safety and emissions regulations.",
    example_sentence_pt: "A aviação internacional obedece a normas rigorosas de segurança e controle de emissões.",
    example_sentence_es: "La aviación internacional cumple con estrictas regulaciones de seguridad y emisiones.",
    collocations: ["stringent regulations", "stringent criteria", "stringent measures"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/stringent",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-08",
    language: "en",
    lemma: "substantiate",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "To provide solid evidence to support or prove the truth of a claim.",
    definition_target: "Comprovar, fundamentar com evidências ou provas documentadas.",
    definition_pt: "Comprovar, fundamentar ou corroborar com evidências empíricas e documentadas.",
    definition_es: "Fundamentar, corroborar o sustentar con pruebas y evidencias empíricas.",
    phonetic_ipa: "/səbˈstæn.ʃi.eɪt/",
    regional_tags: ["all"],
    example_sentence_target: "The audit failed to substantiate the initial allegations of fiscal negligence.",
    example_sentence_en: "The audit failed to substantiate the initial allegations of fiscal negligence.",
    example_sentence_pt: "A auditoria não conseguiu comprovar as alegações iniciais de negligência fiscal.",
    example_sentence_es: "La auditoría no logró sustentar las alegaciones iniciales de negligencia fiscal.",
    collocations: ["substantiate claims", "substantiate allegations", "substantiate findings"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/substantiate",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-09",
    language: "en",
    lemma: "resilient",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "Able to withstand adversity and recover rapidly from difficult conditions.",
    definition_target: "Resiliente, capaz de resistir e recuperar-se de adversidades.",
    definition_pt: "Resiliente, capaz de suportar adversidades e recuperar-se rapidamente de crises.",
    definition_es: "Resiliente, capaz de resistir adversidades y recuperarse rápidamente de situaciones difíciles.",
    phonetic_ipa: "/rɪˈzɪl.jənt/",
    regional_tags: ["all"],
    example_sentence_target: "Modern supply chains must be resilient against geopolitical disruptions.",
    example_sentence_en: "Modern supply chains must be resilient against geopolitical disruptions.",
    example_sentence_pt: "As cadeias de suprimentos modernas devem ser resilientes contra interrupções geopolíticas.",
    example_sentence_es: "Las cadenas de suministro modernas deben ser resilientes frente a disrupciones geopolíticas.",
    collocations: ["resilient economy", "highly resilient", "resilient infrastructure"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/resilient",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-10",
    language: "en",
    lemma: "lucrative",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "Producing a great deal of monetary profit; commercially profitable.",
    definition_target: "Lucrativo, altamente rentável comercialmente.",
    definition_pt: "Lucrativo, altamente rentável comercialmente e gerador de dividendos.",
    definition_es: "Lucrativo, altamente rentable comercialmente y generador de beneficios.",
    phonetic_ipa: "/ˈluː.krə.tɪv/",
    regional_tags: ["all"],
    example_sentence_target: "Renewable energy technology has evolved into a lucrative investment sector.",
    example_sentence_en: "Renewable energy technology has evolved into a lucrative investment sector.",
    example_sentence_pt: "A tecnologia de energia renovável evoluiu para um setor de investimento lucrativo.",
    example_sentence_es: "La tecnología de energías renovables ha evolucionado hacia un sector de inversión lucrativo.",
    collocations: ["lucrative contract", "lucrative market", "lucrative business"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/lucrative",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-11",
    language: "en",
    lemma: "comprehensive",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "Complete; including all or nearly all elements or aspects of something.",
    definition_target: "Abrangente, exaustivo, amplo (FALSO COGNATO: NÃO significa 'compreensivo').",
    definition_pt: "Abrangente, amplo, exaustivo e completo (falso amigo: não significa compreensivo/tolerante).",
    definition_es: "Exhaustivo, amplio, integral y completo (falso amigo: no significa comprensivo/tolerante).",
    phonetic_ipa: "/ˌkɒm.prɪˈhen.sɪv/",
    regional_tags: ["all"],
    example_sentence_target: "The committee produced a comprehensive review of urban environmental policies.",
    example_sentence_en: "The committee produced a comprehensive review of urban environmental policies.",
    example_sentence_pt: "O comitê elaborou uma análise abrangente das políticas ambientais urbanas.",
    example_sentence_es: "El comité elaboró un informe exhaustivo sobre las políticas ambientales urbanas.",
    collocations: ["comprehensive study", "comprehensive analysis", "comprehensive report"],
    audio_url: null,
    false_friend_warning: "Falso amigo: 'comprehensive' = abrangente/completo. Para 'compreensivo/tolerante', use 'understanding' ou 'sympathetic'.",
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/comprehensive",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-12",
    language: "en",
    lemma: "ambiguity",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "The quality of being open to more than one interpretation; inexactness.",
    definition_target: "Ambiguidade, dubiedade de sentido que enseja múltiplas interpretações.",
    definition_pt: "Ambiguidade, dubiedade ou imprecisão que enseja múltiplas interpretações.",
    definition_es: "Ambigüedad, falta de certeza o cualidad de admitir múltiples interpretaciones.",
    phonetic_ipa: "/ˌæm.bɪˈɡjuː.ə.ti/",
    regional_tags: ["all"],
    example_sentence_target: "Legal draftsmen must eliminate contractual ambiguity to prevent costly litigation.",
    example_sentence_en: "Legal draftsmen must eliminate contractual ambiguity to prevent costly litigation.",
    example_sentence_pt: "Redatores jurídicos devem eliminar a ambiguidade contratual para evitar litígios dispendiosos.",
    example_sentence_es: "Los redactores jurídicos deben eliminar la ambigüedad contractual para evitar litigios costosos.",
    collocations: ["moral ambiguity", "contractual ambiguity", "avoid ambiguity"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/ambiguity",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-13",
    language: "en",
    lemma: "preponderance",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "The quality or fact of being greater in number, quantity, or importance; predominance.",
    definition_target: "Preponderância, predomínio, superioridade em número, peso ou influência.",
    definition_pt: "Preponderância, predomínio, superioridade em número, peso ou influência.",
    definition_es: "Preponderancia, predominio, superioridad en número, peso o influencia.",
    phonetic_ipa: "/prɪˈpɒn.dər.əns/",
    regional_tags: ["all"],
    example_sentence_target: "A preponderance of scientific evidence supports the theory of anthropogenic climate change.",
    example_sentence_en: "A preponderance of scientific evidence supports the theory of anthropogenic climate change.",
    example_sentence_pt: "Uma preponderância de evidências científicas apoia a teoria das mudanças climáticas antropogênicas.",
    example_sentence_es: "Una preponderancia de evidencia científica respalda la teoría del cambio climático antropogénico.",
    collocations: ["preponderance of evidence", "clear preponderance"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/preponderance",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-14",
    language: "en",
    lemma: "safeguard",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "To protect from harm or damage with an appropriate measure.",
    definition_target: "Salvaguardar, proteger ou resguardar contra danos ou degradação.",
    definition_pt: "Salvaguardar, proteger, resguardar contra perigos ou abusos.",
    definition_es: "Salvaguardar, proteger o tutelar contra riesgos o abusos.",
    phonetic_ipa: "/ˈseɪf.ɡɑːd/",
    regional_tags: ["all"],
    example_sentence_target: "New data privacy regulations are designed to safeguard consumer confidentiality.",
    example_sentence_en: "New data privacy regulations are designed to safeguard consumer confidentiality.",
    example_sentence_pt: "Novas regulamentações de privacidade de dados foram concebidas para salvaguardar a confidencialidade do consumidor.",
    example_sentence_es: "Nuevas regulaciones de privacidad de datos están diseñadas para salvaguardar la confidencialidad del consumidor.",
    collocations: ["safeguard interests", "safeguard rights"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/safeguard",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-15",
    language: "en",
    lemma: "conjecture",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "An opinion or conclusion formed on the basis of incomplete information; speculation.",
    definition_target: "Conjetura, hipótese ou suposição sem comprovação empírica definitiva.",
    definition_pt: "Conjetura, hipótese ou suposição sem comprovação empírica definitiva.",
    definition_es: "Conjetura, hipótesis o suposición sin comprobación empírica definitiva.",
    phonetic_ipa: "/kənˈdʒek.tʃər/",
    regional_tags: ["all"],
    example_sentence_target: "Initial reports about the financial merger were dismissed as unverified conjecture.",
    example_sentence_en: "Initial reports about the financial merger were dismissed as unverified conjecture.",
    example_sentence_pt: "Relatórios iniciais sobre a fusão financeira foram descartados como conjeturas não verificadas.",
    example_sentence_es: "Los informes iniciales sobre la fusión financiera fueron descartados como conjeturas no verificadas.",
    collocations: ["pure conjecture", "matter of conjecture"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/conjecture",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-16",
    language: "en",
    lemma: "instigate",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "To initiate an action or event; to incite someone to do something.",
    definition_target: "Instigar, suscitar, promover uma investigação ou ação formal.",
    definition_pt: "Instigar, suscitar, promover ou deflagrar uma investigação ou ação formal.",
    definition_es: "Instigar, suscitar, promover o iniciar una investigación o acción formal.",
    phonetic_ipa: "/ˈɪn.stɪ.ɡeɪt/",
    regional_tags: ["all"],
    example_sentence_target: "The regulatory body decided to instigate an independent audit into banking practices.",
    example_sentence_en: "The regulatory body decided to instigate an independent audit into banking practices.",
    example_sentence_pt: "O órgão regulador decidiu instaurar uma auditoria independente sobre as práticas bancárias.",
    example_sentence_es: "El organismo regulador decidió iniciar una auditoría independiente sobre las prácticas bancarias.",
    collocations: ["instigate an inquiry", "instigate reforms"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/instigate",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-17",
    language: "en",
    lemma: "inherent",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "Existing in something as a permanent, essential, or characteristic attribute.",
    definition_target: "Inerente, intrínseco, inseparável por natureza.",
    definition_pt: "Inerente, intrínseco, inseparável por natureza.",
    definition_es: "Inherente, intrínseco, inseparable por naturaleza.",
    phonetic_ipa: "/ɪnˈhɪə.rənt/",
    regional_tags: ["all"],
    example_sentence_target: "Stress and accountability are inherent components of executive leadership roles.",
    example_sentence_en: "Stress and accountability are inherent components of executive leadership roles.",
    example_sentence_pt: "Estresse e responsabilidade são componentes inerentes aos cargos de liderança executiva.",
    example_sentence_es: "El estrés y la responsabilidad son componentes inherentes a los puestos de liderazgo ejecutivo.",
    collocations: ["inherent risk", "inherent flaw"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/inherent",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-18",
    language: "en",
    lemma: "vicissitude",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "A change of circumstances or fortune, typically one that is unwelcome or unpleasant.",
    definition_target: "Vicissitude, reviravolta da sorte, alternância de momentos difíceis e prósperos.",
    definition_pt: "Vicissitude, reviravolta da sorte, alternância de momentos difíceis e prósperos.",
    definition_es: "Vicisitud, alteración de la fortuna, sucesión de contingencias adversas y prósperas.",
    phonetic_ipa: "/vɪˈsɪs.ɪ.tʃuːd/",
    regional_tags: ["all"],
    example_sentence_target: "They navigated the vicissitudes of political life with composure and strategic foresight.",
    example_sentence_en: "They navigated the vicissitudes of political life with composure and strategic foresight.",
    example_sentence_pt: "Eles navegaram pelas vicissitudes da vida política com compostura e visão estratégica.",
    example_sentence_es: "Navegaron por las vicisitudes de la vida política con compostura y previsión estratégica.",
    collocations: ["vicissitudes of life", "endure vicissitudes"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/vicissitude",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-19",
    language: "en",
    lemma: "elucidate",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "To make something clear; to explain in thorough detail.",
    definition_target: "Elucidar, aclarar, explicar com minúcia e clareza.",
    definition_pt: "Elucidar, aclarar, explicar com minúcia e clareza.",
    definition_es: "Elucidar, aclarar, explicar con minuciosidad y claridad.",
    phonetic_ipa: "/iˈluː.sɪ.deɪt/",
    regional_tags: ["all"],
    example_sentence_target: "The keynote speaker helped elucidate the complex mathematical model behind quantum encryption.",
    example_sentence_en: "The keynote speaker helped elucidate the complex mathematical model behind quantum encryption.",
    example_sentence_pt: "O palestrante principal ajudou a elucidar o complexo modelo matemático por trás da criptografia quântica.",
    example_sentence_es: "El ponente principal ayudó a elucidar el complejo modelo matemático detrás del cifrado cuántico.",
    collocations: ["elucidate the issue", "elucidate the mechanisms"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/elucidate",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-20",
    language: "en",
    lemma: "premise",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "A previous statement from which another is inferred or follows as a conclusion.",
    definition_target: "Premissa, pressuposto fundamental de um raciocínio lógico.",
    definition_pt: "Premissa, pressuposto fundamental de um raciocínio lógico.",
    definition_es: "Premisa, supuesto fundamental de un razonamiento lógico.",
    phonetic_ipa: "/ˈprem.ɪs/",
    regional_tags: ["all"],
    example_sentence_target: "The entire philosophical argument collapses if the initial premise proves invalid.",
    example_sentence_en: "The entire philosophical argument collapses if the initial premise proves invalid.",
    example_sentence_pt: "Todo o argumento filosófico desmorona se a premissa inicial se provar inválida.",
    example_sentence_es: "Todo el argumento filosófico se desmorona si la premisa inicial resulta inválida.",
    collocations: ["underlying premise", "false premise"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/premise",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-21",
    language: "en",
    lemma: "imperative",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "Of vital importance; crucial; authoritative and urgent.",
    definition_target: "Imperativo, inadiável, urgente e de importância crucial.",
    definition_pt: "Imperativo, inadiável, urgente e de importância crucial.",
    definition_es: "Imperativo, inaplazable, urgente y de importancia crucial.",
    phonetic_ipa: "/ɪmˈper.ə.tɪv/",
    regional_tags: ["all"],
    example_sentence_target: "Immediate structural reform is imperative to ensure fiscal solvency across the Eurozone.",
    example_sentence_en: "Immediate structural reform is imperative to ensure fiscal solvency across the Eurozone.",
    example_sentence_pt: "Reforma estrutural imediata é imperativa para garantir a solvência fiscal na Zona do Euro.",
    example_sentence_es: "La reforma estructural inmediata es imperativa para garantizar la solvencia fiscal en la Eurozona.",
    collocations: ["morally imperative", "economically imperative"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/imperative",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-22",
    language: "en",
    lemma: "envisage",
    part_of_speech: "verb",
    cefr_level: "C1",
    definition_en: "To contemplate or conceive of as a possibility or a desirable future event.",
    definition_target: "Vislumbrar, antever, conceber como possibilidade futura.",
    definition_pt: "Vislumbrar, antever, conceber como possibilidade futura.",
    definition_es: "Vislumbrar, prever, concebir como posibilidad futura.",
    phonetic_ipa: "/ɪnˈvɪz.ɪdʒ/",
    regional_tags: ["all"],
    example_sentence_target: "Urban planners envisage a carbon-neutral public transport network within a decade.",
    example_sentence_en: "Urban planners envisage a carbon-neutral public transport network within a decade.",
    example_sentence_pt: "Planejadores urbanos vislumbram uma rede de transporte público neutra em carbono dentro de uma década.",
    example_sentence_es: "Los planificadores urbanos vislumbran una red de transporte público neutra en carbono dentro de una década.",
    collocations: ["envisage a future", "hard to envisage"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/envisage",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-23",
    language: "en",
    lemma: "subsidiary",
    part_of_speech: "adjective",
    cefr_level: "C1",
    definition_en: "Serving to assist or supplement; of secondary importance.",
    definition_target: "Subsidiário, secundário, complementar ou auxiliar.",
    definition_pt: "Subsidiário, secundário, complementar ou auxiliar.",
    definition_es: "Subsidiario, secundario, complementario o auxiliar.",
    phonetic_ipa: "/səbˈsɪd.i.ə.ri/",
    regional_tags: ["all"],
    example_sentence_target: "The secondary clauses played a subsidiary role in establishing the terms of the treaty.",
    example_sentence_en: "The secondary clauses played a subsidiary role in establishing the terms of the treaty.",
    example_sentence_pt: "As cláusulas secundárias desempenharam um papel subsidiário no estabelecimento dos termos do tratado.",
    example_sentence_es: "Las cláusulas secundarias desempeñaron un papel subsidiario en el establecimiento de los términos del tratado.",
    collocations: ["subsidiary role", "subsidiary issue"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/subsidiary",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  },
  {
    id: "en-voc-24",
    language: "en",
    lemma: "discernment",
    part_of_speech: "noun",
    cefr_level: "C1",
    definition_en: "The ability to judge well and distinguish nuances.",
    definition_target: "Discernimento, agudeza de espírito, capacidade de discriminar com critério.",
    definition_pt: "Discernimento, agudeza de espírito, capacidade de discriminar com critério.",
    definition_es: "Discernimiento, agudeza de juicio, capacidad de discriminar con criterio.",
    phonetic_ipa: "/dɪˈsɜːn.mənt/",
    regional_tags: ["all"],
    example_sentence_target: "Critical thinking requires discernment when evaluating information from varied sources.",
    example_sentence_en: "Critical thinking requires discernment when evaluating information from varied sources.",
    example_sentence_pt: "O pensamento crítico exige discernimento ao avaliar informações de fontes variadas.",
    example_sentence_es: "El pensamiento crítico requiere discernimiento al evaluar información de fuentes variadas.",
    collocations: ["aesthetic discernment", "lack of discernment"],
    audio_url: null,
    false_friend_warning: null,
    attribution: {
      source_name: "Wiktionary",
      source_url: "https://en.wiktionary.org/wiki/discernment",
      license_type: "CC-BY-SA-3.0",
      attribution_text: "Adapted from English Wiktionary."
    }
  }
];

export const ptGrammar: GrammarRule[] = [
  {
    id: "pt-gram-c1-01",
    rule_code: "PT_INF_PESSOAL_01",
    language: "pt",
    cefr_level: "C1",
    title: "Infinitivo Pessoal Flexionado em Orações Reduzidas",
    category: "verb_syntax",
    explanation_markdown: "O **infinitivo pessoal** (ou flexionado) é uma das marcas sintáticas mais distintas da língua portuguesa. Ao contrário do espanhol (que recorre a orações subordinadas com subjuntivo), o português permite flexionar o infinitivo com desinências próprias de pessoa: `-es` (tu), `-(zero)` (ele/ela/você), `-mos` (nós), `-des` (vós) e `-em` (eles/elas/vocês).\n\n### Quando é obrigatório ou preferível flexionar?\n1. **Sujeito próprio e explícito diferente da oração principal**: Ex.: *Para os deputados aprovarem o projeto, foi preciso consenso.*\n2. **Após preposições que introduzem finalidade, tempo ou concessão**: Ex.: *Apesar de termos chegado cedo, a palestra já começara.*\n3. **Com sujeito indeterminado na 3ª pessoa do plural**: Ex.: *Ouvi dizerem que o mercado recuou.*",
    structural_formula: "Preposição (para / por / ao / apesar de) + [Sujeito] + Verbo no Infinitivo Pessoal (-es, -mos, -em)",
    examples: [
      {
        target: "Para compreendermos a dimensão da crise, cumpre examinar os relatórios fiscais.",
        en: "In order for us to understand the scale of the crisis, it is necessary to examine the fiscal reports.",
        note: "Flexão em -mos deixando evidente o sujeito 'nós' sem necessidade de pronome explícito."
      },
      {
        target: "Ao saírem do plenário, os senadores concederam uma entrevista coletiva.",
        en: "Upon leaving the plenary hall, the senators held a press conference.",
        note: "Oração reduzida temporal com 'ao + infinitivo flexionado em -em'."
      }
    ],
    common_errors: [
      {
        incorrect: "Para nós compreender a situação...",
        correct: "Para nós compreendermos a situação... (ou 'Para compreendermos...')",
        reason: "Omissão da desinência de pessoa (-mos) quando o sujeito da oração reduzida é nós."
      },
      {
        incorrect: "Eles foram impedidos de entrarem.",
        correct: "Eles foram impedidos de entrar.",
        reason: "Com verbos de ligação ou locuções com o mesmo sujeito, o infinitivo tende a não se flexionar."
      }
    ],
    regional_notes: {
      "pt-BR": "No Brasil formal, o infinitivo pessoal é amplamente empregado na escrita culta.",
      "pt-PT": "Em Portugal, o infinitivo pessoal é extremamente produtivo tanto na escrita quanto na oralidade padrão e culta."
    },
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Original comparative linguistic synthesis prepared for Polyglot C1 Daily."
    }
  }
];

export const esGrammar: GrammarRule[] = [
  {
    id: "es-gram-c1-01",
    rule_code: "ES_SUBJ_CONCESSIVE_01",
    language: "es",
    cefr_level: "C1",
    title: "Subjuntivo en Oraciones Concesivas Complejas",
    category: "subjunctive_mood",
    explanation_markdown: "En español C1, las **oraciones concesivas** exigen una selección modal muy precisa entre indicativo y subjuntivo según el grado de certidumbre o pertinencia que el hablante otorga al obstáculo.\n\n### Matices modales:\n1. **Aunque + Indicativo**: El hablante afirma un hecho real conocido. (*Aunque llueve, saldré* = Sé que llueve y lo constato).\n2. **Aunque + Subjuntivo**: El obstáculo se presenta como hipotético, irrelevante o ya conocido por el interlocutor sin que altere la decisión. (*Aunque llueva, saldré* = Tanto si llueve como si no, saldré).\n3. **Nexos que exigen SIEMPRE subjuntivo**: *por más que*, *por mucho que*, *aun a riesgo de que*, *a sabiendas de que* (este último con indicativo).",
    structural_formula: "Por mucho/más que + Subjuntivo (Presente o Imperfecto) + Oración Principal",
    examples: [
      {
        target: "Por mucho que insistan los portavoces, el comité no alterará los plazos de entrega.",
        en: "However much the spokespersons insist, the committee will not alter the delivery deadlines.",
        note: "'Por mucho que' seguido obligatoriamente de presente de subjuntivo ('insistan')."
      },
      {
        target: "Aun cuando surgieran discrepancias metodológicas, mantendríamos la colaboración.",
        en: "Even if methodological discrepancies were to arise, we would maintain the collaboration.",
        note: "'Aun cuando' con imperfecto de subjuntivo (-ra) para formular una concesión hipotética."
      }
    ],
    common_errors: [
      {
        incorrect: "Por mucho que insisten los portavoces...",
        correct: "Por mucho que insistan los portavoces...",
        reason: "La locución 'por mucho que' en contextos de obstáculo potencial rige siempre subjuntivo."
      }
    ],
    regional_notes: {
      "es-ES": "En España se utiliza ampliamente la alternancia entre las desinencias del imperfecto de subjuntivo en '-ra' y '-se'.",
      "es-419": "En Hispanoamérica predomina casi exclusivamente la terminación en '-ra'."
    },
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      "source_url": "https://github.com/polyglot-c1-daily",
      "license_type": "Original-Curated",
      "attribution_text": "Pedagogical synthesis prepared for Polyglot C1 Daily."
    }
  }
];

export const enGrammar: GrammarRule[] = [
  {
    id: "en-gram-c1-01",
    rule_code: "ENG-C1-INV-01",
    language: "en",
    cefr_level: "C1",
    title: "Negative Inversion for Emphatic Formal Discourse",
    category: "syntax",
    explanation_markdown: "When negative or restrictive adverbials (e.g., *seldom*, *rarely*, *hardly*, *scarcely*, *no sooner*, *under no circumstances*, *not only*) are placed at the beginning of a clause for rhetorical emphasis, the clause must undergo subject-auxiliary inversion (auxiliary + subject + verb), similar to a question structure.",
    structural_formula: "Negative/Restrictive Adverbial + Auxiliary Verb (do/did/have/can) + Subject + Main Verb",
    examples: [
      {
        target: "Rarely do we encounter an executive whose strategic foresight matches their technical acumen.",
        en: "Rarely do we encounter an executive whose strategic foresight matches their technical acumen.",
        pt: "Raramente encontramos um executivo cuja visão estratégica se equipare à sua perspicácia técnica.",
        es: "Rara vez nos encontramos con un ejecutivo cuya visión estratégica coincida con su perspicacia técnica.",
        note: "Inversion with 'do': Rarely + do + we + encounter."
      },
      {
        target: "Under no circumstances should sensitive encryption keys be stored in client-side code.",
        en: "Under no circumstances should sensitive encryption keys be stored in client-side code.",
        pt: "Sob hipótese alguma chaves de criptografia sensíveis devem ser armazenadas no código do lado do cliente.",
        es: "Bajo ninguna circunstancia se deben almacenar claves criptográficas sensibles en el código del lado del cliente.",
        note: "Emphatic prohibitive inversion with modal 'should'."
      },
      {
        target: "Not only did the team surpass quarterly projections, but they also reduced infrastructure costs.",
        en: "Not only did the team surpass quarterly projections, but they also reduced infrastructure costs.",
        pt: "A equipe não apenas superou as projeções trimestrais, mas também reduziu os custos de infraestrutura.",
        es: "El equipo no solo superó las proyecciones trimestrales, sino que también redujo los costos de infraestructura.",
        note: "Correlative inversion with 'Not only did...' followed by standard word order in second clause."
      }
    ],
    common_errors: [
      {
        incorrect: "Rarely we witness such unanimous agreement among board members.",
        correct: "Rarely do we witness such unanimous agreement among board members.",
        reason: "L1 interference from Romance languages (PT: 'Raramente testemunhamos', ES: 'Raramente presenciamos'). In English, fronted negative adverbials obligatorily trigger auxiliary inversion."
      },
      {
        incorrect: "Under no circumstances users can bypass two-factor authentication.",
        correct: "Under no circumstances can users bypass two-factor authentication.",
        reason: "Modal auxiliary 'can' must precede subject 'users'."
      }
    ],
    regional_notes: {
      "en-US": "Prevalent in American legal agreements, executive addresses, and high-tier investigative journalism.",
      "en-GB": "A staple of formal British academic writing, Hansard parliamentary records, and standard Oxford English discourse."
    },
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Pedagogical synthesis prepared for English learners from Romance language backgrounds."
    }
  },
  {
    id: "en-gram-c1-02",
    rule_code: "ENG-C1-COND-02",
    language: "en",
    cefr_level: "C1",
    title: "Mixed Conditionals (Past Unreal to Present Implication)",
    category: "verb_system",
    explanation_markdown: "Mixed conditionals express a counterfactual condition in the past with a continuing consequence in the present, combining Third Conditional (past unreal) with Second Conditional (present imaginary result).",
    structural_formula: "If + Subject + had (not) + Past Participle, Subject + would / could / might + Bare Infinitive",
    examples: [
      {
        target: "If we had secured regulatory clearance last quarter, our product would be in production today.",
        en: "If we had secured regulatory clearance last quarter, our product would be in production today.",
        pt: "Se tivéssemos obtido autorização regulatória no último trimestre, nosso produto estaria em produção hoje.",
        es: "Si hubiéramos obtenido la aprobación regulatoria el trimestre pasado, nuestro producto estaría en producción hoy.",
        note: "Past hypothetical cause (had secured) -> Present outcome (would be today)."
      }
    ],
    common_errors: [
      {
        incorrect: "If we had studied Portuguese earlier, we would have spoken it fluently now.",
        correct: "If we had studied Portuguese earlier, we would speak it fluently now.",
        reason: "The consequence refers to the present state ('now'), requiring 'would speak' rather than 'would have spoken'."
      }
    ],
    regional_notes: {
      "en-US": "Standard across American professional communication.",
      "en-GB": "Standard across British professional communication."
    },
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Synthesized for advanced English learners."
    }
  }
];

export const curatedMaterials: CuratedMaterial[] = [
  {
    id: "pt-mat-read-01",
    language: "pt",
    material_type: "reading_passage",
    title: "A Transição Ecológica e os Desafios Regulatórios Contemporâneos",
    cefr_level: "C1",
    regional_variety: "all",
    content_target: "A transição energética global impõe um reexame minucioso dos quadros jurídicos e fiscais internacionais. Conquanto os compromissos multilaterais tenham avançado de modo expressivo na última década, persistem assimetrias notáveis entre economias industrializadas e países emergentes. Para os governos viabilizarem a descarbonização sem asfixiar o crescimento industrial, cumpre implementar mecanismos de incentivo que harmonizem a sustentabilidade ambiental com a competitividade produtiva.",
    content_en: "The global energy transition imposes a meticulous review of international legal and fiscal frameworks. Although multilateral commitments have advanced significantly in the past decade, notable asymmetries persist between industrialized economies and emerging nations. In order for governments to enable decarbonization without stifling industrial growth, it is essential to implement incentive mechanisms that harmonize environmental sustainability with productive competitiveness.",
    glossary: {
      "reexame": "ação de examinar novamente com minúcia",
      "asfixiar": "sufocar, estrangular economicamente",
      "assimetrias": "desigualdades, falta de proporção harmoniosa"
    },
    comprehension_questions: [
      {
        question: "De acordo com o texto, qual é o duplo objetivo que os governos devem harmonizar?",
        options: [
          "Sustentabilidade ambiental e competitividade produtiva.",
          "Redução salarial e atração de investimento estrangeiro.",
          "Manutenção exclusiva de matrizes fósseis e equilíbrio fiscal."
        ],
        correct_option_index: 0,
        explanation: "O texto afirma expressamente a necessidade de 'harmonizar a sustentabilidade ambiental com a competitividade produtiva'."
      }
    ],
    speaking_prompt: "Discuta como seu país equilibra o rigor ecológico com o desenvolvimento econômico.",
    writing_prompt: "Redija uma proposta de diretriz governamental sobre descarbonização industrial sustentável.",
    audio_url: "https://tatoeba.org/audio/pt/ecologia_c1.mp3",
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Original C1 reading comprehension text created for Polyglot C1 Daily."
    }
  },
  {
    id: "pt-mat-conv-01",
    language: "pt",
    material_type: "conversation_script",
    title: "Negociação de Cláusulas Contratuais em Assembleia",
    cefr_level: "C1",
    regional_variety: "all",
    content_target: "Dra. Helena: Bom dia a todos. Conforme estipulado na pauta, precisamos deliberar sobre a cláusula de confidencialidade.\nDr. Eduardo: Perfeito, Dra. Helena. No entanto, por mais que compreendamos a prudência da diretoria, consideramos o prazo de cinco anos desproporcional.\nDra. Helena: Entendo a vossa apreensão. Mas para que possamos mitigar os riscos de espionagem corporativa, é mister resguardar os dados do algoritmo.\nDr. Eduardo: Se estabelecermos uma compensação proporcional caso haja rescisão imotivada, estamos dispostos a aceitar a vigência solicitada.\nDra. Helena: Excelente. Parece-me um compromisso equitativo que atende a ambas as partes.",
    content_en: "Dra. Helena: Good morning, everyone. As stipulated on the agenda, we must deliberate on the confidentiality clause.\nDr. Eduardo: Perfect, Dra. Helena. However, as much as we understand the board's prudence, we consider the five-year term disproportionate.\nDra. Helena: I understand your apprehension. But in order for us to mitigate corporate espionage risks, it is necessary to safeguard the algorithm data.\nDr. Eduardo: If we establish proportional compensation in the event of termination without cause, we are prepared to accept the requested duration.\nDra. Helena: Excellent. It seems to me an equitable compromise that satisfies both parties.",
    glossary: {
      "deliberar": "debater para tomar uma decisão formal",
      "apreensão": "receio, cautela, preocupação justificada",
      "equitativo": "justo, balanceado, imparcial"
    },
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Original C1 dialogue script created for Polyglot C1 Daily."
    }
  },
  {
    id: "es-mat-read-01",
    language: "es",
    material_type: "reading_passage",
    title: "Ética, Inteligencia Artificial y Responsabilidad Jurídica",
    cefr_level: "C1",
    regional_variety: "all",
    content_target: "La acelerada penetración de modelos algorítmicos en la toma de decisiones judiciales y crediticias ha suscitado un debate deontológico de primer orden. Por mucho que los desarrolladores insistan en la supuesta neutralidad matemática del código, los sesgos implícitos en los datos históricos tienden a perpetuar desigualdades estructurales preexistentes. A tenor de los principios constitucionales que garantizan la tutela judicial efectiva, resulta inadmisible delegar la discrecionalidad valorativa en sistemas opacos que carecen de explicabilidad causal. Por ende, la comunidad regulatoria internacional aboga por un marco normativo vinculante que supedite la innovación tecnológica a la salvaguarda de la dignidad humana.",
    content_en: "The rapid penetration of algorithmic models into judicial and credit decision-making has sparked a first-rate deontological debate. However much developers insist on the supposed mathematical neutrality of code, the biases implicit in historical data tend to perpetuate pre-existing structural inequalities. In accordance with the constitutional principles that guarantee effective judicial protection, it is inadmissible to delegate discretionary judgment to opaque systems that lack causal explainability. Therefore, the international regulatory community advocates for a binding regulatory framework that subordinates technological innovation to the safeguarding of human dignity.",
    glossary: {
      "deontológico": "relativo a los deberes éticos y principios morales de una profesión",
      "sesgos": "inclinaciones, desviaciones sistemáticas o prejuicios de cálculo",
      "supedite": "subordine o condicione algo al cumplimiento de otra premisa"
    },
    comprehension_questions: [
      {
        question: "¿Por qué el autor descarta la pretendida 'neutralidad matemática' de los algoritmos?",
        options: [
          "Porque los sesgos de los datos históricos reproducen desigualdades previas.",
          "Porque los modelos informáticos consumen demasiada energía computacional.",
          "Porque los jueces prefieren prescindir totalmente de computadoras."
        ],
        correct_option_index: 0,
        explanation: "El texto explicita que 'los sesgos implícitos en los datos históricos tienden a perpetuar desigualdades estructurales'."
      }
    ],
    speaking_prompt: "¿Hasta qué punto deberían los sistemas automatizados intervenir en juicios penales?",
    writing_prompt: "Redacte un dictamen valorativo sobre la transparencia algorítmica en la contratación pública.",
    audio_url: "https://tatoeba.org/audio/es/etica_ai_c1.mp3",
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Original C1 reading comprehension text created for Polyglot C1 Daily."
    }
  },
  {
    id: "es-mat-conv-01",
    language: "es",
    material_type: "conversation_script",
    title: "Deliberación Académica en un Tribunal de Tesis",
    cefr_level: "C1",
    regional_variety: "all",
    content_target: "Prof. Castillo: Estimados colegas, tras escuchar la defensa del doctorando, procede emitir nuestra calificación.\nProf. Morales: Si me permiten una observación preliminar, considero que la metodología cuantitativa adolece de cierta rigidez.\nProf. Castillo: No obstante, reconozcamos que el marco teórico resulta impecable. Si hubiera soslayado esas fuentes primarias, habríamos tenido motivos de reparo, pero las analizó con rigor.\nProf. Morales: En efecto, concedo ese punto. A condición de que el autor incorpore una adenda bibliográfica en la versión final, votaré a favor de la máxima calificación con mención de honor.",
    content_en: "Prof. Castillo: Dear colleagues, having heard the candidate's dissertation defense, it is now time to issue our grade.\nProf. Morales: If you allow me a preliminary observation, I consider that the quantitative methodology suffers from a certain rigidity.\nProf. Castillo: Nevertheless, let us acknowledge that the theoretical framework is impeccable. Had he overlooked those primary sources, we would have had grounds for objection, but he analyzed them with rigor.\nProf. Morales: Indeed, I concede that point. On the condition that the author incorporates a bibliographic addendum in the final version, I will vote in favor of the highest grade with honors distinction.",
    glossary: {
      "adolece de": "padece o sufre de un defecto o carencia",
      "adenda": "apéndice o conjunto de notas añadidas al final de una obra"
    },
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Original C1 dialogue script created for Polyglot C1 Daily."
    }
  },
  {
    id: "en-mat-read-01",
    language: "en",
    material_type: "reading_passage",
    title: "Technological Governance and Algorithmic Accountability",
    cefr_level: "C1",
    regional_variety: "all",
    content_target: "The exponential deployment of autonomous algorithmic systems necessitates an unprecedented degree of ethical and regulatory scrutiny. While proponents champion the efficiency gains of automated decision-making, critics caution against the entrenchment of systemic biases. Under no circumstances should algorithmic opacity be permitted in sensitive domains such as judicial sentencing or medical diagnostics. Policymakers must therefore formulate stringent accountability standards that reconcile technological innovation with fundamental human rights.",
    content_en: "The exponential deployment of autonomous algorithmic systems necessitates an unprecedented degree of ethical and regulatory scrutiny. While proponents champion the efficiency gains of automated decision-making, critics caution against the entrenchment of systemic biases. Under no circumstances should algorithmic opacity be permitted in sensitive domains such as judicial sentencing or medical diagnostics. Policymakers must therefore formulate stringent accountability standards that reconcile technological innovation with fundamental human rights.",
    content_pt: "A implantação exponencial de sistemas algorítmicos autônomos requer um grau sem precedentes de escrutínio ético e regulatório. Embora os defensores enalteçam os ganhos de eficiência da tomada de decisão automatizada, os críticos alertam contra o enraizamento de vieses sistêmicos. Sob hipótese alguma a opacidade algorítmica deve ser permitida em domínios sensíveis como sentenças judiciais ou diagnósticos médicos. Os formuladores de políticas devem, portanto, estabelecer normas rigorosas de responsabilidade que conciliem a inovação tecnológica com os direitos humanos fundamentais.",
    content_es: "El despliegue exponencial de sistemas algorítmicos autónomos requiere un grado sin precedentes de escrutinio ético y regulatorio. Mientras los defensores celebran las ganancias de eficiencia de la toma de decisiones automatizada, los críticos advierten contra el afianzamiento de sesgos sistémicos. Bajo ninguna circunstancia se debe permitir la opacidad algorítmica en ámbitos sensibles como sentencias judiciales o diagnósticos médicos. Por lo tanto, los legisladores deben formular normas estrictas de rendición de cuentas que concilien la innovación tecnológica con los derechos humanos fundamentales.",
    glossary: {
      "scrutiny": "rigorous examination and critical observation",
      "entrenchment": "firm establishment of an idea or attitude so that change is unlikely",
      "stringent": "strict, precise, and exacting"
    },
    comprehension_questions: [
      {
        question: "According to the passage, what must policymakers reconcile?",
        options: [
          "Technological innovation with fundamental human rights.",
          "Corporate profits with international tax loopholes.",
          "Hardware manufacturing with intellectual property laws."
        ],
        correct_option_index: 0,
        explanation: "The text states that policymakers 'must therefore formulate stringent accountability standards that reconcile technological innovation with fundamental human rights'."
      }
    ],
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Original pedagogical C1 essay prepared for English learners."
    }
  },
  {
    id: "en-mat-conv-01",
    language: "en",
    material_type: "conversation_script",
    title: "Executive Strategy Boardroom Deliberation",
    cefr_level: "C1",
    regional_variety: "all",
    content_target: "Dr. Evans: Colleagues, our primary objective this morning is to evaluate the proposed expansion into emerging markets.\nMs. Vance: If I may interject, the geopolitical volatility warrants caution. Rarely has a market entry succeeded without robust local hedging.\nDr. Evans: Nevertheless, the long-term demographic dividends are undeniable. Provided we mitigate currency exposure through structured forwards, our risk profile remains manageable.\nMs. Vance: That is indeed a prudent compromise. I propose we commission an independent risk audit prior to final capital deployment.",
    content_en: "Dr. Evans: Colleagues, our primary objective this morning is to evaluate the proposed expansion into emerging markets.\nMs. Vance: If I may interject, the geopolitical volatility warrants caution. Rarely has a market entry succeeded without robust local hedging.\nDr. Evans: Nevertheless, the long-term demographic dividends are undeniable. Provided we mitigate currency exposure through structured forwards, our risk profile remains manageable.\nMs. Vance: That is indeed a prudent compromise. I propose we commission an independent risk audit prior to final capital deployment.",
    content_pt: "Dr. Evans: Colegas, nosso objetivo principal esta manhã é avaliar a proposta de expansão para mercados emergentes.\nSra. Vance: Se me permite intervir, a volatilidade geopolítica exige cautela. Raramente uma entrada de mercado foi bem-sucedida sem proteção cambial (hedge) local robusta.\nDr. Evans: Não obstante, os dividendos demográficos de longo prazo são inegáveis. Contanto que atenuemos a exposição cambial por meio de contratos a termo estruturados, nosso perfil de risco permanece administrável.\nSra. Vance: Esse é de fato um compromisso prudente. Proponho contratarmos uma auditoria de risco independente antes da alocação final de capital.",
    content_es: "Dr. Evans: Colegas, nuestro objetivo principal esta mañana es evaluar la propuesta de expansión hacia mercados emergentes.\nSra. Vance: Si me permiten intervenir, la volatilidad geopolítica exige cautela. Rara vez la entrada a un mercado ha tenido éxito sin una cobertura local sólida.\nDr. Evans: No obstante, los dividendos demográficos a largo plazo son innegables. Siempre que mitiguemos la exposición cambiaria mediante contratos a plazo estructurados, nuestro perfil de riesgo sigue siendo manejable.\nSra. Vance: Ese es ciertamente un compromiso prudente. Propongo encargar una auditoría de riesgos independiente antes del despliegue final de capital.",
    glossary: {
      "interject": "say something abruptly, typically as an interruption",
      "hedging": "protecting oneself against loss or financial risk",
      "mitigate": "make less severe, harmful, or painful"
    },
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Pedagogical English boardroom dialogue prepared for Polyglot C1 Daily."
    }
  }
];

export const exerciseTemplates: ExerciseTemplate[] = [
  {
    id: "ex-pt-01",
    curriculum_node_id: "pt-c1-01",
    language: "pt",
    exercise_type: "multiple_choice",
    prompt: "Selecione a opção que completa corretamente a frase com o infinitivo pessoal flexionado:",
    context_passage: "Para nós _____ o prazo legal, foi necessário trabalhar durante o fim de semana.",
    acceptable_solutions: ["cumprirmos"],
    distractors: [
      {
        text: "cumprir",
        why_incorrect: "Falta a desinência pessoal '-mos' exigida pelo pronome 'nós' explícito como sujeito da oração reduzida."
      },
      {
        text: "cumpramos",
        why_incorrect: "'Cumpramos' é presente do subjuntivo; a preposição 'para' com oração reduzida de infinitivo rege o infinitivo pessoal flexionado."
      },
      {
        text: "cumpriram",
        why_incorrect: "'Cumpriram' é pretérito perfeito do indicativo na 3ª pessoa do plural, incompatível com o sujeito 'nós'."
      }
    ],
    explanation: "Com o sujeito explícito 'nós' introduzido pela preposição final 'para', flexiona-se o verbo no infinitivo pessoal: cumprir + mos = cumprirmos.",
    hint: "Lembre-se da terminação regular de 1ª pessoa do plural no infinitivo (-mos).",
    difficulty: 3,
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Original exercise item for Polyglot C1 Daily."
    }
  },
  {
    id: "ex-pt-02",
    curriculum_node_id: "pt-c1-02",
    language: "pt",
    exercise_type: "cloze",
    prompt: "Preencha a lacuna com a forma correta do verbo 'ver' no futuro do subjuntivo:",
    context_passage: "Assim que você _____ o relatório de auditoria, convoque a equipe imediatamente.",
    acceptable_solutions: ["vir"],
    distractors: [
      {
        text: "ver",
        why_incorrect: "'Ver' é o infinitivo impessoal. O futuro do subjuntivo de 'ver' tem o radical irregular 'vir'."
      },
      {
        text: "veja",
        why_incorrect: "'Veja' é presente do subjuntivo; a conjunção 'assim que' exige o futuro do subjuntivo."
      }
    ],
    explanation: "O futuro do subjuntivo do verbo 'ver' conjuga-se: quando eu vir, quando você vir, quando nós virmos, quando eles virem.",
    hint: "O radical do verbo 'ver' no futuro do subjuntivo é idêntico ao infinitivo de 'vir'.",
    difficulty: 4,
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Original exercise item for Polyglot C1 Daily."
    }
  },
  {
    id: "ex-es-01",
    curriculum_node_id: "es-c1-01",
    language: "es",
    exercise_type: "multiple_choice",
    prompt: "Elija la opción adecuada para completar la oración concesiva subordinada:",
    context_passage: "Por mucho que _____ los accionistas, la directiva no modificará la política de dividendos.",
    acceptable_solutions: ["protesten"],
    distractors: [
      {
        text: "protestan",
        why_incorrect: "'Por mucho que' en contextos de obstáculo potencial rige obligatoriamente el modo subjuntivo ('protesten'), no indicativo."
      },
      {
        text: "protestaron",
        why_incorrect: "El pretérito de indicativo no concuerda con la apódosis en futuro ('no modificará')."
      }
    ],
    explanation: "La locución concesiva de intensidad 'por mucho que' rige sistemáticamente subjuntivo en español C1.",
    hint: "Recuerde qué modo verbal es exigido por locuciones concesivas como 'por más que' y 'por mucho que'.",
    difficulty: 3,
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Original exercise item for Polyglot C1 Daily."
    }
  },
  {
    id: "ex-es-02",
    curriculum_node_id: "es-c1-02",
    language: "es",
    exercise_type: "cloze",
    prompt: "Rellene el hueco con la forma adecuada del verbo 'haber' para formular una hipótesis irreal en el pasado:",
    context_passage: "Si nosotros _____ previsto la inflación, habríamos diversificado los activos financieros.",
    acceptable_solutions: ["hubiéramos", "hubiésemos"],
    distractors: [
      {
        text: "habríamos",
        why_incorrect: "La prótasis introducida por 'si' nunca admite condicional en la norma estándar."
      },
      {
        text: "tuviéramos",
        why_incorrect: "'Tener' no es verbo auxiliar para tiempos compuestos en español; es un calco del portugués."
      }
    ],
    explanation: "En las oraciones condicionales irreales del pasado, la prótasis con 'si' exige el pluscuamperfecto de subjuntivo: hubiéramos o hubiésemos.",
    hint: "Cuidado con interferencias del portugués: en español se usa exclusivamente el auxiliar 'haber'.",
    difficulty: 4,
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Original exercise item for Polyglot C1 Daily."
    }
  },
  {
    id: "en-ex-c1-01",
    curriculum_node_id: "en-c1-01",
    language: "en",
    exercise_type: "multiple_choice",
    prompt: "Complete the sentence with the appropriate inverted structure: 'Under no circumstances _____ credentials in client-side code.'",
    acceptable_solutions: ["should developers store"],
    distractors: [
      { text: "developers should store", why_incorrect: "Inversion is required after sentence-initial negative/restrictive phrases." },
      { text: "developers store", why_incorrect: "Missing auxiliary verb and missing inversion." },
      { text: "developers should have stored", why_incorrect: "Incorrect modal tense and missing inverted word order." }
    ],
    explanation: "Sentences beginning with negative adverbial expressions such as 'Under no circumstances' require subject-auxiliary inversion ('should developers store').",
    hint: "Remember: Auxiliary verb + Subject + Main verb.",
    difficulty: 4,
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Pedagogical syntax template prepared for Polyglot C1 Daily."
    }
  },
  {
    id: "en-ex-c1-02",
    curriculum_node_id: "en-c1-01",
    language: "en",
    exercise_type: "cloze",
    prompt: "Rarely _____ (to witness) a startup achieve profitability within its first operational quarter.",
    acceptable_solutions: ["do we witness", "does one witness", "have we witnessed"],
    distractors: [
      { text: "we witness", why_incorrect: "Fails to invert the subject and auxiliary verb." },
      { text: "we have witnessed", why_incorrect: "Requires inversion: 'have we witnessed'." }
    ],
    explanation: "'Rarely' at the clause start requires inverted auxiliary: 'do we witness' or 'have we witnessed'.",
    hint: "Place auxiliary 'do' or 'have' before the subject pronoun.",
    difficulty: 4,
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Exercise template prepared for Polyglot C1 Daily."
    }
  }
];

export const falseFriends: FalseFriendItem[] = [
  {
    id: "ff-01",
    portuguese_term: "esquisito",
    spanish_term: "exquisito",
    pt_meaning_en: "weird, strange, eccentric, bizarre",
    es_meaning_en: "delicious, exquisite, superb quality",
    pt_example: "O comportamento daquele homem pareceu-me bastante esquisito.",
    es_example: "Este vino tinto de la Rioja tiene un sabor exquisito.",
    interference_warning: "Nunca elogie uma refeição em Portugal ou no Brasil dizendo que a comida está 'esquisita'! Em espanhol 'exquisito' é um grande elogio; em português significa bizarro.",
    cefr_level: "A2",
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Comparative linguistic analysis prepared for Polyglot C1 Daily."
    }
  },
  {
    id: "ff-02",
    portuguese_term: "embaraçada",
    spanish_term: "embarazada",
    pt_meaning_en: "embarrassed, confused, tangled, shy",
    es_meaning_en: "pregnant (expecting a child)",
    pt_example: "Ela ficou muito embaraçada ao esquecer o nome do conferencista.",
    es_example: "Mi hermana está embarazada de cinco meses y espera gemelos.",
    interference_warning: "Dizer em espanhol 'estoy embarazada' para expressar vergonha significa 'estou grávida'. Em espanhol use 'avergonzado/a'.",
    cefr_level: "A2",
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Comparative linguistic analysis prepared for Polyglot C1 Daily."
    }
  },
  {
    id: "ff-03",
    portuguese_term: "propina",
    spanish_term: "propina",
    pt_meaning_en: "bribe / illicit kickback (BR) or university fee (PT)",
    es_meaning_en: "tip, gratuity given to servers or delivery staff",
    pt_example: "O diretor foi indiciado por exigir propina de fornecedores da empresa.",
    es_example: "Dejamos una propina del diez por ciento al camarero por su buen servicio.",
    interference_warning: "Em espanhol, deixar una 'propina' é gorjeta. No Brasil, 'propina' é crime de corrupção passiva (suborno).",
    cefr_level: "B1",
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Comparative linguistic analysis prepared for Polyglot C1 Daily."
    }
  },
  {
    id: "ff-04",
    portuguese_term: "polvo",
    spanish_term: "polvo",
    pt_meaning_en: "octopus (marine cephalopod mollusk)",
    es_meaning_en: "dust, powder, tiny particles",
    pt_example: "No almoço de domingo, comemos um delicioso arroz de polvo à lagareiro.",
    es_example: "El viento del desierto levantó una enorme nube de polvo sobre la carretera.",
    interference_warning: "Em espanhol 'pulpo' é o animal marinho. 'Polvo' em espanhol é poeira. Em português 'polvo' é o molusco e poeira é pó.",
    cefr_level: "A2",
    attribution: {
      source_name: "Polyglot C1 Daily Open Curriculum",
      source_url: "https://github.com/polyglot-c1-daily",
      license_type: "Original-Curated",
      attribution_text: "Comparative linguistic analysis prepared for Polyglot C1 Daily."
    }
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

export interface WikipediaSeedArticle {
  pageid: string;
  title: string;
  language: Language;
  topic_category: string;
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  description: string;
  extract: string;
  extract_en?: string;
  extract_pt?: string;
  extract_es?: string;
  thumbnail_url: string;
  content_url: string;
  glossary: Record<string, string>;
  comprehension_questions: Array<{
    question: string;
    options: string[];
    correct_option_index: number;
    explanation: string;
  }>;
  attribution: Attribution;
}

export const wikipediaArticles: WikipediaSeedArticle[] = [
  {
    pageid: "61245",
    title: "Energia solar",
    language: "pt",
    topic_category: "Ciência e Tecnologia",
    cefr_level: "B2",
    description: "energia obtida a partir da luz e do calor do Sol",
    extract: "A energia solar é uma energia renovável obtida pela luz do sol, utilizada principalmente para geração de eletricidade e aquecimento de água. Os métodos de captura da energia solar podem ser classificados em diretos ou indiretos. Os sistemas fotovoltaicos convertem a radiação solar diretamente em energia elétrica através do efeito fotoelétrico em células de silício. A energia solar é considerada inesgotável e sustentável, desempenhando um papel crucial na transição energética global e na redução das emissões de gases de efeito estufa.",
    extract_en: "Solar energy is renewable energy obtained from sunlight, primarily utilized for electricity generation and water heating. Methods for capturing solar energy can be classified as direct or indirect. Photovoltaic systems convert solar radiation directly into electrical power through the photoelectric effect in silicon cells. Solar energy is regarded as inexhaustible and sustainable, playing a crucial role in the global energy transition and the reduction of greenhouse gas emissions.",
    thumbnail_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Solar_panels_on_a_roof.jpg/320px-Solar_panels_on_a_roof.jpg",
    content_url: "https://pt.wikipedia.org/wiki/Energia_solar",
    glossary: {
      "inesgotável": "que não se pode esgotar ou acabar",
      "radiação": "propagação de energia sob a forma de ondas ou partículas",
      "transição energética": "mudança estrutural no fornecimento e consumo de energia"
    },
    comprehension_questions: [
      {
        question: "Como os sistemas fotovoltaicos geram energia elétrica segundo o texto?",
        options: [
          "Através do efeito fotoelétrico diretamente da radiação solar",
          "Pelo aquecimento mecânico de turbinas a vapor",
          "Mediante a queima de compostos químicos fotoativos",
          "Através de processos indiretos de fissão nuclear"
        ],
        correct_option_index: 0,
        explanation: "O texto afirma explicitamente que 'os sistemas fotovoltaicos convertem a radiação solar diretamente em energia elétrica através do efeito fotoelétrico'."
      }
    ],
    attribution: {
      source_name: "Wikipédia em Português",
      source_url: "https://pt.wikipedia.org/wiki/Energia_solar",
      license_type: "CC-BY-SA-4.0",
      attribution_text: "Artigo da Wikipédia (pt.wikipedia.org), disponível sob a licença Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0).",
      terms_url: "https://creativecommons.org/licenses/by-sa/4.0/"
    }
  },
  {
    pageid: "31920",
    title: "Energía eólica",
    language: "es",
    topic_category: "Ciencia y Tecnología",
    cefr_level: "B2",
    description: "energía que se obtiene a partir del viento",
    extract: "La energía eólica es la energía que se obtiene a partir del viento, es decir, mediante el aprovechamiento de la energía cinética de las masas de aire. El término «eólico» proviene del latín Aeolicus, que a su vez deriva de Eolo, el dios de los vientos en la mitología griega. En la actualidad, los aerogeneradores modernos convierten la energía cinética del viento en electricidad para ser inyectada en la red eléctrica. Es una de las fuentes de energía renovable más maduras, limpias y competitivas del mundo contemporáneo.",
    extract_en: "Wind energy is the energy harvested from wind, that is, through the harnessing of the kinetic energy of air masses. The term 'wind' (eólico) originates from the Latin Aeolicus, which in turn stems from Aeolus, the ruler of winds in Greek mythology. Today, modern wind turbines convert the kinetic energy of the wind into electricity to be fed into the power grid. It is one of the most mature, clean, and competitive sources of renewable energy in the modern world.",
    thumbnail_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Windmills_in_La_Mancha.jpg/320px-Windmills_in_La_Mancha.jpg",
    content_url: "https://es.wikipedia.org/wiki/Energ%C3%ADa_e%C3%B3lica",
    glossary: {
      "cinética": "relativo al movimiento físico",
      "aerogenerador": "turbina movida por el viento para generar electricidad",
      "aprovechamiento": "acción de obtener rendimiento de una fuente"
    },
    comprehension_questions: [
      {
        question: "¿De qué fenómeno físico obtiene la energía eólica su potencial energético?",
        options: [
          "De la energía cinética de las masas de aire en movimiento",
          "Del calentamiento solar de paneles semiconductores",
          "De la presión osmótica en aguas subterráneas",
          "De la evaporación súbita de corrientes marinas"
        ],
        correct_option_index: 0,
        explanation: "El texto explica claramente que 'se obtiene a partir del viento, es decir, mediante el aprovechamiento de la energía cinética de las masas de aire'."
      }
    ],
    attribution: {
      source_name: "Wikipedia en Español",
      source_url: "https://es.wikipedia.org/wiki/Energ%C3%ADa_e%C3%B3lica",
      license_type: "CC-BY-SA-4.0",
      attribution_text: "Artículo de Wikipedia (es.wikipedia.org), disponible bajo la licencia Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0).",
      terms_url: "https://creativecommons.org/licenses/by-sa/4.0/"
    }
  },
  {
    pageid: "18934",
    title: "Renewable energy",
    language: "en",
    topic_category: "Science & Technology",
    cefr_level: "C1",
    description: "energy collected from renewable resources",
    extract: "Renewable energy is energy derived from natural resources that replenish themselves in less than a human lifetime without depleting the planet's resources. These resources—such as sunlight, wind, rain, tides, waves, and geothermal heat—stand in contrast to fossil fuels, which are consumed far faster than they are naturally replenished. In contemporary industrial policy, transitioning to renewable energy systems represents not only an environmental imperative, but also a cornerstone of long-term economic resilience and geopolitical energy security.",
    extract_pt: "A energia renovável é a energia obtida a partir de recursos naturais que se regeneram em menos de uma vida humana, sem esgotar os recursos do planeta. Esses recursos — como luz solar, vento, chuva, marés, ondas e calor geotérmico — contrastam com os combustíveis fósseis, que são consumidos muito mais rápido do que sua reposição natural. Na política industrial contemporânea, a transição para sistemas de energia renovável representa não apenas um imperativo ambiental, mas também um pilar da resiliência econômica e da segurança energética geopolítica de longo prazo.",
    extract_es: "La energía renovable es la energía obtenida de recursos naturales que se reabastecen en menos de una vida humana sin agotar los recursos del planeta. Estos recursos —como la luz solar, el viento, la lluvia, las mareas, las olas y el calor geotérmico— contrastan con los combustibles fósiles, que se consumen mucho más rápido de lo que se reponen naturalmente. En la política industrial contemporánea, la transición hacia sistemas de energía renovable representa no solo un imperativo ambiental, sino también un pilar de la resiliencia económica y la seguridad energética geopolítica a largo plazo.",
    thumbnail_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Solar_panels_and_wind_turbines.jpg/320px-Solar_panels_and_wind_turbines.jpg",
    content_url: "https://en.wikipedia.org/wiki/Renewable_energy",
    glossary: {
      "replenish": "fill something up again; restore to a former level",
      "depleting": "using up the supply or resources of",
      "imperative": "an essential or urgent thing; a necessity"
    },
    comprehension_questions: [
      {
        question: "According to the article, what distinguishes renewable resources from fossil fuels?",
        options: [
          "They naturally replenish themselves in less than a human lifetime without depletion.",
          "They rely exclusively on underground fossil deposits.",
          "They cannot be converted into electricity for industrial grids."
        ],
        correct_option_index: 0,
        explanation: "The article notes that renewable energy is 'derived from natural resources that replenish themselves in less than a human lifetime without depleting the planet's resources'."
      }
    ],
    attribution: {
      source_name: "English Wikipedia",
      source_url: "https://en.wikipedia.org/wiki/Renewable_energy",
      license_type: "CC-BY-SA-4.0",
      attribution_text: "Article from Wikipedia (en.wikipedia.org), available under the Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0).",
      terms_url: "https://creativecommons.org/licenses/by-sa/4.0/"
    }
  },
  {
    pageid: "10345",
    title: "Inteligência artificial",
    language: "pt",
    topic_category: "Ciência e Tecnologia",
    cefr_level: "C1",
    description: "campo da ciência da computação dedicado à emulação de processos cognitivos humanos",
    extract: "A inteligência artificial (IA) é um domínio interdisciplinar da ciência da computação voltado ao desenvolvimento de sistemas algorítmicos capazes de executar tarefas cognitivas complexas, tais como raciocínio inferencial, aprendizado supervisionado e processamento de linguagem natural. Os avanços recentes em redes neurais profundas e modelos de linguagem de grande escala impulsionaram transformações paradigmáticas em diversos setores, suscitando debates contemporâneos sobre governança de dados, alinhamento ético e os impactos socioeconômicos da automação cognitiva no mercado de trabalho.",
    extract_en: "Artificial intelligence (AI) is an interdisciplinary field of computer science dedicated to the development of algorithmic systems capable of performing complex cognitive tasks, such as inferential reasoning, supervised learning, and natural language processing. Recent breakthroughs in deep neural networks and large language models have driven paradigmatic transformations across numerous sectors, prompting contemporary debates on data governance, ethical alignment, and the socioeconomic impacts of cognitive automation in the labor market.",
    thumbnail_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Artificial_intelligence_prompt_completion.png/320px-Artificial_intelligence_prompt_completion.png",
    content_url: "https://pt.wikipedia.org/wiki/Intelig%C3%AAncia_artificial",
    glossary: {
      "interdisciplinar": "que estabelece relações entre duas ou mais disciplinas científicas",
      "paradigmático": "que serve de modelo exemplar ou causa mudança radical de fundamentos",
      "alinhamento": "harmonização entre objetivos algorítmicos e valores humanos éticos"
    },
    comprehension_questions: [
      {
        question: "De acordo com o texto, quais desenvolvimentos recentes impulsionaram transformações paradigmáticas na IA?",
        options: [
          "Avanços em redes neurais profundas e modelos de linguagem de grande escala",
          "O abandono total de algoritmos probabilísticos em favor da lógica simbólica pura",
          "A substituição de semicondutores por válvulas termiônicas de baixa frequência"
        ],
        correct_option_index: 0,
        explanation: "O texto explicita que 'avanços recentes em redes neurais profundas e modelos de linguagem de grande escala impulsionaram transformações paradigmáticas'."
      }
    ],
    attribution: {
      source_name: "Wikipédia em Português",
      source_url: "https://pt.wikipedia.org/wiki/Intelig%C3%AAncia_artificial",
      license_type: "CC-BY-SA-4.0",
      attribution_text: "Artigo da Wikipédia (pt.wikipedia.org), disponível sob a licença Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0).",
      terms_url: "https://creativecommons.org/licenses/by-sa/4.0/"
    }
  },
  {
    pageid: "14820",
    title: "Inteligencia artificial",
    language: "es",
    topic_category: "Ciencia y Tecnología",
    cefr_level: "C1",
    description: "disciplina científica que se ocupa de crear sistemas computacionales inteligentes",
    extract: "La inteligencia artificial (IA) constituye una rama de las ciencias de la computación que diseña y analiza agentes racionales y arquitecturas algorítmicas capaces de percibir su entorno y deliberar acciones orientadas a la consecución de objetivos predeterminados. Mediante la articulación de modelos estadísticos, arquitecturas neuronales y aprendizaje por refuerzo, los sistemas de IA contemporáneos exhiben capacidades notables de generalización en traducción automática, visión computacional y modelado predictivo, planteando desafíos sustanciales en materia de privacidad, transparencia algorítmica y responsabilidad jurídica.",
    extract_en: "Artificial intelligence (AI) constitutes a branch of computer science that designs and analyzes rational agents and algorithmic architectures capable of perceiving their environment and deliberating actions geared toward achieving predetermined goals. Through the articulation of statistical models, neural architectures, and reinforcement learning, contemporary AI systems exhibit notable generalization capabilities in machine translation, computer vision, and predictive modeling, raising substantial challenges regarding privacy, algorithmic transparency, and legal accountability.",
    thumbnail_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Artificial_intelligence_prompt_completion.png/320px-Artificial_intelligence_prompt_completion.png",
    content_url: "https://es.wikipedia.org/wiki/Inteligencia_artificial",
    glossary: {
      "deliberar": "considerar atenta y detenidamente los motivos de una decisión",
      "consecución": "acción de conseguir o alcanzar aquello que se pretende",
      "generalización": "capacidad de aplicar conocimientos aprendidos a situaciones no vistas previamente"
    },
    comprehension_questions: [
      {
        question: "¿Qué capacidades demuestran los sistemas contemporáneos según el fragmento?",
        options: [
          "Capacidades notables de generalización en traducción, visión y modelado predictivo",
          "Inmunidad total frente a sesgos algorítmicos y distorsiones estadísticas",
          "Autonomía biológica desvinculada de sustratos de computación electrónica"
        ],
        correct_option_index: 0,
        explanation: "El texto especifica que 'exhiben capacidades notables de generalización en traducción automática, visión computacional y modelado predictivo'."
      }
    ],
    attribution: {
      source_name: "Wikipedia en Español",
      source_url: "https://es.wikipedia.org/wiki/Inteligencia_artificial",
      license_type: "CC-BY-SA-4.0",
      attribution_text: "Artículo de Wikipedia (es.wikipedia.org), disponible bajo la licencia Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0).",
      terms_url: "https://creativecommons.org/licenses/by-sa/4.0/"
    }
  },
  {
    pageid: "1164",
    title: "Artificial intelligence",
    language: "en",
    topic_category: "Computer Science",
    cefr_level: "C1",
    description: "intelligence of machines or software as opposed to the intelligence of living beings",
    extract: "Artificial intelligence (AI) is the computational study and synthesis of rational behavior, enabling computational systems to interpret external empirical inputs, synthesize contextual inferences, and formulate optimized decisions in complex, dynamic environments. The contemporary paradigm relies substantially on transformer architectures, gradient optimization across vast textual corpuses, and probabilistic reasoning. Consequently, the widespread institutional adoption of autonomous agents necessitates rigorous scrutiny regarding algorithmic accountability, interpretability, and long-term societal resilience.",
    extract_pt: "A inteligência artificial (IA) é o estudo computacional e a síntese do comportamento racional, permitindo que sistemas interpretem entradas empíricas externas, sintetizem inferências contextuais e formulem decisões otimizadas em ambientes complexos e dinâmicos. O paradigma contemporâneo baseia-se substancialmente em arquiteturas de transformadores, otimização de gradiente em vastos corpora textuais e raciocínio probabilístico.",
    extract_es: "La inteligencia artificial (IA) es el estudio computacional y la síntesis del comportamiento racional, permitiendo que los sistemas interpreten entradas empíricas externas, sinteticen inferencias contextuales y formulen decisiones optimizadas en entornos complejos y dinámicos. El paradigma contemporáneo se apoya sustancialmente en arquitecturas de transformadores, optimización de gradiente en vastos corpus textuales y razonamiento probabilístico.",
    thumbnail_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Artificial_intelligence_prompt_completion.png/320px-Artificial_intelligence_prompt_completion.png",
    content_url: "https://en.wikipedia.org/wiki/Artificial_intelligence",
    glossary: {
      "synthesis": "the combination of ideas to form a theory or system",
      "inferences": "conclusions reached on the basis of evidence and reasoning",
      "scrutiny": "critical observation or rigorous examination"
    },
    comprehension_questions: [
      {
        question: "What does the contemporary AI paradigm substantially rely upon according to the text?",
        options: [
          "Transformer architectures, gradient optimization across vast corpora, and probabilistic reasoning",
          "Mechanical relay circuits and analog telephone networks exclusively",
          "Manual rule curation without empirical dataset training"
        ],
        correct_option_index: 0,
        explanation: "The text states that the contemporary paradigm 'relies substantially on transformer architectures, gradient optimization across vast textual corpuses, and probabilistic reasoning'."
      }
    ],
    attribution: {
      source_name: "English Wikipedia",
      source_url: "https://en.wikipedia.org/wiki/Artificial_intelligence",
      license_type: "CC-BY-SA-4.0",
      attribution_text: "Article from Wikipedia (en.wikipedia.org), available under the Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0).",
      terms_url: "https://creativecommons.org/licenses/by-sa/4.0/"
    }
  }
];
