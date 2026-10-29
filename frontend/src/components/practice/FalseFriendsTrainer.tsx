import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { FalseFriendItem, Language } from '../../types';
import { falseFriends } from '../../data/seedData';
import { AudioButton } from '../common/AudioButton';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { logMistake } from '../../services/localDb';

interface FalseFriendsTrainerProps {
  language: Language;
}

export const FalseFriendsTrainer: React.FC<FalseFriendsTrainerProps> = ({ language }) => {
  const [activeTab, setActiveTab] = useState<'drill' | 'dictionary'>('drill');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const currentItem = falseFriends[currentIdx % falseFriends.length];

  // Generate 4 randomized options for the current question
  // Question asks what the word means in the other language
  const isTargetPt = language === 'pt';
  const targetTerm = isTargetPt ? currentItem.spanish_term : currentItem.portuguese_term;
  const targetMeaning = isTargetPt ? currentItem.es_meaning_en : currentItem.pt_meaning_en;
  const falseMeaning = isTargetPt ? currentItem.pt_meaning_en : currentItem.es_meaning_en;

  const options = [
    targetMeaning,
    falseMeaning,
    'a formal legal greeting',
    'a seasonal agricultural fruit',
  ].sort((a, b) => a.localeCompare(b));

  const handleSelect = (opt: string) => {
    if (isAnswered) return;
    setSelectedAnswer(opt);
    setIsAnswered(true);

    const isCorrect = opt === targetMeaning;
    if (isCorrect) {
      setScore(prev => prev + 1);
    } else {
      // Record error slip into local mistake notebook
      logMistake({
        user_id: 'learner',
        language,
        error_category: 'false_friend',
        prompt: `Qual o significado real de "${targetTerm}" (${isTargetPt ? 'ES' : 'PT'})?`,
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
    setCurrentIdx(prev => (prev + 1) % falseFriends.length);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Laboratório de Falsos Amigos (PT ⇄ ES)
              </span>
              <Badge variant="amber" size="sm">
                Interferência Crítica
              </Badge>
            </div>
            <h2 className="text-lg font-bold text-slate-100">
              Desarmando Armadilhas Léxicas
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
              Quiz Interativo
            </button>
            <button
              onClick={() => setActiveTab('dictionary')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                activeTab === 'dictionary'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80 border border-slate-700'
              }`}
            >
              Guia Completo ({falseFriends.length})
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          Devido à proximidade genética entre o português e o espanhol, falsos amigos provocam os erros mais graves de compreensão e registro em níveis C1. Pratique a identificação instantânea.
        </p>
      </div>

      {activeTab === 'drill' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs text-slate-400 font-mono">
              Questão {currentIdx + 1} de {falseFriends.length} • Pontuação: {score}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
              CEFR {currentItem.cefr_level}
            </span>
          </div>

          {/* Question Prompt */}
          <div className="text-center py-4 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Atenção à Armadilha de Tradução
            </span>
            <div className="flex items-center justify-center gap-3">
              <h3 className="text-2xl font-extrabold text-amber-400">
                "{targetTerm}"
              </h3>
              <AudioButton
                text={targetTerm}
                language={isTargetPt ? 'es' : 'pt'}
                variety="all"
              />
            </div>
            <p className="text-sm text-slate-200">
              Em {isTargetPt ? 'espanhol' : 'português'}, qual é o significado real deste termo?
            </p>
          </div>

          {/* Options Grid */}
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

          {/* Feedback & Warning Banner */}
          {isAnswered && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-300">
                  Aviso de Interferência Linguística:
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentItem.interference_warning}
              </p>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400 font-serif">
                <div>
                  <span className="font-semibold text-slate-300 block font-sans">Exemplo PT:</span>
                  <p>"{currentItem.pt_example}"</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-300 block font-sans">Exemplo ES:</span>
                  <p>"{currentItem.es_example}"</p>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700"
                  icon={<ArrowRight className="w-4 h-4" />}
                  onClick={handleNext}
                >
                  Próxima Questão
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Dictionary of False Friends */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {falseFriends.map(ff => (
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
                  <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">Sentido PT:</span>
                  <p className="text-emerald-100">{ff.pt_meaning_en}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-900/30">
                  <span className="text-[10px] font-bold text-amber-400 block mb-0.5">Sentido ES:</span>
                  <p className="text-amber-100">{ff.es_meaning_en}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300">
                <span className="text-amber-400 font-semibold block mb-1">⚠️ Cuidado:</span>
                <p className="leading-relaxed">{ff.interference_warning}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
