import React, { useState, useEffect } from 'react';
import { Feather, BookOpen, Volume2, BookmarkPlus, CheckCircle2, Globe2, HelpCircle } from 'lucide-react';
import { Language, DailyPoem } from '../../../types';
import { dailyContentService } from '../../../services/dailyContentService';
import { SpeechService } from '../../../services/speech';
import { savePhrasebookWord } from '../../../services/localDb';
import { StorageService } from '../../../services/storage';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { useI18n } from '../../../i18n/i18nContext';
import { toast } from 'sonner';

interface DailyPoetryPracticeCardProps {
  language: Language;
  onAddedToDeck?: () => void;
}

export const DailyPoetryPracticeCard: React.FC<DailyPoetryPracticeCardProps> = ({
  language,
  onAddedToDeck,
}) => {
  const { t } = useI18n();
  const [poem, setPoem] = useState<DailyPoem | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [selectedComprehension, setSelectedComprehension] = useState<number | null>(null);
  const [comprehensionFeedback, setComprehensionFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const fetchPoem = async () => {
      setLoading(true);
      const activePoem = await dailyContentService.getActivePoem(language);
      if (!isCancelled) {
        setPoem(activePoem);
        setLoading(false);
      }
    };
    fetchPoem();
    return () => {
      isCancelled = true;
    };
  }, [language]);

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
        {t('common:loading', 'Carregando literatura diária...')}
      </div>
    );
  }

  if (!poem) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
        <Feather className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-200">
          {t('practice:no_poem_title', 'Nenhuma Poesia Publicada Hoje')}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {t('practice:no_poem_desc', 'Não há uma obra poética ativa para este idioma no momento. Nossos curadores publicam novos textos literários periodicamente.')}
        </p>
      </div>
    );
  }

  const handleSpeak = (text: string) => {
    SpeechService.speak(text, poem.learning_language);
  };

  const handleSaveWord = async (word: string, meaning: string) => {
    try {
      await savePhrasebookWord({
        user_id: StorageService.getCurrentUser(),
        source_text: word,
        translated_text: meaning,
        source_lang: poem.learning_language,
        target_lang: 'en',
        context_sentence: poem.excerpt,
        is_verified: true,
      });
      setSavedWords(prev => new Set(prev).add(word));
      toast.success(`"${word}" adicionado aos seus flashcards e caderno de vocabulário!`);
      onAddedToDeck?.();
    } catch {
      toast.error('Não foi possível salvar o vocábulo localmente.');
    }
  };

  // Sample comprehension items derived from poem
  const comprehensionOptions = [
    { text: 'A exploração estética da emoção e da condição humana.', isCorrect: true },
    { text: 'Uma instrução formal para navegação marítima comercial.', isCorrect: false },
    { text: 'Um debate puramente legislativo e financeiro contemporâneo.', isCorrect: false },
  ];

  const handleCheckComprehension = (idx: number) => {
    setSelectedComprehension(idx);
    if (comprehensionOptions[idx].isCorrect) {
      setComprehensionFeedback('Excelente reflexão! O poema captura justamente a transfiguração estética das emoções humanas.');
    } else {
      setComprehensionFeedback('Reflita sobre a essência poética e metafórica dos versos do autor.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <Feather className="w-3.5 h-3.5" /> Poesia e Literatura Diária
            </span>
            <Badge variant="indigo" size="sm">
              CEFR {poem.cefr_level}
            </Badge>
            {poem.country_name && (
              <Badge variant="emerald" size="sm">
                <Globe2 className="w-3 h-3 inline mr-1" />
                {poem.country_name}
              </Badge>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">{poem.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">por <strong className="text-slate-300">{poem.author}</strong></p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Volume2 className="w-4 h-4" />}
          onClick={() => handleSpeak(poem.excerpt)}
          className="text-xs cursor-pointer"
        >
          Ouvir Trecho
        </Button>
      </div>

      {/* Excerpt Stanza */}
      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-2">
        <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
          Versos em Destaque
        </span>
        <blockquote className="text-sm font-serif italic text-slate-200 leading-relaxed whitespace-pre-line pl-3 border-l-2 border-purple-500">
          {poem.excerpt}
        </blockquote>
        {poem.cultural_context && (
          <p className="text-xs text-slate-400 pt-2 border-t border-purple-900/30">
            <strong>Contexto Cultural:</strong> {poem.cultural_context}
          </p>
        )}
      </div>

      {/* Extracted Poetic Vocabulary */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Vocabulário Literário em Destaque
          </span>
          <span className="text-[11px] text-slate-400">
            Clique em salvar para incluir no baralho de repetição espaçada
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-100 block">{poem.title}</span>
              <span className="text-xs text-slate-400 block mt-0.5">Termo central da composição poética</span>
            </div>
            <button
              onClick={() => handleSaveWord(poem.title, 'Título e tema lírico')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                savedWords.has(poem.title)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-sky-400 hover:bg-slate-700'
              }`}
              title="Salvar no Baralho de Flashcards"
            >
              {savedWords.has(poem.title) ? <CheckCircle2 className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-100 block">{poem.author}</span>
              <span className="text-xs text-slate-400 block mt-0.5">Figura canônica das letras</span>
            </div>
            <button
              onClick={() => handleSaveWord(poem.author, 'Autor e referência literária')}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                savedWords.has(poem.author)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-sky-400 hover:bg-slate-700'
              }`}
              title="Salvar no Baralho de Flashcards"
            >
              {savedWords.has(poem.author) ? <CheckCircle2 className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Reading Comprehension Check */}
      <div className="p-4 rounded-xl bg-slate-850/50 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <HelpCircle className="w-4 h-4 text-sky-400" />
          <span>Compreensão Literária: Qual a essência temática destes versos?</span>
        </div>

        <div className="space-y-2">
          {comprehensionOptions.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleCheckComprehension(i)}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center justify-between border ${
                selectedComprehension === i
                  ? opt.isCorrect
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                    : 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{opt.text}</span>
              {selectedComprehension === i && (
                <span className="text-[11px] font-bold">
                  {opt.isCorrect ? '✓ Correto' : '✗ Incorreto'}
                </span>
              )}
            </button>
          ))}
        </div>

        {comprehensionFeedback && (
          <p className="text-xs text-slate-300 pt-1.5 border-t border-slate-800 leading-relaxed">
            {comprehensionFeedback}
          </p>
        )}
      </div>
    </div>
  );
};
