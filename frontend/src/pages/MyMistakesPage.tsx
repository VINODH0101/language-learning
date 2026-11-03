import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Filter,
  Search,
  BookOpen,
  Sparkles,
  HelpCircle,
  Award,
} from 'lucide-react';
import { UserMistake, ErrorCategory, MistakeStatus } from '../types/contentCentred';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { contentCentredService } from '../services/contentCentredService';
import { authService } from '../services/auth';
import { toast } from 'sonner';

export const MyMistakesPage: React.FC = () => {
  const [mistakes, setMistakes] = useState<UserMistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('unresolved');
  const [retestingId, setRetestingId] = useState<string | null>(null);
  const [retestInput, setRetestInput] = useState<string>('');

  const loadMistakes = async () => {
    setLoading(true);
    try {
      const auth = authService.getState();
      const userId = auth.user?.id || 'guest_user';
      const list = await contentCentredService.getUserMistakes(userId);
      setMistakes(list);
    } catch (e) {
      console.warn('Error loading mistakes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMistakes();
  }, []);

  const handleResolveMistake = async (id: string) => {
    try {
      await contentCentredService.resolveUserMistake(id, 'mastered');
      toast.success('Mistake marked as mastered and resolved!');
      await loadMistakes();
    } catch (err: any) {
      toast.error('Error updating mistake status');
    }
  };

  const handleRetestSubmit = async (mistake: UserMistake) => {
    if (retestInput.trim().toLowerCase() === mistake.correct_response.trim().toLowerCase()) {
      await handleResolveMistake(mistake.id);
      setRetestingId(null);
      setRetestInput('');
    } else {
      toast.error('Incorrect response. Review the pedagogical explanation below.');
    }
  };

  const filteredMistakes = mistakes.filter(m => {
    if (filterStatus !== 'all' && m.status !== filterStatus) return false;
    if (filterCategory !== 'all' && m.error_category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Header Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium tracking-wide">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
          <span>Error Diagnostics & Remediation</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
          My Mistakes Notebook
        </h1>
        <p className="text-sm text-stone-600 max-w-xl font-normal leading-relaxed">
          Uncertain grammar structures and comprehension misses encountered in reading are indexed here with pedagogical feedback for active re-testing.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Badge variant="rose">
            {mistakes.filter(m => m.status === 'unresolved').length} Unresolved
          </Badge>
          <Badge variant="emerald">
            {mistakes.filter(m => m.status === 'mastered').length} Mastered
          </Badge>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-stone-400 focus:bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="unresolved">Unresolved Only</option>
            <option value="mastered">Mastered Only</option>
          </select>

          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-stone-400 focus:bg-white"
          >
            <option value="all">All Categories</option>
            <option value="vocabulary_choice">Vocabulary Choice</option>
            <option value="comprehension_inference">Comprehension Inference</option>
            <option value="verb_tense">Verb Tense</option>
            <option value="preposition">Preposition</option>
            <option value="word_order">Word Order</option>
          </select>
        </div>
      </div>

      {/* Mistakes List */}
      {filteredMistakes.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-16 text-center space-y-3 shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-stone-800">No Unresolved Mistakes!</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            You currently have no recorded errors matching this filter. Continue reading authentic stories and completing comprehension exercises.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMistakes.map(mistake => {
            const isRetesting = retestingId === mistake.id;

            return (
              <div
                key={mistake.id}
                className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={mistake.status === 'mastered' ? 'emerald' : 'rose'}>
                      {mistake.error_category.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="font-mono text-[11px] text-stone-500">
                      {mistake.occurrences_count} {mistake.occurrences_count === 1 ? 'occurrence' : 'occurrences'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-base font-bold text-stone-900 leading-snug">
                      {mistake.stimulus}
                    </h3>
                  </div>

                  {/* Previous submission vs correct answer */}
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-rose-800 bg-rose-50/70 p-2 rounded border border-rose-100">
                      <span className="font-mono font-semibold text-[10px] uppercase text-rose-700">Your answer:</span>
                      <span className="font-mono font-medium">"{mistake.user_response}"</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/70 p-2 rounded border border-emerald-100">
                      <span className="font-mono font-semibold text-[10px] uppercase text-emerald-700">Correct:</span>
                      <span className="font-mono font-semibold">"{mistake.correct_response}"</span>
                    </div>
                  </div>

                  <p className="font-serif text-xs text-stone-700 leading-relaxed italic bg-amber-50/60 p-3 rounded-lg border-l-2 border-amber-300">
                    "{mistake.pedagogical_explanation}"
                  </p>
                </div>

                {/* Retest Area or Action */}
                <div className="pt-3 border-t border-stone-100">
                  {isRetesting ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={retestInput}
                        onChange={e => setRetestInput(e.target.value)}
                        placeholder="Type the correct response..."
                        className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-500 focus:bg-white font-mono"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setRetestingId(null)}>
                          Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => handleRetestSubmit(mistake)}>
                          Submit
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      {mistake.status !== 'mastered' ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            icon={<RotateCcw className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setRetestingId(mistake.id);
                              setRetestInput('');
                            }}
                          >
                            Re-test
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                            onClick={() => handleResolveMistake(mistake.id)}
                          >
                            Mark Mastered
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-600" />
                          Mastered
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
