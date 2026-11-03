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
    if (
      searchQuery.trim() &&
      !w.term.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !w.lemma.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
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
      {/* Editorial Page Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium tracking-wide">
            <Bookmark className="w-3.5 h-3.5 text-stone-600" />
            <span>Personal Lexicon & Spaced Repetition</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
            My Words
          </h1>
          <p className="text-sm text-stone-600 max-w-xl font-normal leading-relaxed">
            Authentic expressions and vocabulary curated during your reading journey. Retain mastery through the SuperMemo SM-2 spaced repetition system.
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
        <div className="max-w-xl mx-auto bg-white border border-stone-300 rounded-2xl p-6 sm:p-8 shadow-md space-y-6 text-center animate-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <span className="font-mono text-xs font-semibold text-stone-700 uppercase tracking-wider">
              Card {reviewIdx + 1} of {dueWords.length}
            </span>
            <button
              onClick={() => setIsReviewMode(false)}
              className="text-xs text-stone-500 hover:text-stone-800 cursor-pointer font-medium"
            >
              Exit Review
            </button>
          </div>

          <div
            onClick={() => setIsFlipped(prev => !prev)}
            className="cursor-pointer min-h-[220px] flex flex-col items-center justify-center p-6 bg-stone-50/80 border border-stone-200 rounded-xl space-y-3 transition-all hover:border-stone-400"
          >
            <div className="flex items-center gap-2">
              <span className="font-serif text-3xl sm:text-4xl font-bold text-stone-900">
                {dueWords[reviewIdx].term}
              </span>
              <button
                onClick={e => handlePlayAudio(e, dueWords[reviewIdx].term, dueWords[reviewIdx].target_language)}
                className="p-1.5 rounded-full text-stone-600 hover:bg-stone-200 transition-colors"
                aria-label="Listen to pronunciation"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <Badge variant="slate">{dueWords[reviewIdx].pos.toUpperCase()}</Badge>

            {!isFlipped ? (
              <p className="text-xs text-stone-500 pt-4 font-sans">
                Click card to reveal definition & translation
              </p>
            ) : (
              <div className="space-y-3 pt-3 animate-in fade-in">
                <p className="text-base font-semibold text-stone-900 font-sans">
                  {dueWords[reviewIdx].definition}
                </p>
                {dueWords[reviewIdx].context_sentence && (
                  <p className="font-serif text-xs text-stone-600 italic bg-white p-3 rounded-lg border border-stone-200">
                    "{dueWords[reviewIdx].context_sentence}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* SM-2 Recall Rating Controls */}
          {isFlipped && (
            <div className="space-y-2 pt-2 animate-in fade-in">
              <span className="text-xs font-medium text-stone-600">Rate your recall:</span>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search saved words..."
              className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={targetLangFilter}
              onChange={e => setTargetLangFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-stone-400 focus:bg-white"
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
          <div className="bg-white border border-stone-200 rounded-2xl p-16 text-center space-y-3 shadow-sm">
            <Bookmark className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="font-serif text-lg font-bold text-stone-800">No Saved Words Yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
              When reading authentic texts in the Learn library, click on any word and select "Save to My Words" to build your personal vocabulary notebook.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWords.map(word => (
              <div
                key={word.id}
                className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl p-5 space-y-3 transition-all shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-xl font-bold text-stone-900">{word.term}</span>
                      <button
                        onClick={e => handlePlayAudio(e, word.term, word.target_language)}
                        className="p-1 rounded text-stone-400 hover:text-stone-800 transition-colors"
                        aria-label="Play audio"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Badge variant="slate">{word.target_language.toUpperCase()}</Badge>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-stone-900 block">{word.definition}</span>
                    {word.context_sentence && (
                      <p className="font-serif text-xs text-stone-600 italic border-l-2 border-stone-200 pl-2.5 py-0.5 line-clamp-2">
                        "{word.context_sentence}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
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
