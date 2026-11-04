/**
 * Lexilume — Admin Daily Content Studio Component
 * Pillar 4 of the Administrative Workbench
 * 
 * Features:
 * - Publication of Daily Poetry & Daily Conversations for Portuguese, English and Spanish.
 * - Strict exclusion of Hindi ('hi') with both UI filtering and service validation.
 * - Safe replacement semantics: publishing archives previous active content in that scope.
 * - Dialogue turns builder with move up, move down, remove, and add turn actions.
 * - Country attribution with preloaded fallback countries (flags & ISO codes).
 * - Live preview modal before publishing.
 * - Deterministic cultural draft generator (Zero-Paid AI Mandate).
 */

import React, { useState, useEffect } from 'react';
import {
  Feather,
  MessageSquare,
  Plus,
  Archive,
  CheckCircle2,
  Globe,
  Trash2,
  Sparkles,
  MapPin,
  RefreshCw,
  Eye,
  ArrowUp,
  ArrowDown,
  X,
  Volume2,
} from 'lucide-react';
import { Language, CEFRLevel, DailyPoem, DailyConversation, DialogueLine, DailyContentState } from '../../types';
import { getLanguageName } from '../../lib/languages/languageMatrix';
import { dailyContentService } from '../../services/dailyContentService';
import { adminService } from '../../services/adminService';
import { FALLBACK_COUNTRIES } from '../../services/providers/countries/countryProvider';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useI18n } from '../../i18n/i18nContext';
import { toast } from 'sonner';

