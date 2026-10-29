/**
 * Polyglot C1 Daily — Trilingual Translation & English Learning Corpus.
 * 
 * Supports learners from Portuguese-speaking (Brasil, Portugal) and
 * Spanish-speaking (España, Latinoamérica) regions to learn English,
 * and enables bidirectional translation between EN, PT, and ES.
 * 
 * Content licensed under CC-BY-SA 3.0 (Wiktionary) & CC-BY 2.0 FR (Tatoeba).
 */

export interface TrilingualEntry {
  id: string;
  english: string;
  portuguese: string;
  spanish: string;
  part_of_speech: string;
  phonetic_en: string;
  phonetic_pt?: string;
  phonetic_es?: string;
  definition_en: string;
  definition_pt: string;
  definition_es: string;
  example_en: string;
  example_pt: string;
  example_es: string;
  category: 'vocabulary' | 'phrasal_verb' | 'false_cognate' | 'business' | 'academic';
  notes_for_pt_speakers?: string;
  notes_for_es_speakers?: string;
}

export interface EnglishLearningChallenge {
  id: string;
  source_lang: 'pt' | 'es';
  source_text: string;
  target_english: string;
  accepted_answers: string[];
  options?: string[];
  explanation_pt: string;
  explanation_es: string;
  common_transfer_mistake: string;
  topic: string;
}

