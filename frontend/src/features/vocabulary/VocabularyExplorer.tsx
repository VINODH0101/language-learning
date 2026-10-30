/**
 * Advanced Vocabulary Explorer Component
 * 
 * Comprehensive lexical search and discovery:
 * - Multi-provider dictionary lookup
 * - Contextual translation into pedagogical explanation language
 * - Example sentences from Tatoeba & OPUS
 * - Corpus frequency ranking tier (wordfreq)
 * - Synonyms and antonyms
 * - Audio pronunciation via Web Speech API
 * - Categorization into personal vocabulary collections
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Volume2,
  BookmarkPlus,
  Check,
  Sparkles,
  TrendingUp,
  FolderPlus,
  Folder,
  Tag,
  Loader2,
  Languages,
  BookOpen,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Language, SavedVocabularyRecord } from '../../types';
import { DictionaryService } from '../../services/dictionaryService';
import { NormalizedDictionaryEntry } from '../../integrations/external-apis/core/types';
import { FrequencyManager } from '../../services/providers/frequency/frequencyManager';
import { ExamplesManager } from '../../services/providers/examples/examplesManager';
import { TranslationManager } from '../../services/providers/translation/translationManager';
import { NormalizedFrequencyItem, NormalizedSentencePair } from '../../services/normalization/responseNormalizers';
import { SpeechService } from '../../services/speech';
import { savePhrasebookWord, getPhrasebookWords } from '../../services/localDb';
import { authService } from '../../services/auth';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { toast } from 'sonner';

export interface VocabularyExplorerProps {
  targetLang: Language;
  explanationLang: Language;
}

export const VocabularyExplorer: React.FC<VocabularyExplorerProps> = ({
  targetLang,
  explanationLang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [entry, setEntry] = useState<NormalizedDictionaryEntry | null>(null);
  const [frequency, setFrequency] = useState<NormalizedFrequencyItem | null>(null);
  const [examples, setExamples] = useState<NormalizedSentencePair[]>([]);
  const [translation, setTranslation] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  // Collections State
  const [selectedCollection, setSelectedCollection] = useState<string>('Geral');
  const [collections, setCollections] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('lexilume_vocab_collections');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['Geral', 'Viagem', 'Trabalho & Negócios', 'Expressões C1', 'Fundamentos'];
  });
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isAddingCollection, setIsAddingCollection] = useState(false);

  useEffect(() => {
    // Load already saved words
    getPhrasebookWords(explanationLang)
      .then(items => {
        setSavedWords(new Set(items.map(i => i.source_text.toLowerCase())));
      })
      .catch(() => {});
  }, [explanationLang]);

  const handleSearch = async (termToLookup?: string) => {
    const q = (termToLookup || searchTerm).trim();
    if (!q) {
      setErrorMsg('Digite um termo para pesquisar.');
      return;
    }

    setErrorMsg(null);
    setIsLoading(true);

    try {
      // 1. Dictionary Lookup
      let dictResult: NormalizedDictionaryEntry | null = null;
      try {
        dictResult = await DictionaryService.lookup(q, targetLang);
        setEntry(dictResult);
      } catch (err) {
        // Fallback placeholder if word is absent from static dictionary
        dictResult = {
          word: q,
          language: targetLang,
          meanings: [
            {
              partOfSpeech: 'termo',
              definitions: [`Consulta para "${q}"`],
            },
          ],
          provider: 'lexilume_index',
        };
        setEntry(dictResult);
      }

      // 2. Frequency Ranking
      try {
        const freqResult = await FrequencyManager.getInstance().getWordFrequency({
          word: q,
          language: targetLang,
        });
        setFrequency(freqResult);
      } catch {
        setFrequency(null);
      }

      // 3. Examples Search (Tatoeba / OPUS)
      try {
        const exResults = await ExamplesManager.getInstance().getExamples({
          query: q,
          sourceLang: targetLang,
          targetLang: explanationLang,
          limit: 3,
        });
        setExamples(exResults);
      } catch {
        setExamples([]);
      }

      // 4. Translation
      try {
        const tr = await TranslationManager.getInstance().translate(q, targetLang, explanationLang);
        if (tr?.translatedText) setTranslation(tr.translatedText);
      } catch {
        setTranslation('');
      }
    } catch (err: any) {
      setErrorMsg(`Erro ao pesquisar termo: ${err?.message || 'Falha de consulta'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = () => {
    if (!entry) return;
    SpeechService.speak(entry.word, targetLang);
  };

  const handleSaveWord = async () => {
    if (!entry) return;
    try {
      const userId = authService.getState().user?.id || 'guest';
      const def = entry.meanings[0]?.definitions[0] || translation || entry.word;
      const exSentence = examples.length > 0 ? (examples[0].sourceText || (examples[0] as any).sourceSentence) : undefined;

      await savePhrasebookWord({
        user_id: userId,
        source_text: entry.word,
        translated_text: translation || def,
        source_lang: targetLang,
        target_lang: explanationLang,
        part_of_speech: entry.meanings[0]?.partOfSpeech,
        phonetic_ipa: entry.phonetic,
        context_sentence: exSentence ? `[${selectedCollection}] ${exSentence}` : `[${selectedCollection}]`,
        is_verified: true,
      });

      setSavedWords(prev => new Set([...prev, entry.word.toLowerCase()]));
      toast.success(`"${entry.word}" salvo na coleção "${selectedCollection}"!`);
    } catch {
      toast.error('Erro ao salvar no vocabulário pessoal.');
    }
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCollectionName.trim();
    if (!clean || collections.includes(clean)) return;

    const updated = [...collections, clean];
    setCollections(updated);
    setSelectedCollection(clean);
    setNewCollectionName('');
    setIsAddingCollection(false);
    try {
      localStorage.setItem('lexilume_vocab_collections', JSON.stringify(updated));
      toast.success(`Coleção "${clean}" criada com sucesso!`);
    } catch {}
  };

  const isSaved = entry ? savedWords.has(entry.word.toLowerCase()) : false;

  return (
    <div className="space-y-6">
      {/* Search Bar & Quick Picks */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Pesquisar vocábulo em ${targetLang.toUpperCase()} (ex: resiliência, saudade, sobremesa)...`}
              className="w-full pl-11 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            onClick={() => handleSearch()}
            disabled={isLoading}
            className="shrink-0 min-h-[46px]"
          >
            Pesquisar
          </Button>
        </div>

        {/* Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
            Sugestões C1:
          </span>
          {['serendipity', 'saudade', 'resiliência', 'perspicácia', 'sobremesa'].map(w => (
            <button
              key={w}
              onClick={() => {
                setSearchTerm(w);
                handleSearch(w);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700/50"
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Main Lexical Inspector Panel */}
      {entry && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 space-y-6 shadow-md animate-fadeIn">
          {/* Header Row: Word, Pronunciation, Audio, Frequency, Save */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {entry.word}
                </h2>
                {entry.phonetic && (
                  <span className="text-sm text-slate-400 font-mono">
                    /{entry.phonetic}/
                  </span>
                )}
                <button
                  onClick={handleSpeak}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Ouvir pronúncia"
                  aria-label="Ouvir pronúncia"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                <Badge variant="indigo" size="sm">
                  {targetLang.toUpperCase()}
                </Badge>
                {frequency && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Rank #{frequency.rank.toLocaleString()} (Corpus Frequency)</span>
                  </span>
                )}
                {translation && (
                  <span className="text-slate-300 font-semibold">
                    Tradução ({explanationLang.toUpperCase()}): <strong className="text-indigo-300">{translation}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Collection Selector & Save Button */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                <Folder className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                >
                  {collections.map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-slate-200">
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsAddingCollection(true)}
                  className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 cursor-pointer ml-1"
                  title="Criar nova coleção"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              <Button
                variant={isSaved ? 'secondary' : 'primary'}
                size="md"
                icon={isSaved ? <Check className="w-4 h-4 text-emerald-400" /> : <BookmarkPlus className="w-4 h-4" />}
                onClick={handleSaveWord}
                disabled={isSaved}
                className={isSaved ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300' : ''}
              >
                {isSaved ? 'Salvo' : 'Salvar no Vocabulário'}
              </Button>
            </div>
          </div>

          {/* New Collection Modal */}
          {isAddingCollection && (
            <form onSubmit={handleCreateCollection} className="p-3 bg-slate-950/90 rounded-xl border border-indigo-700/60 flex items-center gap-2 animate-fadeIn">
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Nome da nova coleção (ex: Falsos Amigos, Negócios)..."
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                autoFocus
              />
              <Button variant="primary" size="sm" type="submit">
                Adicionar
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsAddingCollection(false)}>
                Cancelar
              </Button>
            </form>
          )}

          {/* Meanings, Definitions, Synonyms & Antonyms */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Definições Gramaticais & Sentidos
            </h3>
            <div className="grid grid-cols-1 gap-3.5">
              {entry.meanings.map((meaning, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {meaning.partOfSpeech}
                    </span>
                  </div>

                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-200">
                    {meaning.definitions.map((def, dIdx) => (
                      <li key={dIdx} className="leading-relaxed">
                        {def}
                      </li>
                    ))}
                  </ul>

                  {/* Synonyms & Antonyms Pills */}
                  {((meaning.synonyms && meaning.synonyms.length > 0) ||
                    (meaning.antonyms && meaning.antonyms.length > 0)) && (
                    <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                      {meaning.synonyms && meaning.synonyms.length > 0 && (
                        <div className="flex items-center gap-1 text-emerald-400">
                          <span className="font-semibold text-slate-400">Sinônimos:</span>
                          {meaning.synonyms.slice(0, 4).map((s, sIdx) => (
                            <button
                              key={sIdx}
                              onClick={() => {
                                setSearchTerm(s);
                                handleSearch(s);
                              }}
                              className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 transition cursor-pointer"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      {meaning.antonyms && meaning.antonyms.length > 0 && (
                        <div className="flex items-center gap-1 text-rose-400">
                          <span className="font-semibold text-slate-400">Antônimos:</span>
                          {meaning.antonyms.slice(0, 4).map((a, aIdx) => (
                            <button
                              key={aIdx}
                              onClick={() => {
                                setSearchTerm(a);
                                handleSearch(a);
                              }}
                              className="px-1.5 py-0.5 rounded bg-rose-950/70 border border-rose-800 hover:bg-rose-900 text-rose-300 transition cursor-pointer"
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Example Sentences from Tatoeba / OPUS */}
          {examples.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Exemplos em Contexto Real (Tatoeba & OPUS)</span>
                </h3>
              </div>

              <div className="space-y-2">
                {examples.map((ex) => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                  >
                    <p className="font-semibold text-slate-100">{ex.sourceText || (ex as any).sourceSentence}</p>
                    <p className="text-slate-400 italic">{ex.targetText || (ex as any).targetSentence}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