export const AdminDailyContentStudio: React.FC = () => {
  const { t } = useI18n();
  const [contentState, setContentState] = useState<DailyContentState>({
    activePoetry: [],
    activeConversations: [],
    archivedPoetry: [],
    archivedConversations: [],
  });
  const [selectedSubTab, setSelectedSubTab] = useState<'poetry' | 'conversation'>('poetry');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // New Poem Form
  const [poemTitle, setPoemTitle] = useState('');
  const [poemAuthor, setPoemAuthor] = useState('');
  const [poemLanguage, setPoemLanguage] = useState<Language>('pt');
  const [poemCefr, setPoemCefr] = useState<CEFRLevel>('B1');
  const [poemExcerpt, setPoemExcerpt] = useState('');
  const [poemFullText, setPoemFullText] = useState('');
  const [poemCulturalContext, setPoemCulturalContext] = useState('');
  const [poemCountryName, setPoemCountryName] = useState('Portugal');
  const [poemCountryCode, setPoemCountryCode] = useState('PT');
  const [poemTranslation, setPoemTranslation] = useState('');

  // New Conversation Form
  const [convoTitle, setConvoTitle] = useState('');
  const [convoScenario, setConvoScenario] = useState('');
  const [convoLanguage, setConvoLanguage] = useState<Language>('pt');
  const [convoCefr, setConvoCefr] = useState<CEFRLevel>('B1');
  const [convoCountryName, setConvoCountryName] = useState('Portugal');
  const [convoCountryCode, setConvoCountryCode] = useState('PT');
  const [convoCulturalContext, setConvoCulturalContext] = useState('');
  const [convoLines, setConvoLines] = useState<DialogueLine[]>([
    { speaker: 'Ana', line: 'Bom dia! Um café expresso e um pastel de nata, por favor.', translation: 'Good morning! An espresso and a custard tart, please.' },
    { speaker: 'Atendente', line: 'Com certeza! Deseja com canela por cima?', translation: 'Certainly! Would you like cinnamon on top?' },
  ]);

  const loadData = async () => {
    const data = await dailyContentService.getAllContent();
    setContentState(data);
  };

  useEffect(() => {
    loadData();
    const unsub = dailyContentService.subscribe(loadData);
    return unsub;
  }, []);

  const handleCountrySelect = (cca2: string, targetType: 'poem' | 'convo') => {
    const c = FALLBACK_COUNTRIES.find(item => item.code === cca2);
    if (!c) return;
    if (targetType === 'poem') {
      setPoemCountryName(c.name);
      setPoemCountryCode(c.code);
    } else {
      setConvoCountryName(c.name);
      setConvoCountryCode(c.code);
    }
  };

  const handlePublishPoem = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!poemTitle.trim() || !poemAuthor.trim() || !poemFullText.trim()) {
      toast.error(t('admin:studio_error_poem_required', 'Fill in title, author and full poem text.'));
      return;
    }
    if ((poemLanguage as string) === 'hi') {
      toast.error(t('admin:studio_error_hindi', 'System invariant: Hindi is strictly excluded.'));
      return;
    }

    try {
      await dailyContentService.publishPoem({
        title: poemTitle,
        author: poemAuthor,
        learning_language: poemLanguage,
        cefr_level: poemCefr,
        excerpt: poemExcerpt.trim() || poemFullText.split('\n')[0] || poemFullText.slice(0, 100),
        full_text: poemFullText,
        cultural_context: poemCulturalContext,
        country_name: poemCountryName || undefined,
        country_code: poemCountryCode || undefined,
        translation: poemTranslation || undefined,
      });

      await adminService.logAdminAction('publish_poem', undefined, {
        title: poemTitle,
        author: poemAuthor,
        language: poemLanguage,
        cefrLevel: poemCefr,
      });

      toast.success(t('admin:studio_poem_published', 'Poem \"{{title}}\" published successfully! Previous version archived.', { title: poemTitle }));
      setIsCreating(false);
      setIsPreviewOpen(false);
      setPoemTitle('');
      setPoemAuthor('');
      setPoemFullText('');
      setPoemExcerpt('');
      setPoemCulturalContext('');
      setPoemTranslation('');
      await loadData();
    } catch {
      toast.error(t('admin:studio_error_publish_poem', 'Error publishing poem.'));
    }
  };

  const handlePublishConversation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!convoTitle.trim() || !convoScenario.trim() || convoLines.length === 0 || !convoLines[0].line.trim()) {
      toast.error(t('admin:studio_error_dialogue_required', 'Fill in title, scenario and at least one dialogue line.'));
      return;
    }
    if ((convoLanguage as string) === 'hi') {
      toast.error(t('admin:studio_error_hindi', 'System invariant: Hindi is strictly excluded.'));
      return;
    }

    try {
      await dailyContentService.publishConversation({
        title: convoTitle,
        scenario: convoScenario,
        learning_language: convoLanguage,
        cefr_level: convoCefr,
        dialogue: convoLines.filter(l => l.line.trim().length > 0),
        cultural_context: convoCulturalContext,
        country_name: convoCountryName || undefined,
        country_code: convoCountryCode || undefined,
      });

      await adminService.logAdminAction('publish_conversation', undefined, {
        title: convoTitle,
        scenario: convoScenario,
        language: convoLanguage,
        cefrLevel: convoCefr,
        turnsCount: convoLines.length,
      });

      toast.success(t('admin:studio_dialogue_published', 'Dialogue \"{{title}}\" published successfully! Previous version archived.', { title: convoTitle }));
      setIsCreating(false);
      setIsPreviewOpen(false);
      setConvoTitle('');
      setConvoScenario('');
      setConvoCulturalContext('');
      setConvoLines([
        { speaker: 'Person A', line: '', translation: '' },
        { speaker: 'Person B', line: '', translation: '' },
      ]);
      await loadData();
    } catch {
      toast.error(t('admin:studio_error_publish_dialogue', 'Error publishing dialogue.'));
    }
  };

  const handleArchivePoem = async (id: string, title: string) => {
    await dailyContentService.archivePoem(id);
    await adminService.logAdminAction('archive_poem', undefined, { id, title });
    toast.info(t('admin:studio_poem_archived', 'Poem \"{{title}}\" was archived.', { title }));
    await loadData();
  };

  const handleArchiveConversation = async (id: string, title: string) => {
    await dailyContentService.archiveConversation(id);
    await adminService.logAdminAction('archive_conversation', undefined, { id, title });
    toast.info(t('admin:studio_dialogue_archived', 'Dialogue \"{{title}}\" was archived.', { title }));
    await loadData();
  };

  // Dialogue lines actions: add, update, remove, move up, move down
  const addConvoLine = () => {
    const nextSpeaker = convoLines.length % 2 === 0 ? 'Person A' : 'Person B';
    setConvoLines([...convoLines, { speaker: nextSpeaker, line: '', translation: '' }]);
  };

  const updateConvoLine = (index: number, field: keyof DialogueLine, value: string) => {
    const next = [...convoLines];
    next[index] = { ...next[index], [field]: value };
    setConvoLines(next);
  };

  const removeConvoLine = (index: number) => {
    if (convoLines.length <= 1) return;
    setConvoLines(convoLines.filter((_, i) => i !== index));
  };

  const moveConvoLine = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === convoLines.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...convoLines];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setConvoLines(next);
  };

  // Deterministic Exemplar Generator (Zero-Paid AI mandate)
  const handleLoadExemplarDraft = () => {
    if (selectedSubTab === 'poetry') {
      if (poemLanguage === 'pt') {
        setPoemTitle('Mar Português');
        setPoemAuthor('Fernando Pessoa');
        setPoemCefr('B2');
        setPoemExcerpt('Ó mar salgado, quanto do teu sal são lágrimas de Portugal!');
        setPoemFullText(`Ó mar salgado, quanto do teu sal\nSão lágrimas de Portugal!\nPor te cruzarmos, quantas mães choraram,\nQuantos filhos em vão rezaram!\nQuantas noivas ficaram por casar\nPara que fosses nosso, ó mar!\n\nValeu a pena? Tudo vale a pena\nSe a alma não é pequena.\nQuem quer passar além do Bojador\nTem que passar além da dor.\nDeus ao mar o perigo e o abismo deu,\nMas nele é que espelhou o céu.`);
        setPoemTranslation('O salty sea, how much of your salt is the tears of Portugal! To cross you, how many mothers wept...');
        setPoemCulturalContext('Poema integrante da obra Mensagem (1934), sintetizando a epopeia marítima e a superação transcendental lusitana.');
        setPoemCountryName('Portugal');
        setPoemCountryCode('PT');
      } else if (poemLanguage === 'es') {
        setPoemTitle('Rima LIII — Volverán las oscuras golondrinas');
        setPoemAuthor('Gustavo Adolfo Bécquer');
        setPoemCefr('B1');
        setPoemExcerpt('Volverán las oscuras golondrinas en tu balcón sus nidos a colgar...');
        setPoemFullText(`Volverán las oscuras golondrinas\nen tu balcón sus nidos a colgar,\ny otra vez con el ala a sus cristales\njugando llamarán.\n\nPero aquellas que el vuelo refrenaban\ntu hermosura y mi dicha a contemplar,\naquellas que aprendieron nuestros nombres,\nesas... ¡no volverán!`);
        setPoemTranslation('The dark swallows will return to hang their nests on your balcony...');
        setPoemCulturalContext('Romantismo tardio espanhol expressando a transitoriedade do afeto e a irreversibilidade do tempo.');
        setPoemCountryName('España');
        setPoemCountryCode('ES');
      } else {
        setPoemTitle('A Red, Red Rose');
        setPoemAuthor('Robert Burns');
        setPoemCefr('A2');
        setPoemExcerpt('O my Luve is like a red, red rose that’s newly sprung in June...');
        setPoemFullText(`O my Luve is like a red, red rose\nThat’s newly sprung in June;\nO my Luve is like the melody\nThat’s sweetly played in tune.`);
        setPoemTranslation('Ó meu amor é como uma rosa vermelha...');
        setPoemCulturalContext('Celebrated lyric poetry expressing enduring devotion and musicality.');
        setPoemCountryName('United Kingdom');
        setPoemCountryCode('GB');
      }
      toast.info(t('admin:studio_draft_loaded', 'Example literary draft loaded into the form!'));
    } else {
      setConvoTitle('Na Padaria Tradicional');
      setConvoScenario('Comprar pão quente e interagir com o atendente matinal');
      setConvoCefr('A2');
      setConvoCulturalContext('Prática comunicativa habitual da rotina de bairros históricos em cidades de língua portuguesa.');
      setConvoCountryName('Portugal');
      setConvoCountryCode('PT');
      setConvoLines([
        { speaker: 'Cliente', line: 'Bom dia! Tem pão alentejano fresco hoje?', translation: 'Good morning! Do you have fresh Alentejo bread today?' },
        { speaker: 'Padeiro', line: 'Bom dia! Sim, saiu do forno há dez minutos. Quantos vai levar?', translation: 'Good morning! Yes, it came out of the oven ten minutes ago. How many will you take?' },
        { speaker: 'Cliente', line: 'Apenas meio quilo, e também dois pastéis de nata bem estaladiços.', translation: 'Just half a kilo, and also two very crispy custard tarts.' },
        { speaker: 'Padeiro', line: 'Com certeza! São três euros e vinte no total.', translation: 'Certainly! That is three euros and twenty in total.' },
      ]);
      toast.info(t('admin:studio_dialogue_draft_loaded', 'Dialogue draft loaded!'));
    }
  };

  // Filter lists
  const filteredActivePoetry = contentState.activePoetry.filter(
    p => filterLang === 'all' || p.learning_language === filterLang
  );
  const filteredArchivedPoetry = contentState.archivedPoetry.filter(
    p => filterLang === 'all' || p.learning_language === filterLang
  );

  const filteredActiveConversations = contentState.activeConversations.filter(
    c => filterLang === 'all' || c.learning_language === filterLang
  );
  const filteredArchivedConversations = contentState.archivedConversations.filter(
    c => filterLang === 'all' || c.learning_language === filterLang
  );

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-500/10 border border-amber-400/20 text-amber-700">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              {t('admin:studio_kicker', 'Daily Content Studio')}
            </span>
            <Badge variant="amber" size="sm">
              {t('admin:studio_safe_badge', 'Safe Replacement Semantics')}
            </Badge>
          </div>
          <h2 className="font-serif text-xl font-bold text-stone-900">
            {t('admin:studio_heading', 'Poetry & Dialogue Management')}
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl">
            {t(
              'admin:studio_desc',
              'Publish or archive literary poems and authentic dialogues for the three supported languages (PT · EN · ES). A newly activated item archives the previous one without deleting records or breaking SRS reviews.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreating(!isCreating)}
            className="cursor-pointer"
          >
            {isCreating
              ? t('admin:studio_close_form', 'Close Form')
              : t('admin:studio_publish', 'Publish New Content')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={loadData}
            className="cursor-pointer"
          >
            {t('admin:studio_update', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Creation Form Drawer */}
      {isCreating && (
        <div className="bg-white border-2 border-rose-500/40 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-700 uppercase">{t('admin:studio_new_content', 'New Daily Content')}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubTab('poetry')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  selectedSubTab === 'poetry'
                    ? 'bg-rose-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {t('admin:studio_tab_poetry', 'Poetry')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSubTab('conversation')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  selectedSubTab === 'conversation'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {t('admin:studio_tab_dialogue', 'Immersive Dialogue')}
              </button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                icon={<Sparkles className="w-3.5 h-3.5 text-amber-700" />}
                onClick={handleLoadExemplarDraft}
                className="cursor-pointer text-amber-700 border-amber-500/30"
              >
                {t('admin:studio_load_draft', 'Load Example Draft')}
              </Button>
            </div>
          </div>

          {selectedSubTab === 'poetry' ? (
            <form onSubmit={handlePublishPoem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-700 font-semibold block">{t('admin:studio_poem_title', 'Poem Title *')}</label>
                  <input
                    type="text"
                    required
                    value={poemTitle}
                    onChange={e => setPoemTitle(e.target.value)}
                    placeholder={t('admin:studio_poem_title_example', 'e.g. Tabacaria')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-700 font-semibold block">{t('admin:studio_author', 'Author *')}</label>
                  <input
                    type="text"
                    required
                    value={poemAuthor}
                    onChange={e => setPoemAuthor(e.target.value)}
                    placeholder={t('admin:studio_author_example', 'e.g. Álvaro de Campos')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-stone-700 font-semibold block">{t('admin:studio_language', 'Language *')}</label>
                    <select
                      value={poemLanguage}
                      onChange={e => setPoemLanguage(e.target.value as Language)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                    >
                      {(['pt', 'es', 'en'] as const).map(lang => (
                        <option key={lang} value={lang}>
                          {lang.toUpperCase()} — {getLanguageName(lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-700 font-semibold block">{t('admin:studio_cefr', 'CEFR Level *')}</label>
                    <select
                      value={poemCefr}
                      onChange={e => setPoemCefr(e.target.value as CEFRLevel)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Country Selection Linked to FALLBACK_COUNTRIES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-700 font-semibold block">{t('admin:studio_country', 'Cultural Attribution Country')}</label>
                  <select
                    value={poemCountryCode}
                    onChange={e => handleCountrySelect(e.target.value, 'poem')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                  >
                    {FALLBACK_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flagEmoji} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-stone-700 font-semibold block">{t('admin:studio_excerpt_label', 'Card Excerpt (summary)')}</label>
                  <input
                    type="text"
                    value={poemExcerpt}
                    onChange={e => setPoemExcerpt(e.target.value)}
                    placeholder={t('admin:studio_poem_excerpt_placeholder', 'Opening verses or a memorable line...')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-stone-700 font-semibold block">{t('admin:studio_poem_full', 'Full Poem Text (lines and stanzas) *')}</label>
                <textarea
                  required
                  rows={6}
                  value={poemFullText}
                  onChange={e => setPoemFullText(e.target.value)}
                  placeholder={t('admin:studio_full_text_placeholder', 'Enter the full verses...')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800 font-serif leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-700 font-semibold block">{t('admin:studio_translation', 'Pedagogical Translation')}</label>
                <textarea
                  rows={3}
                  value={poemTranslation}
                  onChange={e => setPoemTranslation(e.target.value)}
                  placeholder={t('admin:studio_translation_placeholder', 'Literal/pedagogical support translation...')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-stone-700 font-semibold block">{t('admin:studio_cultural_context', 'Cultural & Pedagogical Context')}</label>
                <textarea
                  rows={2}
                  value={poemCulturalContext}
                  onChange={e => setPoemCulturalContext(e.target.value)}
                  placeholder={t('admin:studio_cultural_context_placeholder', 'Historical commentary, aesthetic movement and relevant vocabulary...')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 text-stone-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreating(false)}>
                  {t('admin:studio_cancel', 'Cancel')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setIsPreviewOpen(true)}
                  className="cursor-pointer"
                >
                  {t('admin:studio_preview', 'Preview Before Publishing')}
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-rose-600 hover:bg-rose-500 cursor-pointer">
                  {t('admin:studio_publish_poem', 'Publish Active Poem')}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePublishConversation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-700 font-semibold block">{t('admin:studio_dialogue_title', 'Dialogue Title *')}</label>
                  <input
                    type="text"
                    required
                    value={convoTitle}
                    onChange={e => setConvoTitle(e.target.value)}
                    placeholder={t('admin:studio_dialogue_title_example', 'e.g. At Ribeira Market')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-700 font-semibold block">{t('admin:studio_scenario', 'Scenario / Situation *')}</label>
                  <input
                    type="text"
                    required
                    value={convoScenario}
                    onChange={e => setConvoScenario(e.target.value)}
                    placeholder={t('admin:studio_scenario_example', 'e.g. Ordering and asking the price of typical fruit')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-stone-700 font-semibold block">{t('admin:studio_language', 'Language *')}</label>
                    <select
                      value={convoLanguage}
                      onChange={e => setConvoLanguage(e.target.value as Language)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                    >
                      {(['pt', 'es', 'en'] as const).map(lang => (
                        <option key={lang} value={lang}>
                          {lang.toUpperCase()} — {getLanguageName(lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-stone-700 font-semibold block">{t('admin:studio_cefr', 'CEFR Level *')}</label>
                    <select
                      value={convoCefr}
                      onChange={e => setConvoCefr(e.target.value as CEFRLevel)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                    >
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="C1">C1</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Country Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-stone-700 font-semibold block">{t('admin:studio_country', 'Cultural Attribution Country')}</label>
                  <select
                    value={convoCountryCode}
                    onChange={e => handleCountrySelect(e.target.value, 'convo')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                  >
                    {FALLBACK_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flagEmoji} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-stone-700 font-semibold block">{t('admin:studio_pragmatic_context', 'Pragmatic Context')}</label>
                  <input
                    type="text"
                    value={convoCulturalContext}
                    onChange={e => setConvoCulturalContext(e.target.value)}
                    placeholder={t('admin:studio_pragmatic_context_placeholder', 'Politeness norms and colloquial register...')}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800"
                  />
                </div>
              </div>

              {/* Dialogue Turns Builder with Reordering */}
              <div className="space-y-2 border-t border-stone-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-800 text-xs">
                    {t('admin:studio_dialogue_lines', 'Dialogue Lines ({{count}}) — Reorder or add new', { count: convoLines.length })}
                  </span>
                  <button
                    type="button"
                    onClick={addConvoLine}
                    className="text-xs text-emerald-700 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t('admin:studio_add_line', 'Add Line')}
                  </button>
                </div>

                <div className="space-y-2.5">
                  {convoLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-stone-50/60 rounded-xl border border-stone-200/80 flex items-start gap-2"
                    >
                      <div className="flex flex-col gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => moveConvoLine(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-stone-500 hover:text-stone-800 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveConvoLine(idx, 'down')}
                          disabled={idx === convoLines.length - 1}
                          className="p-1 text-stone-500 hover:text-stone-800 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                        <div className="sm:col-span-1">
                          <label className="text-[10px] text-stone-500 block mb-0.5">{t('admin:studio_speaker', 'Speaker')}</label>
                          <input
                            type="text"
                            value={line.speaker}
                            onChange={e => updateConvoLine(idx, 'speaker', e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-stone-800"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-stone-500 block mb-0.5">{t('admin:studio_target_line', 'Line in Target Language')}</label>
                          <input
                            type="text"
                            value={line.line}
                            onChange={e => updateConvoLine(idx, 'line', e.target.value)}
                            placeholder={t('admin:studio_line_placeholder', 'Sentence...')}
                            className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-stone-800"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="text-[10px] text-stone-500 block mb-0.5">{t('admin:studio_translation_short', 'Translation')}</label>
                          <input
                            type="text"
                            value={line.translation || ''}
                            onChange={e => updateConvoLine(idx, 'translation', e.target.value)}
                            placeholder={t('admin:studio_translation_placeholder_short', 'Meaning...')}
                            className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-stone-800"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeConvoLine(idx)}
                        disabled={convoLines.length <= 1}
                        className="p-1.5 text-stone-500 hover:text-rose-700 disabled:opacity-20 cursor-pointer mt-3"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreating(false)}>
                  {t('admin:studio_cancel', 'Cancel')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setIsPreviewOpen(true)}
                  className="cursor-pointer"
                >
                  {t('admin:studio_preview', 'Preview Before Publishing')}
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer">
                  {t('admin:studio_publish_dialogue', 'Publish Active Dialogue')}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Filter Language Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 font-semibold">
            {t('admin:studio_language_filter', 'Language Filter:')}
          </span>
          <select
            value={filterLang}
            onChange={e => setFilterLang(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1 text-xs text-stone-800"
          >
            <option value="all">{t('admin:studio_all_languages', 'All Languages')}</option>
            {(['pt', 'es', 'en'] as const).map(lang => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()} — {getLanguageName(lang)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-500">
          <span>{t('admin:studio_total_active', 'Total Active:')}</span>
          <Badge variant="rose" size="sm">
            {filteredActivePoetry.length} {t('admin:studio_poems_active', 'Active Poems')}
          </Badge>
          <Badge variant="emerald" size="sm">
            {filteredActiveConversations.length} {t('admin:studio_dialogues_active', 'Active Dialogues')}
          </Badge>
        </div>
      </div>

      {/* Active Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Poetry Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <Feather className="w-4 h-4 text-rose-700" />
              {t('admin:studio_poems_active', 'Active Poems')} ({filteredActivePoetry.length})
            </h3>
            <span className="text-[10px] text-stone-500 uppercase">
              {t('admin:studio_visible_dashboard', 'Visible on Dashboard')}
            </span>
          </div>

          {filteredActivePoetry.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center text-xs text-stone-500">
              {t('admin:studio_empty_poems', 'No active poem for this language.')}
            </div>
          ) : (
            filteredActivePoetry.map(poem => (
              <div
                key={poem.id}
                className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2 hover:border-stone-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{poem.title}</span>
                      <Badge variant="indigo" size="sm">{poem.learning_language.toUpperCase()}</Badge>
                      <Badge variant="emerald" size="sm">{poem.cefr_level}</Badge>
                      {poem.country_name && (
                        <span className="text-[10px] text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-700" /> {poem.country_name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-rose-700 font-serif italic mt-0.5">
                      por {poem.author}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Archive className="w-3.5 h-3.5" />}
                    onClick={() => handleArchivePoem(poem.id, poem.title)}
                    className="text-stone-500 hover:text-amber-700 cursor-pointer"
                  >
                    {t('admin:studio_archive', 'Archive')}
                  </Button>
                </div>

                <div className="text-xs text-stone-700 font-serif line-clamp-3 italic bg-stone-50/40 p-2.5 rounded-xl border border-stone-200/60 leading-relaxed whitespace-pre-line">
                  {poem.full_text || poem.excerpt}
                </div>

                {poem.cultural_context && (
                  <div className="text-[11px] text-stone-500 leading-normal">
                    {poem.cultural_context}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Active Conversations Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              {t('admin:studio_dialogues_active', 'Active Dialogues')} ({filteredActiveConversations.length})
            </h3>
            <span className="text-[10px] text-stone-500 uppercase">
              {t('admin:studio_visible_dashboard', 'Visible on Dashboard')}
            </span>
          </div>

          {filteredActiveConversations.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 text-center text-xs text-stone-500">
              {t('admin:studio_empty_dialogues', 'No active dialogue for this language.')}
            </div>
          ) : (
            filteredActiveConversations.map(convo => (
              <div
                key={convo.id}
                className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2 hover:border-stone-300 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-sm">{convo.title}</span>
                      <Badge variant="indigo" size="sm">{convo.learning_language.toUpperCase()}</Badge>
                      <Badge variant="emerald" size="sm">{convo.cefr_level}</Badge>
                      {convo.country_name && (
                        <span className="text-[10px] text-stone-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-700" /> {convo.country_name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {t('admin:studio_scenario_label', 'Scenario:')} {convo.scenario}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Archive className="w-3.5 h-3.5" />}
                    onClick={() => handleArchiveConversation(convo.id, convo.title)}
                    className="text-stone-500 hover:text-amber-700 cursor-pointer"
                  >
                    {t('admin:studio_archive', 'Archive')}
                  </Button>
                </div>

                <div className="space-y-1.5 bg-stone-50/40 p-2.5 rounded-xl border border-stone-200/60 text-xs">
                  {convo.dialogue.slice(0, 3).map((line, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="font-bold text-emerald-700">{line.speaker}:</span>
                      <span className="text-stone-800">{line.line}</span>
                    </div>
                  ))}
                  {convo.dialogue.length > 3 && (
                    <div className="text-[10px] text-stone-500 font-semibold">
                      + {convo.dialogue.length - 3} falas adicionais...
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/30 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-700 border border-rose-500/20">
                  <Eye className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  {t('admin:studio_student_preview', 'Student Preview (Dashboard View)')}
                </span>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSubTab === 'poetry' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">{poemTitle || t('admin:studio_poem_title_placeholder', 'Poem Title')}</h3>
                    <p className="text-xs text-rose-700 font-serif italic">{poemAuthor || t('admin:studio_author_placeholder', 'Author')}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="indigo" size="sm">{poemLanguage.toUpperCase()}</Badge>
                    <Badge variant="emerald" size="sm">{poemCefr}</Badge>
                    {poemCountryName && (
                      <Badge variant="slate" size="sm">
                        <MapPin className="w-3 h-3 text-rose-700 mr-1" /> {poemCountryName}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-stone-50/80 rounded-2xl border border-stone-200 text-xs sm:text-sm font-serif text-stone-800 leading-relaxed whitespace-pre-line text-center">
                  {poemFullText || t('admin:studio_poem_text_placeholder', 'Full poem verses...')}
                </div>

                {poemTranslation && (
                  <div className="p-3 bg-stone-50/40 rounded-xl border border-stone-200/60 text-xs text-stone-500">
                    <span className="font-semibold text-stone-700 block mb-1">{t('admin:studio_translation_label', 'Translation:')}</span>
                    {poemTranslation}
                  </div>
                )}

                {poemCulturalContext && (
                  <div className="p-3 bg-rose-50/20 rounded-xl border border-rose-900/40 text-xs text-stone-700">
                    <span className="font-semibold text-rose-700 block mb-1">{t('admin:studio_cultural_context_label', 'Cultural Context:')}</span>
                    {poemCulturalContext}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">{convoTitle || t('admin:studio_dialogue_title_placeholder', 'Dialogue Title')}</h3>
                    <p className="text-xs text-stone-500">{convoScenario || t('admin:studio_scenario_placeholder', 'Scenario')}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="indigo" size="sm">{convoLanguage.toUpperCase()}</Badge>
                    <Badge variant="emerald" size="sm">{convoCefr}</Badge>
                    {convoCountryName && (
                      <Badge variant="slate" size="sm">
                        <MapPin className="w-3 h-3 text-emerald-700 mr-1" /> {convoCountryName}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 p-4 bg-stone-50/80 rounded-2xl border border-stone-200">
                  {convoLines.map((line, idx) => (
                    <div key={idx} className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700">{line.speaker}:</span>
                        <span className="text-stone-900">{line.line}</span>
                      </div>
                      {line.translation && (
                        <div className="text-[11px] text-stone-500 pl-4 italic">
                          {line.translation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {convoCulturalContext && (
                  <div className="p-3 bg-emerald-50/20 rounded-xl border border-emerald-900/40 text-xs text-stone-700">
                    <span className="font-semibold text-emerald-700 block mb-1">{t('admin:studio_pragmatic_context', 'Pragmatic Context')}:</span>
                    {convoCulturalContext}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
                Voltar à Edição
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={selectedSubTab === 'poetry' ? () => handlePublishPoem() : () => handlePublishConversation()}
                className="bg-rose-600 hover:bg-rose-500 cursor-pointer"
              >
                {t('admin:studio_confirm_publish', 'Confirm & Publish Now')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
