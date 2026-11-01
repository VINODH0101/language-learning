/**
 * Lexilume — Admin Daily Content Studio Component
 * Pillar 4 of the Administrative Workbench
 * 
 * Features:
 * - Publication of Daily Poetry & Daily Conversations across all 13 supported languages.
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
import { SUPPORTED_LEARNING_LANGUAGES, getLanguageName } from '../../lib/languages/languageMatrix';
import { dailyContentService } from '../../services/dailyContentService';
import { adminService } from '../../services/adminService';
import { FALLBACK_COUNTRIES } from '../../services/providers/countries/countryProvider';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { toast } from 'sonner';

export const AdminDailyContentStudio: React.FC = () => {
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
      toast.error('Preencha título, autor e texto completo do poema.');
      return;
    }
    if ((poemLanguage as string) === 'hi') {
      toast.error('Invariante do Sistema: O idioma Hindi está expressamente excluído.');
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

      toast.success(`Poema "${poemTitle}" publicado com sucesso! Versão anterior arquivada.`);
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
      toast.error('Erro ao publicar poema.');
    }
  };

  const handlePublishConversation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!convoTitle.trim() || !convoScenario.trim() || convoLines.length === 0 || !convoLines[0].line.trim()) {
      toast.error('Preencha título, cenário e pelo menos uma fala de diálogo.');
      return;
    }
    if ((convoLanguage as string) === 'hi') {
      toast.error('Invariante do Sistema: O idioma Hindi está expressamente excluído.');
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

      toast.success(`Diálogo "${convoTitle}" publicado com sucesso! Versão anterior arquivada.`);
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
      toast.error('Erro ao publicar diálogo.');
    }
  };

  const handleArchivePoem = async (id: string, title: string) => {
    await dailyContentService.archivePoem(id);
    await adminService.logAdminAction('archive_poem', undefined, { id, title });
    toast.info(`Poema "${title}" foi arquivado.`);
    await loadData();
  };

  const handleArchiveConversation = async (id: string, title: string) => {
    await dailyContentService.archiveConversation(id);
    await adminService.logAdminAction('archive_conversation', undefined, { id, title });
    toast.info(`Diálogo "${title}" foi arquivado.`);
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
      toast.info('Rascunho literário exemplar carregado no formulário!');
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
      toast.info('Rascunho de diálogo comunicativo carregado!');
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Estúdio de Conteúdo Diário
            </span>
            <Badge variant="rose" size="sm">
              Semântica Segura de Substituição
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Gestão de Poesia & Diálogos do Dia</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Publique ou arquive obras-primas literárias e diálogos autênticos nos 13 idiomas suportados. O novo item ativo arquiva o anterior sem apagar registros ou quebrar revisões SRS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreating(!isCreating)}
            className="bg-rose-600 hover:bg-rose-500 cursor-pointer"
          >
            {isCreating ? 'Fechar Formulário' : 'Publicar Novo Conteúdo'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={loadData}
            className="cursor-pointer"
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Creation Form Drawer */}
      {isCreating && (
        <div className="bg-slate-900 border-2 border-rose-500/40 rounded-2xl p-6 shadow-lg space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-400 uppercase">Novo Conteúdo Diário</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubTab('poetry')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  selectedSubTab === 'poetry'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Poesia Literária
              </button>
              <button
                type="button"
                onClick={() => setSelectedSubTab('conversation')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition ${
                  selectedSubTab === 'conversation'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Diálogo Imersivo
              </button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                icon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                onClick={handleLoadExemplarDraft}
                className="cursor-pointer text-amber-300 border-amber-500/30"
              >
                Preencher Rascunho Exemplar
              </Button>
            </div>
          </div>

          {selectedSubTab === 'poetry' ? (
            <form onSubmit={handlePublishPoem} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Título do Poema *</label>
                  <input
                    type="text"
                    required
                    value={poemTitle}
                    onChange={e => setPoemTitle(e.target.value)}
                    placeholder="Ex: Tabacaria"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Autor *</label>
                  <input
                    type="text"
                    required
                    value={poemAuthor}
                    onChange={e => setPoemAuthor(e.target.value)}
                    placeholder="Ex: Álvaro de Campos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Idioma *</label>
                    <select
                      value={poemLanguage}
                      onChange={e => setPoemLanguage(e.target.value as Language)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    >
                      {SUPPORTED_LEARNING_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>
                          {lang.toUpperCase()} — {getLanguageName(lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Nível CEFR *</label>
                    <select
                      value={poemCefr}
                      onChange={e => setPoemCefr(e.target.value as CEFRLevel)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
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
                  <label className="text-slate-300 font-semibold block">País de Atribuição Cultural</label>
                  <select
                    value={poemCountryCode}
                    onChange={e => handleCountrySelect(e.target.value, 'poem')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {FALLBACK_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flagEmoji} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Excerto para o Card (resumo)</label>
                  <input
                    type="text"
                    value={poemExcerpt}
                    onChange={e => setPoemExcerpt(e.target.value)}
                    placeholder="Primeiros versos ou linha marcante..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Texto Completo do Poema (linhas e estrofes) *</label>
                <textarea
                  required
                  rows={6}
                  value={poemFullText}
                  onChange={e => setPoemFullText(e.target.value)}
                  placeholder="Insira os versos completos..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-serif leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Tradução Pedagógica</label>
                <textarea
                  rows={3}
                  value={poemTranslation}
                  onChange={e => setPoemTranslation(e.target.value)}
                  placeholder="Tradução literal/pedagógica de auxílio..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Contexto Cultural & Pedagógico</label>
                <textarea
                  rows={2}
                  value={poemCulturalContext}
                  onChange={e => setPoemCulturalContext(e.target.value)}
                  placeholder="Comentário histórico, movimento estético e vocabulário relevante..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setIsPreviewOpen(true)}
                  className="cursor-pointer"
                >
                  Visualizar Antes de Publicar
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-rose-600 hover:bg-rose-500 cursor-pointer">
                  Publicar Poema Ativo
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handlePublishConversation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Título do Diálogo *</label>
                  <input
                    type="text"
                    required
                    value={convoTitle}
                    onChange={e => setConvoTitle(e.target.value)}
                    placeholder="Ex: No Mercado da Ribeira"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Cenário / Situação *</label>
                  <input
                    type="text"
                    required
                    value={convoScenario}
                    onChange={e => setConvoScenario(e.target.value)}
                    placeholder="Ex: Fazer pedidos e perguntar o preço de frutas típicas"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Idioma *</label>
                    <select
                      value={convoLanguage}
                      onChange={e => setConvoLanguage(e.target.value as Language)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                    >
                      {SUPPORTED_LEARNING_LANGUAGES.map(lang => (
                        <option key={lang} value={lang}>
                          {lang.toUpperCase()} — {getLanguageName(lang)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-300 font-semibold block">Nível CEFR *</label>
                    <select
                      value={convoCefr}
                      onChange={e => setConvoCefr(e.target.value as CEFRLevel)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
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
                  <label className="text-slate-300 font-semibold block">País de Atribuição Cultural</label>
                  <select
                    value={convoCountryCode}
                    onChange={e => handleCountrySelect(e.target.value, 'convo')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {FALLBACK_COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.flagEmoji} {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">Contexto Pragmático</label>
                  <input
                    type="text"
                    value={convoCulturalContext}
                    onChange={e => setConvoCulturalContext(e.target.value)}
                    placeholder="Normas de cortesia e registro coloquial..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              {/* Dialogue Turns Builder with Reordering */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">
                    Falas do Diálogo ({convoLines.length}) — Reordene ou adicione novas
                  </span>
                  <button
                    type="button"
                    onClick={addConvoLine}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Fala
                  </button>
                </div>

                <div className="space-y-2.5">
                  {convoLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2"
                    >
                      <div className="flex flex-col gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => moveConvoLine(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveConvoLine(idx, 'down')}
                          disabled={idx === convoLines.length - 1}
                          className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1">
                        <div className="sm:col-span-1">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Falante</label>
                          <input
                            type="text"
                            value={line.speaker}
                            onChange={e => updateConvoLine(idx, 'speaker', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Fala no Idioma Alvo</label>
                          <input
                            type="text"
                            value={line.line}
                            onChange={e => updateConvoLine(idx, 'line', e.target.value)}
                            placeholder="Frase..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <label className="text-[10px] text-slate-400 block mb-0.5">Tradução</label>
                          <input
                            type="text"
                            value={line.translation || ''}
                            onChange={e => updateConvoLine(idx, 'translation', e.target.value)}
                            placeholder="Significado..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeConvoLine(idx)}
                        disabled={convoLines.length <= 1}
                        className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-20 cursor-pointer mt-3"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  icon={<Eye className="w-3.5 h-3.5" />}
                  onClick={() => setIsPreviewOpen(true)}
                  className="cursor-pointer"
                >
                  Visualizar Antes de Publicar
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer">
                  Publicar Diálogo Ativo
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Filter Language Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Filtrar Idioma:</span>
          <select
            value={filterLang}
            onChange={e => setFilterLang(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200"
          >
            <option value="all">Todos os 13 Idiomas</option>
            {SUPPORTED_LEARNING_LANGUAGES.map(lang => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()} — {getLanguageName(lang)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Total Ativos:</span>
          <Badge variant="rose" size="sm">
            {filteredActivePoetry.length} Poemas
          </Badge>
          <Badge variant="emerald" size="sm">
            {filteredActiveConversations.length} Diálogos
          </Badge>
        </div>
      </div>

      {/* Active Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Poetry Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Feather className="w-4 h-4 text-rose-400" />
              Poemas Ativos ({filteredActivePoetry.length})
            </h3>
            <span className="text-[10px] text-slate-500 uppercase">Visível no Dashboard</span>
          </div>

          {filteredActivePoetry.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
              Nenhum poema ativo para este idioma.
            </div>
          ) : (
            filteredActivePoetry.map(poem => (
              <div
                key={poem.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{poem.title}</span>
                      <Badge variant="indigo" size="sm">{poem.learning_language.toUpperCase()}</Badge>
                      <Badge variant="emerald" size="sm">{poem.cefr_level}</Badge>
                      {poem.country_name && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-400" /> {poem.country_name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-rose-400 font-serif italic mt-0.5">
                      por {poem.author}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Archive className="w-3.5 h-3.5" />}
                    onClick={() => handleArchivePoem(poem.id, poem.title)}
                    className="text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    Arquivar
                  </Button>
                </div>

                <div className="text-xs text-slate-300 font-serif line-clamp-3 italic bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed whitespace-pre-line">
                  {poem.full_text || poem.excerpt}
                </div>

                {poem.cultural_context && (
                  <div className="text-[11px] text-slate-400 leading-normal">
                    {poem.cultural_context}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Active Conversations Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              Diálogos Ativos ({filteredActiveConversations.length})
            </h3>
            <span className="text-[10px] text-slate-500 uppercase">Visível no Dashboard</span>
          </div>

          {filteredActiveConversations.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
              Nenhum diálogo ativo para este idioma.
            </div>
          ) : (
            filteredActiveConversations.map(convo => (
              <div
                key={convo.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 text-sm">{convo.title}</span>
                      <Badge variant="indigo" size="sm">{convo.learning_language.toUpperCase()}</Badge>
                      <Badge variant="emerald" size="sm">{convo.cefr_level}</Badge>
                      {convo.country_name && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" /> {convo.country_name}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Cenário: {convo.scenario}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Archive className="w-3.5 h-3.5" />}
                    onClick={() => handleArchiveConversation(convo.id, convo.title)}
                    className="text-slate-400 hover:text-amber-400 cursor-pointer"
                  >
                    Arquivar
                  </Button>
                </div>

                <div className="space-y-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 text-xs">
                  {convo.dialogue.slice(0, 3).map((line, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="font-bold text-emerald-400">{line.speaker}:</span>
                      <span className="text-slate-200">{line.line}</span>
                    </div>
                  ))}
                  {convo.dialogue.length > 3 && (
                    <div className="text-[10px] text-slate-500 font-semibold">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Eye className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Prévia para o Aluno (Visão do Dashboard)
                </span>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSubTab === 'poetry' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{poemTitle || 'Título do Poema'}</h3>
                    <p className="text-xs text-rose-400 font-serif italic">{poemAuthor || 'Autor'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="indigo" size="sm">{poemLanguage.toUpperCase()}</Badge>
                    <Badge variant="emerald" size="sm">{poemCefr}</Badge>
                    {poemCountryName && (
                      <Badge variant="slate" size="sm">
                        <MapPin className="w-3 h-3 text-rose-400 mr-1" /> {poemCountryName}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs sm:text-sm font-serif text-slate-200 leading-relaxed whitespace-pre-line text-center">
                  {poemFullText || 'Versos completos do poema...'}
                </div>

                {poemTranslation && (
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 block mb-1">Tradução:</span>
                    {poemTranslation}
                  </div>
                )}

                {poemCulturalContext && (
                  <div className="p-3 bg-rose-950/20 rounded-xl border border-rose-900/40 text-xs text-slate-300">
                    <span className="font-semibold text-rose-400 block mb-1">Contexto Cultural:</span>
                    {poemCulturalContext}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{convoTitle || 'Título do Diálogo'}</h3>
                    <p className="text-xs text-slate-400">{convoScenario || 'Cenário'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="indigo" size="sm">{convoLanguage.toUpperCase()}</Badge>
                    <Badge variant="emerald" size="sm">{convoCefr}</Badge>
                    {convoCountryName && (
                      <Badge variant="slate" size="sm">
                        <MapPin className="w-3 h-3 text-emerald-400 mr-1" /> {convoCountryName}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                  {convoLines.map((line, idx) => (
                    <div key={idx} className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">{line.speaker}:</span>
                        <span className="text-slate-100">{line.line}</span>
                      </div>
                      {line.translation && (
                        <div className="text-[11px] text-slate-500 pl-4 italic">
                          {line.translation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {convoCulturalContext && (
                  <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-900/40 text-xs text-slate-300">
                    <span className="font-semibold text-emerald-400 block mb-1">Contexto Pragmático:</span>
                    {convoCulturalContext}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
                Voltar à Edição
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={selectedSubTab === 'poetry' ? () => handlePublishPoem() : () => handlePublishConversation()}
                className="bg-rose-600 hover:bg-rose-500 cursor-pointer"
              >
                Confirmar & Publicar Agora
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