export const trilingualDictionary: TrilingualEntry[] = [
  {
    id: "tri-01",
    english: "prerogative",
    portuguese: "prerrogativa",
    spanish: "prerrogativa",
    part_of_speech: "noun",
    phonetic_en: "/prɪˈrɒɡətɪv/",
    phonetic_pt: "/pɾe.ʁo.ɡaˈtʃi.vɐ/",
    phonetic_es: "/pɾe.ro.ɣaˈti.βa/",
    definition_en: "An exclusive right, privilege, or immunity peculiar to a person, office, or group.",
    definition_pt: "Direito exclusivo, privilégio ou regalia inerente a um cargo ou função.",
    definition_es: "Privilegio, gracia o exención que se concede a alguien por su dignidad o cargo.",
    example_en: "Constitutional review is an exclusive prerogative of the Supreme Court.",
    example_pt: "O controle de constitucionalidade é uma prerrogativa exclusiva da Suprema Corte.",
    example_es: "El control de constitucionalidad es una prerrogativa exclusiva del Tribunal Supremo.",
    category: "academic",
    notes_for_pt_speakers: "Mesmo sentido formal e jurídico. Pronuncie com ênfase na segunda sílaba: pre-ROG-a-tive.",
    notes_for_es_speakers: "Mismo valor en el registro formal. Se acentúa en la segunda sílaba: pre-ROG-a-tive."
  },
  {
    id: "tri-02",
    english: "nevertheless",
    portuguese: "não obstante / contudo",
    spanish: "no obstante / sin embargo",
    part_of_speech: "adverb / connector",
    phonetic_en: "/ˌnevəðəˈles/",
    phonetic_pt: "/nɐ̃w̃ obsˈtɐ̃.tʃi/",
    phonetic_es: "/no obʃˈtante/",
    definition_en: "In spite of that; however; nonetheless (formal contrast connector).",
    definition_pt: "Apesar disso; contudo; todavia (conector adversativo culto).",
    definition_es: "A pesar de ello; sin embargo; no obstante (marcador discursivo adversativo).",
    example_en: "The financial results were modest; nevertheless, company solvency remained solid.",
    example_pt: "Os resultados financeiros foram modestos; não obstante, a solvência da empresa permaneceu sólida.",
    example_es: "Los resultados financieros fueron modestos; no obstante, la solvencia empresarial se mantuvo firme.",
    category: "academic",
    notes_for_pt_speakers: "Muito comum em redações acadêmicas e ensaios formais em inglês como equivalente a 'não obstante'.",
    notes_for_es_speakers: "Equivalente exacto y elegante de 'no obstante' o 'sin embargo' en ensayos en inglés."
  },
  {
    id: "tri-03",
    english: "actually",
    portuguese: "na verdade / realmente",
    spanish: "en realidad / de hecho",
    part_of_speech: "adverb",
    phonetic_en: "/ˈæktʃuəli/",
    definition_en: "In fact, in reality, as a matter of fact (CRITICAL FALSE FRIEND with currently/atualmente).",
    definition_pt: "Na verdade, realmente (FALSO COGNATO: NÃO significa 'atualmente').",
    definition_es: "En realidad, de hecho (FALSO AMIGO: NO significa 'actualmente').",
    example_en: "I thought the meeting was canceled, but it is actually starting right now.",
    example_pt: "Achei que a reunião tinha sido cancelada, mas na verdade está começando agora.",
    example_es: "Pensé que la reunión se había cancelado, pero en realidad está empezando ahora.",
    category: "false_cognate",
    notes_for_pt_speakers: "CUIDADO: 'Actually' = na verdade / de fato. Para dizer 'atualmente', use 'currently' ou 'nowadays'.",
    notes_for_es_speakers: "¡CUIDADO! 'Actually' = en realidad. Para traducir 'actualmente', debes usar 'currently' o 'at present'."
  },
  {
    id: "tri-04",
    english: "currently",
    portuguese: "atualmente / no momento",
    spanish: "actualmente / en la actualidad",
    part_of_speech: "adverb",
    phonetic_en: "/ˈkʌrəntli/",
    definition_en: "At the present time; now (equivalent to PT 'atualmente' and ES 'actualmente').",
    definition_pt: "No momento presente; nos dias de hoje.",
    definition_es: "En el momento presente; hoy en día.",
    example_en: "She is currently working on an international sustainability initiative.",
    example_pt: "Ela está trabalhando atualmente em uma iniciativa internacional de sustentabilidade.",
    example_es: "Actualmente está trabajando en una iniciativa internacional de sostenibilidad.",
    category: "vocabulary",
    notes_for_pt_speakers: "Use 'currently' sempre que quiser expressar 'atualmente'. Evite usar 'actually' com esse sentido.",
    notes_for_es_speakers: "Usa 'currently' cuando quieras decir 'actualmente'. 'Actually' significa 'en realidad'."
  },
  {
    id: "tri-05",
    english: "to weigh / to ponder",
    portuguese: "ponderar / pesar cuidadosamente",
    spanish: "ponderar / sopesar",
    part_of_speech: "verb",
    phonetic_en: "/weɪ/ • /ˈpɒndər/",
    phonetic_pt: "/põ.deˈʁaʁ/",
    phonetic_es: "/pon.deˈɾaɾ/",
    definition_en: "To consider carefully, evaluate pros and cons before deciding.",
    definition_pt: "Refletir com prudência, analisar prós e contras.",
    definition_es: "Examinar con cuidado las razones y consecuencias antes de decidir.",
    example_en: "It is crucial to ponder the ecological consequences before approving the project.",
    example_pt: "É crucial ponderar as consequências ecológicas antes de aprovar o projeto.",
    example_es: "Es crucial sopesar las consecuencias ecológicas antes de aprobar el proyecto.",
    category: "academic",
    notes_for_pt_speakers: "'To ponder' é muito usado em registro formal ou acadêmico em inglês, assim como 'ponderar'.",
    notes_for_es_speakers: "'To ponder' o 'to weigh' traducen con precisión la deliberación reflexiva de 'sopesar'."
  },
  {
    id: "tri-06",
    english: "exquisite",
    portuguese: "refinado / delicioso / excelente (NÃO estranho)",
    spanish: "exquisito / delicioso / selecto",
    part_of_speech: "adjective",
    phonetic_en: "/ɪkˈskwɪzɪt/",
    definition_en: "Extremely beautiful, delicate, or of extraordinary quality (NOT weird).",
    definition_pt: "De beleza ou sabor refinado e singular (Falso amigo com 'esquisito' do português cotidiano!).",
    definition_es: "De singular calidad o sabor excepcional.",
    example_en: "The chef prepared an exquisite dinner for the international delegation.",
    example_pt: "O chef preparou um jantar requintado e primoroso para a delegação internacional.",
    example_es: "El chef preparó una cena exquisita para la delegación internacional.",
    category: "false_cognate",
    notes_for_pt_speakers: "ATENÇÃO: Em inglês, 'exquisite' significa refinado ou delicioso (como no espanhol). Para dizer 'estranho', use 'weird' ou 'strange'.",
    notes_for_es_speakers: "Coincide con el español: algo primoroso o de gusto selecto. En portugués 'esquisito' significa raro."
  },
  {
    id: "tri-07",
    english: "to side-step / to bypass",
    portuguese: "soslaiar / esquivar / contornar",
    spanish: "soslayar / eludir / esquivar",
    part_of_speech: "verb",
    phonetic_en: "/ˈsaɪd.step/ • /ˈbaɪ.pɑːs/",
    definition_en: "To avoid addressing an issue or obstacle directly; to skirt around.",
    definition_pt: "Evitar enfrentar uma dificuldade diretamente; esquivar com tato.",
    definition_es: "Evitar afrontar un problema o compromiso directamente.",
    example_en: "The committee tried to sidestep the controversial ethical questions.",
    example_pt: "O comitê tentou contornar as questões éticas controversas.",
    example_es: "El comité intentó soslayar las polémicas cuestiones éticas.",
    category: "business",
    notes_for_pt_speakers: "Use 'to sidestep' ou 'to bypass' para o sentido de contornar ou desviar de um impasse.",
    notes_for_es_speakers: "Traducción natural de 'soslayar' en negociaciones o debates en inglés."
  },
  {
    id: "tri-08",
    english: "to look forward to (+ -ing)",
    portuguese: "aguardar com expectativa / estar ansioso por",
    spanish: "esperar con ilusión / tener muchas ganas de",
    part_of_speech: "phrasal verb",
    phonetic_en: "/lʊk ˈfɔːwəd tuː/",
    definition_en: "To feel happy and excited about something that is going to happen.",
    definition_pt: "Esperar algo no futuro com antecipação positiva.",
    definition_es: "Esperar algo futuro con entusiasmo y optimismo.",
    example_en: "I look forward to meeting you at the conference next week.",
    example_pt: "Estou ansioso para encontrá-lo na conferência na próxima semana.",
    example_es: "Tengo muchas ganas de conocerle en el congreso la próxima semana.",
    category: "phrasal_verb",
    notes_for_pt_speakers: "REGRA DE OURO: Sempre seguido de verbo com -ING: 'look forward to SEEING you' (e não 'to see').",
    notes_for_es_speakers: "REGLA CLAVE: La preposición 'to' rige gerundio en inglés: 'look forward to HEARING from you'."
  },
  {
    id: "tri-09",
    english: "to bring up",
    portuguese: "mencionar / levantar um assunto",
    spanish: "sacar a colación / mencionar",
    part_of_speech: "phrasal verb",
    phonetic_en: "/brɪŋ ʌp/",
    definition_en: "To mention a topic during a discussion, or to raise a child.",
    definition_pt: "Introduzir um tópico na conversa ou criar uma criança.",
    definition_es: "Mencionar un asunto en una conversación o educar a un hijo.",
    example_en: "She decided not to bring up the budget shortfall during the keynote.",
    example_pt: "Ela decidiu não tocar no assunto do déficit orçamentário durante a apresentação.",
    example_es: "Decidió no sacar a colación el déficit presupuestario durante la ponencia.",
    category: "phrasal_verb",
    notes_for_pt_speakers: "Phrasal verb essencial para reuniões em inglês quando quiser introduzir um tema.",
    notes_for_es_speakers: "Muy habitual en reuniones de trabajo en inglés para plantear un tema."
  },
  {
    id: "tri-10",
    english: "to give up",
    portuguese: "desistir / renunciar",
    spanish: "rendirse / darse por vencido",
    part_of_speech: "phrasal verb",
    phonetic_en: "/ɡɪv ʌp/",
    definition_en: "To cease making an effort; to abandon a habit or pursuit.",
    definition_pt: "Parar de tentar; abandonar um hábito ou objetivo.",
    definition_es: "Abandonar un intento o renunciar a un hábito.",
    example_en: "Even when the task proved challenging, they refused to give up.",
    example_pt: "Mesmo quando a tarefa se mostrou desafiadora, eles se recusaram a desistir.",
    example_es: "Incluso cuando la tarea resultó difícil, se negaron a darse por vencidos.",
    category: "phrasal_verb",
    notes_for_pt_speakers: "'Never give up' = Nunca desista. Também usado para hábitos: 'give up smoking' = parar de fumar.",
    notes_for_es_speakers: "Usado para rendirse o para dejar un hábito: 'give up smoking' = dejar de fumar."
  },
  {
    id: "tri-11",
    english: "sensible",
    portuguese: "sensato / ajuizado (NÃO sensível)",
    spanish: "sensato / prudente (NO sensible)",
    part_of_speech: "adjective",
    phonetic_en: "/ˈsensəbl/",
    definition_en: "Possessing good judgment, wisdom, or practical common sense (CRITICAL FALSE FRIEND).",
    definition_pt: "Pessoa com bom senso, equilibrada e sensata (NÃO confunda com 'sensível'!).",
    definition_es: "Prudente, juicioso y con sentido común (¡FALSO AMIGO: NO es 'sensible'!).",
    example_en: "Investing during a market downturn requires a sensible, disciplined approach.",
    example_pt: "Investir durante uma baixa de mercado exige uma abordagem sensata e disciplinada.",
    example_es: "Invertir durante una caída del mercado requiere un enfoque sensato y disciplinado.",
    category: "false_cognate",
    notes_for_pt_speakers: "FALSO AMIGO CRÍTICO: 'Sensible' = sensato. Para 'sensível' (emocional ou físico), use 'sensitive'.",
    notes_for_es_speakers: "FALSO AMIGO CLAVE: 'Sensible' = prudente/sensato. Para decir 'sensible', usa 'sensitive'."
  },
  {
    id: "tri-12",
    english: "sensitive",
    portuguese: "sensível / delicado / melindroso",
    spanish: "sensible / delicado / susceptible",
    part_of_speech: "adjective",
    phonetic_en: "/ˈsensətɪv/",
    definition_en: "Easily affected, delicate, emotionally responsive, or requiring confidential care.",
    definition_pt: "Que reage com facilidade; perceptivo ou confidencial.",
    definition_es: "Que tiene facilidad para percibir estímulos o reaccionar emocionalmente.",
    example_en: "The lawyer handled the sensitive diplomatic documents with extreme discretion.",
    example_pt: "O advogado tratou os documentos diplomáticos sensíveis com extrema discrição.",
    example_es: "El abogado manejó los documentos diplomáticos sensibles con extrema discreción.",
    category: "vocabulary",
    notes_for_pt_speakers: "'Sensitive' é o verdadeiro equivalente a 'sensível' em português.",
    notes_for_es_speakers: "'Sensitive' es la traducción exacta de 'sensible' en español."
  }
];

