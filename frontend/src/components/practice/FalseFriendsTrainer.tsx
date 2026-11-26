import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { FalseFriendItem, Language } from '../../types';
import { AudioButton } from '../common/AudioButton';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { logMistake } from '../../services/localDb';
import { StorageService } from '../../services/storage';
import { contentAccess } from '../../services/contentAccess';
import { useI18n } from '../../i18n/i18nContext';

interface FalseFriendsTrainerProps {
  language: Language;
  items?: FalseFriendItem[];
}

export const FalseFriendsTrainer: React.FC<FalseFriendsTrainerProps> = ({ language, items }) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'drill' | 'dictionary'>('drill');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dynamicItems, setDynamicItems] = useState<FalseFriendItem[]>(items || []);

  const loadLiveFalseFriends = useCallback(async () => {
    if (items) {
      setDynamicItems(items);
      return;
    }
    setLoading(true);
    try {
      const [ptVocab, esVocab] = await Promise.all([
        contentAccess.getPublishedVocabularyEntries('pt', 'en').catch(() => []),
        contentAccess.getPublishedVocabularyEntries('es', 'en').catch(() => []),
      ]);
      const combined: FalseFriendItem[] = [];
      for (const v of [...ptVocab, ...esVocab]) {
        if (!v.grammar_notes && !v.collocations?.length) continue;
        combined.push({
          id: `ff-${v.id}`,
          portuguese_term: v.target_language === 'pt' ? v.lemma : v.translations.pt || v.lemma,
          spanish_term: v.target_language === 'es' ? v.lemma : v.translations.es || v.lemma,
          pt_meaning_en: v.definitions.pt || v.definitions.en || '',
          es_meaning_en: v.definitions.es || v.definitions.en || '',
          interference_warning: v.grammar_notes || v.definitions.en || '',
          pt_example: v.target_language === 'pt' ? v.example_sentence_target : v.example_sentence_translations.pt || '',
          es_example: v.target_language === 'es' ? v.example_sentence_target : v.example_sentence_translations.es || '',
          cefr_level: v.cefr_level,
          attribution: v.attribution,
        });
      }
      setDynamicItems(combined);
    } finally {
      setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    loadLiveFalseFriends();
  }, [loadLiveFalseFriends]);

  if (dynamicItems.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-3 shadow-sm">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">
          {t('practice:false_friends_empty_title', 'No False-Cognate Drills Published Yet')}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {t(
            'practice:false_friends_empty_desc',
            'Generate and publish comparative vocabulary or false-cognate entries via the AI Content Engine to unlock interactive drills.'
          )}
        </p>
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={loadLiveFalseFriends}
          className="cursor-pointer"
        >
          {t('common:retry', 'Retry')}
        </Button>
      </div>
    );
  }

  const currentItem = dynamicItems[currentIdx % dynamicItems.length];
  const isTargetPt = language === 'pt';
  const targetTerm = isTargetPt ? currentItem.spanish_term : currentItem.portuguese_term;
  const targetMeaning = isTargetPt ? currentItem.es_meaning_en : currentItem.pt_meaning_en;
  const falseMeaning = isTargetPt ? currentItem.pt_meaning_en : currentItem.es_meaning_en;

  const options = Array.from(
    new Set([targetMeaning, falseMeaning].filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const handleSelect = (opt: string) => {
    if (isAnswered) return;
    setSelectedAnswer(opt);
    setIsAnswered(true);

    const isCorrect = opt === targetMeaning;
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      logMistake({
        user_id: StorageService.getCurrentUser(),
        language,
        error_category: 'false_friend',
        prompt: `${targetTerm} (${isTargetPt ? 'ES' : 'PT'})`,
        context_passage: currentItem.interference_warning,
        user_answer: opt,
        correct_answer: targetMeaning,
        explanation: currentItem.interference_warning,
      });
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setCurrentIdx(prev => (prev + 1) % dynamicItems.length);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                {t('practice:false_friends_badge', 'False Cognates Lab (PT ⇄ ES)')}
              </span>
              <Badge variant="amber" size="sm">
                {t('practice:critical_interference', 'Lexical Contrast')}
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              {t('practice:false_friends_title', 'Cross-Linguistic False Friends')}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('drill')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'drill'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              {t('practice:quiz_tab', 'Quiz')}
            </button>
            <button
              onClick={() => setActiveTab('dictionary')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'dictionary'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              {t('practice:guide_tab', 'Guide')} ({dynamicItems.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'drill' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs text-slate-400 font-mono">
              {currentIdx + 1} / {dynamicItems.length} • {score}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
              CEFR {currentItem.cefr_level}
            </span>
          </div>

          <div className="text-center py-4 space-y-2">
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-2xl font-extrabold text-amber-400">"{targetTerm}"</h3>
              <AudioButton text={targetTerm} language={isTargetPt ? 'es' : 'pt'} variety="all" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {options.map((opt, idx) => {
              const isSelected = selectedAnswer === opt;
              const isCorrectOpt = opt === targetMeaning;

              let btnClass = 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700';
              if (isAnswered) {
                if (isCorrectOpt) {
                  btnClass = 'bg-emerald-950/80 border-emerald-600 text-emerald-200 font-bold';
                } else if (isSelected) {
                  btnClass = 'bg-rose-950/80 border-rose-600 text-rose-200 line-through';
                } else {
                  btnClass = 'bg-slate-900 border-slate-800 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(opt)}
                  disabled={isAnswered}
                  className={`p-3.5 rounded-xl border text-sm text-left transition-all cursor-pointer flex items-center justify-between ${btnClass}`}
                >
                  <span>{opt}</span>
                  {isAnswered && isCorrectOpt && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-2" />
                  )}
                  {isAnswered && isSelected && !isCorrectOpt && (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 animate-fadeIn">
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentItem.interference_warning}
              </p>
              <div className="pt-3 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleNext}
                >
                  {t('common:next', 'Next')}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dynamicItems.map(ff => (
            <div
              key={ff.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 font-mono">PT</span>
                  <span className="font-bold text-slate-100">{ff.portuguese_term}</span>
                  <AudioButton text={ff.portuguese_term} language="pt" variety="all" />
                </div>
                <span className="text-slate-600">⇄</span>
                <div className="flex items-center gap-2">
                  <AudioButton text={ff.spanish_term} language="es" variety="all" />
                  <span className="font-bold text-slate-100">{ff.spanish_term}</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">ES</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
                  <p className="text-emerald-100">{ff.pt_meaning_en}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30">
                  <p className="text-amber-100">{ff.es_meaning_en}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                <p className="leading-relaxed">{ff.interference_warning}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
