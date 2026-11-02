import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Sparkles,
  Volume2,
  Calendar,
  Layers,
  CheckCircle2,
  RotateCcw,
  Search,
  Filter,
  Brain,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { UserSavedWord } from '../types/contentCentred';
import { Language } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { contentCentredService } from '../services/contentCentredService';
import { authService } from '../services/auth';
import { SpeechService } from '../services/speech';
import { toast } from 'sonner';

export const MyWordsPage: React.FC = () => {
  const [words, setWords] = useState<UserSavedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetLangFilter, setTargetLangFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Flashcard Review Mode
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const loadWords = async () => {
    setLoading(true);
    try {
      const auth = authService.getState();
      const userId = auth.user?.id || 'guest_user';
      const all = await contentCentredService.getUserSavedWords(userId);
      setWords(all);
    } catch (e) {
      console.warn('Error loading saved words:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const dueWords = words.filter(w => w.next_review <= todayStr);

  const filteredWords = words.filter(w => {
    if (targetLangFilter !== 'all' && w.target_language !== targetLangFilter) return false;
    if (searchQuery.trim() && !w.term.toLowerCase().includes(searchQuery.toLowerCase()) && !w.lemma.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handlePlayAudio = async (e: React.MouseEvent, text: string, lang: Language) => {
    e.stopPropagation();
    try {
      await SpeechService.speak(text, lang);
    } catch (err) {
      console.warn('Audio error:', err);
    }
  };

  const handleRateReview = async (rating: number) => {
    const currentWord = dueWords[reviewIdx];
    if (!currentWord) return;

    try {
      const auth = authService.getState();
      const userId = auth.user?.id || 'guest_user';
      await contentCentredService.recordWordReview(userId, currentWord.id, rating);

      setIsFlipped(false);
      if (reviewIdx + 1 < dueWords.length) {
        setReviewIdx(prev => prev + 1);
      } else {
        setIsReviewMode(false);
        toast.success('Completed all due flashcard reviews for today!');
        await loadWords();
      }
    } catch (err: any) {
      toast.error('Error recording review');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Personal Lexicon & Spaced Repetition</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            My Words
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Words and expressions saved while reading authentic texts, scheduled for optimal long-term memory retention with the SuperMemo SM-2 algorithm.
          </p>
        </div>

        {dueWords.length > 0 && !isReviewMode && (
          <Button
            variant="primary"
            size="md"
            icon={<Brain className="w-4 h-4" />}
            onClick={() => {
              setReviewIdx(0);
              setIsFlipped(false);
              setIsReviewMode(true);
            }}
          >
            Review {dueWords.length} Due Cards
          </Button>
        )}
      </div>

      {/* Review Mode Interactive Flashcard */}
      {isReviewMode && dueWords.length > 0 && (
        <div className="max-w-xl mx-auto bg-slate-900 border border-indigo-500/40 rounded-3xl p-8 shadow-2xl space-y-6 text-center animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Card {reviewIdx + 1} of {dueWords.length}
            </span>
            <button
              onClick={() => setIsReviewMode(false)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Exit Review
            </button>
          </div>

          <div
            onClick={() => setIsFlipped(prev => !prev)}
            className="cursor-pointer min-h-[220px] flex flex-col items-center justify-center p-6 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3 transition-all hover:border-slate-700"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                {dueWords[reviewIdx].term}
              </span>
              <button
                onClick={e => handlePlayAudio(e, dueWords[reviewIdx].term, dueWords[reviewIdx].target_language)}
                className="p-1.5 rounded-full text-indigo-400 hover:bg-slate-800"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <Badge variant="indigo">{dueWords[reviewIdx].pos.toUpperCase()}</Badge>

            {!isFlipped ? (
              <p className="text-xs text-slate-500 pt-4">Click card to reveal definition & translation</p>
            ) : (
              <div className="space-y-3 pt-3 animate-in fade-in">
                <p className="text-sm font-semibold text-indigo-300">
                  {dueWords[reviewIdx].definition}
                </p>
                {dueWords[reviewIdx].context_sentence && (
                  <p className="text-xs text-slate-400 italic">
                    "{dueWords[reviewIdx].context_sentence}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SM-2 Recall Rating Controls */}
          {isFlipped && (
            <div className="space-y-2 pt-2 animate-in fade-in">
              <span className="text-xs font-medium text-slate-400">Rate your recall:</span>
              <div className="grid grid-cols-4 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleRateReview(1)}>
                  Again (1)
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleRateReview(2)}>
                  Hard (2)
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleRateReview(3)}>
                  Good (3)
                </Button>
                <Button variant="primary" size="sm" onClick={() => handleRateReview(5)}>
                  Easy (5)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vocabulary Catalog */}
      <div className="space-y-4">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search saved words..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={targetLangFilter}
              onChange={e => setTargetLangFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Languages</option>
              <option value="en">English (en)</option>
              <option value="pt">Portuguese (pt)</option>
              <option value="es">Spanish (es)</option>
            </select>
          </div>
        </div>

        {/* Word Cards Grid */}
        {filteredWords.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-16 text-center space-y-3">
            <Bookmark className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-200">No Saved Words Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When reading authentic stories on the Learn page, click on any word and select "Save to My Words" to build your personalized vocabulary deck.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWords.map(word => (
              <div
                key={word.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-3 transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-100">{word.term}</span>
                    <button
                      onClick={e => handlePlayAudio(e, word.term, word.target_language)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Badge variant="indigo">{word.target_language.toUpperCase()}</Badge>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-indigo-300">{word.definition}</span>
                  {word.context_sentence && (
                    <p className="text-xs text-slate-400 italic line-clamp-2">
                      "{word.context_sentence}"
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Interval: {word.interval_days}d</span>
                  <span>Next: {word.next_review}</span>
                  <Badge variant={word.state === 'mastered' ? 'emerald' : 'slate'} size="sm">
                    {word.state}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
