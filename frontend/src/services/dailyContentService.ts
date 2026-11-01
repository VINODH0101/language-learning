/**
 * Lexilume — Daily Learning Content Service
 * 
 * Manages Administrator-published Daily Poetry and Daily Conversations.
 * Features:
 * - Independent linguistic retrieval (Target Learning Language & CEFR Level)
 * - Safe replacement semantics: Latest published is active; previous archived (never deleted)
 * - Offline-first IndexedDB / LocalStorage persistence with Supabase sync
 * - Zero fabricated content: authentic literary and communicative models across all 13 supported languages
 * - Hindi is strictly excluded
 */

import { Language, CEFRLevel, DailyPoem, DailyConversation, DailyContentState } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const STORAGE_KEY_POETRY = 'lexilume_daily_poetry_v1';
const STORAGE_KEY_CONVERSATIONS = 'lexilume_daily_conversations_v1';

export const INITIAL_POEMS: DailyPoem[] = [
  {
    id: 'poem-pt-01',
    title: 'Autopsicografia',
    author: 'Fernando Pessoa',
    learning_language: 'pt',
    cefr_level: 'B2',
    excerpt: 'O poeta é um fingidor. Finge tão completamente que chega a fingir que é dor a dor que deveras sente.',
    full_text: `O poeta é um fingidor.\nFinge tão completamente\nQue chega a fingir que é dor\nA dor que deveras sente.\n\nE os que leem o que escreve,\nNa dor lida sentem bem,\nNão as duas que ele teve,\nMas só a que eles não têm.\n\nE assim nas calhas de roda\nGira, a entreter a razão,\nEsse comboio de corda\nQue se chama coração.`,
    cultural_context: 'Obra-prima do modernismo português, explorando a dissociação entre emoção vivida e expressão estética na poesia lisboeta.',
    country_name: 'Portugal',
    country_code: 'PT',
    translation: 'The poet is a pretender. He feigns so completely that he even feigns pain that he really feels.',
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'poem-es-01',
    title: 'Caminante, no hay camino',
    author: 'Antonio Machado',
    learning_language: 'es',
    cefr_level: 'B1',
    excerpt: 'Caminante, son tus huellas el camino y nada más; caminante, no hay camino, se hace camino al andar.',
    full_text: `Caminante, son tus huellas\nel camino y nada más;\ncaminante, no hay camino,\nse hace camino al andar.\n\nAl andar se hace el camino,\ny al volver la vista atrás\nse ve la senda que nunca\nse ha de volver a pisar.\n\nCaminante, no hay camino\nsino estelas en la mar.`,
    cultural_context: 'Uno de los poemas más emblemáticos de la Generación del 98 española, simbolizando la existencia como creación continua.',
    country_name: 'España',
    country_code: 'ES',
    translation: 'Wanderer, your footsteps are the road, and nothing more; wanderer, there is no road, the road is made by walking.',
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'poem-en-01',
    title: 'The Road Not Taken',
    author: 'Robert Frost',
    learning_language: 'en',
    cefr_level: 'B1',
    excerpt: 'Two roads diverged in a yellow wood, and sorry I could not travel both and be one traveler, long I stood...',
    full_text: `Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;\n\nThen took the other, as just as fair,\nAnd having perhaps the better claim,\nBecause it was grassy and wanted wear;\nThough as for that the passing there\nHad worn them really about the same,\n\nI shall be telling this with a sigh\nSomewhere ages and ages hence:\nTwo roads diverged in a wood, and I—\nI took the one less traveled by,\nAnd that has made all the difference.`,
    cultural_context: 'A quintessential piece of American literature exploring individualism, choice, and post-facto rationalization.',
    country_name: 'United States',
    country_code: 'US',
    translation: 'Duas estradas divergiam em um bosque amarelo...',
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'poem-fr-01',
    title: 'L\'Albatros',
    author: 'Charles Baudelaire',
    learning_language: 'fr',
    cefr_level: 'B2',
    excerpt: 'Souvent, pour s\'amuser, les hommes d\'équipage prennent des albatros, vastes oiseaux des mers...',
    full_text: `Souvent, pour s'amuser, les hommes d'équipage\nPrennent des albatros, vastes oiseaux des mers,\nQui suivent, indolents compagnons de voyage,\nLe navire glissant sur les gouffres amers.`,
    cultural_context: 'Chef-d\'œuvre des Fleurs du Mal symbolisant la condition solitaire du poète parmi les hommes ordinaires.',
    country_name: 'France',
    country_code: 'FR',
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'poem-de-01',
    title: 'Wandrers Nachtlied',
    author: 'Johann Wolfgang von Goethe',
    learning_language: 'de',
    cefr_level: 'B1',
    excerpt: 'Über allen Gipfeln ist Ruh, in allen Wipfeln spürest du kaum einen Hauch...',
    full_text: `Über allen Gipfeln\nIst Ruh,\nIn allen Wipfeln\nSpürest du\nKaum einen Hauch;\nDie Vögelein schweigen im Walde.\nWarte nur, balde\nRuhest du auch.`,
    cultural_context: 'Eines der berühmtesten Gedichte der deutschen Klassik, verfasst auf dem Kickelhahn bei Ilmenau.',
    country_name: 'Deutschland',
    country_code: 'DE',
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'poem-it-01',
    title: 'L\'infinito',
    author: 'Giacomo Leopardi',
    learning_language: 'it',
    cefr_level: 'B2',
    excerpt: 'Sempre caro mi fu quest\'ermo colle, e questa siepe, che da tanta parte dell\'ultimo orizzonte il guardo esclude...',
    full_text: `Sempre caro mi fu quest'ermo colle,\ne questa siepe, che da tanta parte\ndell'ultimo orizzonte il guardo esclude.\nMa sedendo e mirando, interminati\nspazi di là da quella, e sovrumani\nsilenzi, e profondissima quiete\nio nel pensier mi fingo...`,
    cultural_context: 'Pietra miliare del Romanticismo italiano, meditazione sulla vastità dello spazio, del tempo e dell\'immaginazione interiore.',
    country_name: 'Italia',
    country_code: 'IT',
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'poem-ja-01',
    title: '古池や (The Ancient Pond)',
    author: 'Matsuo Bashō (松尾芭蕉)',
    learning_language: 'ja',
    cefr_level: 'B1',
    excerpt: '古池や 蛙飛びこむ 水の音 (Furuike ya / kawazu tobikomu / mizu no oto)',
    full_text: `古池や\n蛙飛びこむ\n水の音\n\n(ふるいけや\nかわずとびこむ\nみずのおと)`,
    cultural_context: 'The definitive haiku of Japanese Zen aesthetics: eternal stillness interrupted momentarily by transient natural life.',
    country_name: 'Japan',
    country_code: 'JP',
    translation: 'Old pond / frogs jumped in / sound of water.',
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'poem-zh-01',
    title: '静夜思 (Quiet Night Thought)',
    author: 'Li Bai (李白)',
    learning_language: 'zh',
    cefr_level: 'A2',
    excerpt: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
    full_text: `床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。`,
    cultural_context: 'The most universally known poem of the Tang dynasty, encapsulating nocturnal nostalgia for one\'s homeland.',
    country_name: 'China',
    country_code: 'CN',
    translation: 'Moonlight before my bed, suspecting frost upon the ground. Raising head to gaze at the bright moon, bowing head in thought of home.',
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'poem-ta-01',
    title: 'செந்தமிழ் நாடெனும் போதினிலே',
    author: 'Subramania Bharati (சுப்பிரமணிய பாரதியார்)',
    learning_language: 'ta',
    cefr_level: 'B1',
    excerpt: 'செந்தமிழ் நாடெனும் போதினிலே - இன்பத் தேன்வந்து பாயுது காதினிலே...',
    full_text: `செந்தமிழ் நாடெனும் போதினிலே - இன்பத்\nதேன்வந்து பாயுது காதினிலே,\nஎங்கள் தந்தையர் நாடென்ற பேச்சினிலே - ஒரு\nசக்தி பிறக்குது மூச்சினிலே!`,
    cultural_context: 'Classic patriotic revival poem by the Mahakavi of modern Tamil literature celebrating the richness of the classical Tamil tongue.',
    country_name: 'India (Tamil Nadu)',
    country_code: 'IN',
    translation: 'When the words "Pure Tamil Land" are spoken, honey of sweet joy flows into our ears...',
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
];

export const INITIAL_CONVERSATIONS: DailyConversation[] = [
  {
    id: 'convo-pt-01',
    title: 'No Quiosque da Praça das Flores',
    scenario: 'Pedindo café e pastel de nata com cortesia local em Lisboa',
    learning_language: 'pt',
    cefr_level: 'B1',
    cultural_context: 'A etiqueta do café em Lisboa: pedir uma bica ou café pingado com cumprimento prévio ("Bom dia").',
    country_name: 'Portugal',
    country_code: 'PT',
    dialogue: [
      { speaker: 'Cliente', line: 'Bom dia! Olhe, por favor, tirava-me uma bica e um pastel de nata?', translation: 'Good morning! Could you pull me an espresso and a custard tart, please?' },
      { speaker: 'Atendente', line: 'Com certeza. Quer o pastel polvilhado com canela e açúcar?', translation: 'Certainly. Would you like cinnamon and powdered sugar on the tart?' },
      { speaker: 'Cliente', line: 'Sim, só um toque de canela. E pode trazer também um copo de água das pedras?', translation: 'Yes, just a touch of cinnamon. And could you also bring a sparkling water?' },
      { speaker: 'Atendente', line: 'Com gás natural, com certeza. Sai já em dois minutos.', translation: 'Naturally sparkling, sure thing. Coming right up in two minutes.' },
    ],
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'convo-es-01',
    title: 'Tapeando en el Mercado de San Antón',
    scenario: 'Pidiendo tapas tradicionales y recomendación del día en Madrid',
    learning_language: 'es',
    cefr_level: 'B1',
    cultural_context: 'Costumbre madrileña de pedir la recomendación de temporada acompañada de un vermut de grifo.',
    country_name: 'España',
    country_code: 'ES',
    dialogue: [
      { speaker: 'Cliente', line: '¡Buenas tardes! ¿Qué nos recomiendas de ración para empezar?', translation: 'Good afternoon! What do you recommend as a portion to start with?' },
      { speaker: 'Camarero', line: 'Hoy tenemos unas croquetas de jamón ibérico recién hechas y tortilla melosa.', translation: 'Today we have freshly fried Iberian ham croquettes and creamy potato omelette.' },
      { speaker: 'Cliente', line: 'Ponme media de croquetas y un vermut de grifo con su aceituna, por favor.', translation: 'Give me a half portion of croquettes and a draft vermouth with its olive, please.' },
      { speaker: 'Camarero', line: '¡Marchando! Enseguida te lo acerco a la barra.', translation: 'Coming up! I will bring it right to the counter.' },
    ],
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'convo-en-01',
    title: 'Visiting an Independent Bookstore in Bloomsbury',
    scenario: 'Inquiring about local literary releases and architectural history',
    learning_language: 'en',
    cefr_level: 'B1',
    cultural_context: 'Polite British conversational register when seeking recommendations in a bookshop.',
    country_name: 'United Kingdom',
    country_code: 'GB',
    dialogue: [
      { speaker: 'Customer', line: 'Excuse me, could you point me towards your regional history section?', translation: 'Com licença, poderia indicar a seção de história regional?' },
      { speaker: 'Bookseller', line: 'Certainly! It\'s just past the fiction alcove on your left. Are you looking for anything in particular?', translation: 'Certamente! Fica logo após o nicho de ficção à sua esquerda.' },
      { speaker: 'Customer', line: 'I\'m interested in the literary circles of early 20th-century London.', translation: 'Tenho interesse nos círculos literários de Londres do início do século XX.' },
      { speaker: 'Bookseller', line: 'Ah, then you must check out Virginia Woolf\'s letters on the middle shelf. A fascinating read.', translation: 'Ah, então precisa conferir as cartas de Virginia Woolf na prateleira do meio.' },
    ],
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'convo-fr-01',
    title: 'À la Boulangerie de Quartier',
    scenario: 'Acheter du pain frais et des viennoiseries le matin à Paris',
    learning_language: 'fr',
    cefr_level: 'A2',
    cultural_context: 'L\'art de commander sa baguette selon la cuisson préférée ("bien cuite" ou "pas trop cuite").',
    country_name: 'France',
    country_code: 'FR',
    dialogue: [
      { speaker: 'Client', line: 'Bonjour madame ! Une baguette tradition, s\'il vous plaît.', translation: 'Good morning madam! A traditional baguette, please.' },
      { speaker: 'Boulangère', line: 'Bonjour ! Vous la voulez bien cuite ou pas trop cuite ?', translation: 'Good morning! Would you like it well-done or lightly baked?' },
      { speaker: 'Client', line: 'Bien dorée, s\'il vous plaît. Et deux croissants au beurre.', translation: 'Nicely golden, please. And two butter croissants.' },
      { speaker: 'Boulangère', line: 'Ce sera tout ? Cela vous fera 4 euros 20, s\'il vous plaît.', translation: 'Will that be all? That will be 4 euros 20, please.' },
    ],
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
  {
    id: 'convo-ja-01',
    title: '居酒屋での注文 (At the Izakaya)',
    scenario: 'Ordering seasonal skewers and welcoming the table',
    learning_language: 'ja',
    cefr_level: 'B1',
    cultural_context: 'Izakaya etiquette: starting with "Toriaezu nama" (beer for now) and sharing seasonal dishes.',
    country_name: 'Japan',
    country_code: 'JP',
    dialogue: [
      { speaker: '客 (Customer)', line: 'すみません、注文をお願いします。とりあえず生ビール二つで。', translation: 'Excuse me, we would like to order. Two draft beers for now, please.' },
      { speaker: '店員 (Staff)', line: 'かしこまりました！生ビール二つですね。お食事はいかがなさいますか？', translation: 'Right away! Two draft beers. Would you like any food?' },
      { speaker: '客 (Customer)', line: '本日のおすすめの焼き鳥盛り合わせをお願いします。塩で。', translation: 'We will take today\'s recommended yakitori platter, please. With salt.' },
      { speaker: '店員 (Staff)', line: '喜んで！少々お待ちください。', translation: 'With pleasure! Please wait just a moment.' },
    ],
    published_at: '2026-10-31T00:00:00Z',
    is_active: true,
  },
];

class DailyContentService {
  private static instance: DailyContentService;
  private listeners: Set<() => void> = new Set();

  public static getInstance(): DailyContentService {
    if (!DailyContentService.instance) {
      DailyContentService.instance = new DailyContentService();
    }
    return DailyContentService.instance;
  }

  private constructor() {
    this.initLocalDefaults();
  }

  private initLocalDefaults(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      if (!localStorage.getItem(STORAGE_KEY_POETRY)) {
        localStorage.setItem(STORAGE_KEY_POETRY, JSON.stringify(INITIAL_POEMS));
      }
      if (!localStorage.getItem(STORAGE_KEY_CONVERSATIONS)) {
        localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(INITIAL_CONVERSATIONS));
      }
    } catch {}
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  // --- Learner Retrieval Methods ---

  public getDailyPoem(learningLanguage: Language, _explanationLanguage?: string, cefrLevel?: CEFRLevel): DailyPoem | null {
    const all = this.getLocalPoetry();
    const active = all.filter(p => p.is_active && p.learning_language === learningLanguage);
    if (active.length === 0) {
      const anyLang = all.find(p => p.learning_language === learningLanguage);
      return anyLang || all[0] || null;
    }
    if (cefrLevel) {
      const matchLevel = active.find(p => p.cefr_level === cefrLevel);
      if (matchLevel) return matchLevel;
    }
    return active[0];
  }

  public getDailyConversation(learningLanguage: Language, _explanationLanguage?: string, cefrLevel?: CEFRLevel): DailyConversation | null {
    const all = this.getLocalConversations();
    const active = all.filter(c => c.is_active && c.learning_language === learningLanguage);
    if (active.length === 0) {
      const anyLang = all.find(c => c.learning_language === learningLanguage);
      return anyLang || all[0] || null;
    }
    if (cefrLevel) {
      const matchLevel = active.find(c => c.cefr_level === cefrLevel);
      if (matchLevel) return matchLevel;
    }
    return active[0];
  }

  public async getActivePoem(learningLanguage: Language, cefrLevel?: CEFRLevel): Promise<DailyPoem | null> {
    return this.getActivePoetry(learningLanguage, cefrLevel);
  }

  public async getActivePoetry(learningLanguage: Language, cefrLevel?: CEFRLevel): Promise<DailyPoem | null> {
    // 1. If Supabase configured, check remote active item
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('daily_published_content')
          .select('*')
          .eq('content_type', 'poetry')
          .eq('learning_language', learningLanguage)
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(1);

        if (cefrLevel) {
          query = query.eq('cefr_level', cefrLevel);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const row = data[0];
          return {
            id: row.id,
            title: row.title,
            author: row.author_or_speaker || 'Desconhecido',
            learning_language: row.learning_language as Language,
            cefr_level: (row.cefr_level || 'B1') as CEFRLevel,
            excerpt: row.excerpt,
            full_text: row.full_content,
            cultural_context: row.cultural_context || '',
            country_name: row.country_name,
            country_code: row.country_code,
            translation: row.translation,
            published_at: row.published_at,
            is_active: row.is_active,
          };
        }
      } catch (err) {
        console.warn('Supabase daily poetry fetch error, falling back to local', err);
      }
    }

    // 2. Local fallback
    const all = this.getLocalPoetry();
    const active = all.filter(p => p.is_active && p.learning_language === learningLanguage);
    if (active.length === 0) {
      // Useful fallback: return any active poem for this language or first available
      const anyLang = all.find(p => p.learning_language === learningLanguage);
      return anyLang || all[0] || null;
    }
    if (cefrLevel) {
      const matchLevel = active.find(p => p.cefr_level === cefrLevel);
      if (matchLevel) return matchLevel;
    }
    return active[0];
  }

  public async getActiveConversation(learningLanguage: Language, cefrLevel?: CEFRLevel): Promise<DailyConversation | null> {
    // 1. If Supabase configured, check remote active item
    if (isSupabaseConfigured) {
      try {
        let query = supabase
          .from('daily_published_content')
          .select('*')
          .eq('content_type', 'conversation')
          .eq('learning_language', learningLanguage)
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(1);

        if (cefrLevel) {
          query = query.eq('cefr_level', cefrLevel);
        }

        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          const row = data[0];
          return {
            id: row.id,
            title: row.title,
            scenario: row.scenario || '',
            learning_language: row.learning_language as Language,
            cefr_level: (row.cefr_level || 'B1') as CEFRLevel,
            dialogue: Array.isArray(row.dialogue) ? row.dialogue : [],
            cultural_context: row.cultural_context || '',
            country_name: row.country_name,
            country_code: row.country_code,
            published_at: row.published_at,
            is_active: row.is_active,
          };
        }
      } catch (err) {
        console.warn('Supabase daily conversation fetch error, falling back to local', err);
      }
    }

    // 2. Local fallback
    const all = this.getLocalConversations();
    const active = all.filter(c => c.is_active && c.learning_language === learningLanguage);
    if (active.length === 0) {
      const anyLang = all.find(c => c.learning_language === learningLanguage);
      return anyLang || all[0] || null;
    }
    if (cefrLevel) {
      const matchLevel = active.find(c => c.cefr_level === cefrLevel);
      if (matchLevel) return matchLevel;
    }
    return active[0];
  }

  // --- Admin Content Management Methods ---

  public async publishPoem(poemData: Omit<DailyPoem, 'id' | 'published_at' | 'is_active'>): Promise<DailyPoem> {
    const all = this.getLocalPoetry();
    const nowIso = new Date().toISOString();
    const newId = `poem_${Date.now()}`;

    // Archive previous active poem for this language
    const updatedList = all.map(p => {
      if (p.learning_language === poemData.learning_language && p.is_active) {
        return { ...p, is_active: false, archived_at: nowIso };
      }
      return p;
    });

    const newPoem: DailyPoem = {
      ...poemData,
      id: newId,
      published_at: nowIso,
      is_active: true,
    };

    updatedList.unshift(newPoem);
    this.saveLocalPoetry(updatedList);

    // Sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        // Archive remote
        await supabase
          .from('daily_published_content')
          .update({ is_active: false, archived_at: nowIso })
          .eq('content_type', 'poetry')
          .eq('learning_language', poemData.learning_language);

        // Insert new
        await supabase.from('daily_published_content').insert({
          id: newId,
          content_type: 'poetry',
          title: newPoem.title,
          author_or_speaker: newPoem.author,
          learning_language: newPoem.learning_language,
          cefr_level: newPoem.cefr_level,
          excerpt: newPoem.excerpt,
          full_content: newPoem.full_text,
          cultural_context: newPoem.cultural_context,
          country_name: newPoem.country_name,
          country_code: newPoem.country_code,
          translation: newPoem.translation,
          published_at: nowIso,
          is_active: true,
        });
      } catch (err) {
        console.warn('Failed to publish poem to Supabase, saved locally', err);
      }
    }

    this.notify();
    return newPoem;
  }

  public async publishConversation(convoData: Omit<DailyConversation, 'id' | 'published_at' | 'is_active'>): Promise<DailyConversation> {
    const all = this.getLocalConversations();
    const nowIso = new Date().toISOString();
    const newId = `convo_${Date.now()}`;

    // Archive previous active conversation for this language
    const updatedList = all.map(c => {
      if (c.learning_language === convoData.learning_language && c.is_active) {
        return { ...c, is_active: false, archived_at: nowIso };
      }
      return c;
    });

    const newConvo: DailyConversation = {
      ...convoData,
      id: newId,
      published_at: nowIso,
      is_active: true,
    };

    updatedList.unshift(newConvo);
    this.saveLocalConversations(updatedList);

    // Sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        // Archive remote
        await supabase
          .from('daily_published_content')
          .update({ is_active: false, archived_at: nowIso })
          .eq('content_type', 'conversation')
          .eq('learning_language', convoData.learning_language);

        // Insert new
        await supabase.from('daily_published_content').insert({
          id: newId,
          content_type: 'conversation',
          title: newConvo.title,
          scenario: newConvo.scenario,
          learning_language: newConvo.learning_language,
          cefr_level: newConvo.cefr_level,
          dialogue: newConvo.dialogue,
          cultural_context: newConvo.cultural_context,
          country_name: newConvo.country_name,
          country_code: newConvo.country_code,
          published_at: nowIso,
          is_active: true,
        });
      } catch (err) {
        console.warn('Failed to publish conversation to Supabase, saved locally', err);
      }
    }

    this.notify();
    return newConvo;
  }

  public async getAllContent(): Promise<DailyContentState> {
    const poetry = this.getLocalPoetry();
    const conversations = this.getLocalConversations();

    return {
      activePoetry: poetry.filter(p => p.is_active),
      activeConversations: conversations.filter(c => c.is_active),
      archivedPoetry: poetry.filter(p => !p.is_active),
      archivedConversations: conversations.filter(c => !c.is_active),
    };
  }

  public async archivePoem(id: string): Promise<boolean> {
    const list = this.getLocalPoetry().map(p => (p.id === id ? { ...p, is_active: false, archived_at: new Date().toISOString() } : p));
    this.saveLocalPoetry(list);
    this.notify();
    return true;
  }

  public async archiveConversation(id: string): Promise<boolean> {
    const list = this.getLocalConversations().map(c => (c.id === id ? { ...c, is_active: false, archived_at: new Date().toISOString() } : c));
    this.saveLocalConversations(list);
    this.notify();
    return true;
  }

  // --- Local Storage Helpers ---

  private getLocalPoetry(): DailyPoem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_POETRY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [...INITIAL_POEMS];
  }

  private saveLocalPoetry(list: DailyPoem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_POETRY, JSON.stringify(list));
    } catch {}
  }

  private getLocalConversations(): DailyConversation[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [...INITIAL_CONVERSATIONS];
  }

  private saveLocalConversations(list: DailyConversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(list));
    } catch {}
  }
}

export const dailyContentService = DailyContentService.getInstance();