export const englishChallenges: EnglishLearningChallenge[] = [
  {
    id: "chal-01",
    source_lang: "pt",
    source_text: "Na verdade, eu não concordo com essa decisão.",
    target_english: "Actually, I don't agree with that decision.",
    accepted_answers: [
      "Actually, I don't agree with that decision.",
      "Actually, I do not agree with that decision.",
      "In fact, I don't agree with that decision.",
      "As a matter of fact, I don't agree with that decision."
    ],
    options: [
      "Currently, I don't agree with that decision.",
      "Actually, I don't agree with that decision.",
      "Presently, I don't agree with that decision."
    ],
    explanation_pt: "Em inglês, 'na verdade' é 'actually' ou 'in fact'. 'Currently' significa 'atualmente', o que mudaria o sentido.",
    explanation_es: "En inglés, 'de hecho / en realidad' se traduce como 'actually' o 'in fact'.",
    common_transfer_mistake: "Não use 'Currently' para traduzir 'na verdade'.",
    topic: "False Friends (Actually vs Currently)"
  },
  {
    id: "chal-02",
    source_lang: "es",
    source_text: "Tengo muchas ganas de ver los resultados del proyecto.",
    target_english: "I look forward to seeing the project results.",
    accepted_answers: [
      "I look forward to seeing the project results.",
      "I am looking forward to seeing the project results.",
      "I look forward to seeing the results of the project."
    ],
    options: [
      "I look forward to see the project results.",
      "I look forward to seeing the project results.",
      "I wait for to see the project results."
    ],
    explanation_pt: "A expressão 'look forward to' exige o verbo seguinte com terminação -ING: 'seeing'.",
    explanation_es: "El phrasal verb 'look forward to' exige la forma en -ING: 'seeing' (y no el infinitivo 'to see').",
    common_transfer_mistake: "Evite decir 'look forward to see' sin -ing.",
    topic: "Phrasal Verbs (look forward to + -ing)"
  },
  {
    id: "chal-03",
    source_lang: "pt",
    source_text: "O comitê tomou uma decisão muito sensata.",
    target_english: "The committee made a very sensible decision.",
    accepted_answers: [
      "The committee made a very sensible decision.",
      "The committee made a sensible decision.",
      "The committee took a very sensible decision."
    ],
    options: [
      "The committee made a very sensitive decision.",
      "The committee made a very sensible decision.",
      "The committee made a very sentient decision."
    ],
    explanation_pt: "'Sensata' é 'sensible'. 'Sensitive' significaria 'sensível/emotiva', o que altera o sentido pretendido.",
    explanation_es: "'Sensata' es 'sensible'. 'Sensitive' significa 'sensible/delicada'.",
    common_transfer_mistake: "Confundir 'sensible' (sensato) com 'sensitive' (sensível).",
    topic: "False Cognates (Sensible vs Sensitive)"
  },
  {
    id: "chal-04",
    source_lang: "es",
    source_text: "No obstante, la empresa mantuvo su solvencia.",
    target_english: "Nevertheless, the company maintained its solvency.",
    accepted_answers: [
      "Nevertheless, the company maintained its solvency.",
      "Nonetheless, the company maintained its solvency.",
      "However, the company maintained its solvency."
    ],
    options: [
      "Nevertheless, the company maintained its solvency.",
      "Although, the company maintained its solvency.",
      "Unless, the company maintained its solvency."
    ],
    explanation_pt: "'Não obstante' equivale a 'Nevertheless' ou 'Nonetheless' em posição inicial conectiva com vírgula.",
    explanation_es: "'No obstante' equivale a 'Nevertheless' o 'Nonetheless' como conector formal de contraste.",
    common_transfer_mistake: "Usar 'Although' aislado sin subordinada en lugar de 'Nevertheless'.",
    topic: "Connectors & Discourse Markers"
  }
];
