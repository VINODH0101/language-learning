import React, { useState } from 'react';
import {
  Search,
  Volume2,
  BookmarkPlus,
  BookmarkCheck,
  BookOpen,
  Loader2,
  Lightbulb,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { Language } from '../../types';
import { DictionaryService } from '../../services/dictionaryService';
import { NormalizedDictionaryEntry } from '../../integrations/external-apis/core/types';
import { StorageService } from '../../services/storage';
import { SpeechService } from '../../services/speech';
import { toast } from 'sonner';

interface LiveDictionaryLookupProps {
  targetLang: Language;
}

export const LiveDictionaryLookup: React.FC<LiveDictionaryLookupProps> = ({ targetLang }) => {
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<NormalizedDictionaryEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  const sampleWords: Partial<Record<Language, string[]>> = {
    en: ['serendipity', 'resilience', 'eloquent', 'prerogative'],
    pt: ['saudade', 'alvíssaras', 'inefável', 'perspicácia'],
    es: ['sobremesa', 'madrugada', 'desvelo', 'añoranza'],
  };

  const handleLookup = async (lookupTerm?: string) => {
    const term = (lookupTerm || word).trim();
    if (!term) {
      setErrorMsg('Digite uma palavra para pesquisar.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const result = await DictionaryService.lookup(term, targetLang);
      setEntry(result);
    } catch (err) {
      console.warn('Dictionary lookup failed:', err);
      setErrorMsg(
        `Palavra "${term}" não encontrada no dicionário.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAudio = () => {
    if (!entry) return;
    if (entry.phoneticAudioUrl) {
      const audio = new Audio(entry.phoneticAudioUrl);
      audio.play().catch(() => {
        SpeechService.speak(entry.word, targetLang);
      });
    } else {
      SpeechService.speak(entry.word, targetLang);
    }
  };

  const handleSaveToVocab = () => {
    if (!entry) return;
    const firstDef = entry.meanings[0]?.definitions[0] || 'Definição salva';
    StorageService.saveTranslationBookmark({
      id: `voc-${Date.now()}-${entry.word}`,
      source_text: entry.word,
      translated_text: firstDef,
      source_lang: targetLang,
      target_lang: targetLang === 'en' ? 'pt' : 'en',
      provider_used: entry.provider,
      is_verified: entry.provider !== 'fallback',
      notes: entry.etymology || (entry.meanings[0]?.examples?.[0] ? `Ex: ${entry.meanings[0].examples[0]}` : undefined),
      created_at: new Date().toISOString(),
    });
    setSavedWords(prev => new Set([...prev, entry.word.toLowerCase()]));
    toast.success(`"${entry.word}" adicionada ao seu vocabulário pessoal!`);
  };

  const isSaved = entry ? savedWords.has(entry.word.toLowerCase()) : false;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-950 text-sky-400 border border-sky-800">
              <BookOpen className="w-4 h-4" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">
              Dicionário Lexical Integrado
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {targetLang === 'en' && 'Consultas léxicas completas com transcrição fonética IPA e pronúncia em áudio nativo.'}
            {targetLang === 'pt' && 'Consultas completas com categorização gramatical, etimologia e acepções detalhadas.'}
            {targetLang === 'es' && 'Léxico autêntico com definições contextualizadas para os níveis B2 e C1.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-500 font-semibold mr-1">Sugestões:</span>
          {(sampleWords[targetLang] || []).map(sample => (
            <button
              key={sample}
              onClick={() => {
                setWord(sample);
                handleLookup(sample);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            placeholder={`Digite uma palavra em ${
              targetLang === 'en' ? 'inglês' : targetLang === 'pt' ? 'português' : 'espanhol'
            }...`}
            className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition min-h-[44px]"
          />
        </div>

        <button
          onClick={() => handleLookup()}
          disabled={loading || !word.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md min-h-[44px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Buscando...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Consultar</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Dictionary Result Card */}
      {entry && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fadeIn shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <h3 className="text-xl sm:text-2xl font-black text-slate-100 capitalize">
                {entry.word}
              </h3>
              {entry.phonetic && (
                <span className="text-xs font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
                  {entry.phonetic}
                </span>
              )}
              <button
                onClick={handlePlayAudio}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 transition cursor-pointer"
                title="Ouvir Pronúncia"
                aria-label="Ouvir Pronúncia"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToVocab}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSaved
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 text-amber-400" />
                    <span>Salva no Vocabulário</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4" />
                    <span>Salvar Palavra</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Etymology */}
          {entry.etymology && (
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-sky-400 text-[10px] uppercase block mb-0.5">Etimologia</span>
              {entry.etymology}
            </div>
          )}

          {/* Meanings */}
          <div className="space-y-4">
            {entry.meanings.map((meaning, mIdx) => (
              <div key={mIdx} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                    {meaning.partOfSpeech}
                  </span>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-200 pl-1 leading-relaxed">
                  {meaning.definitions.map((def, dIdx) => (
                    <li key={dIdx} className="text-slate-300">
                      <span className="text-slate-100">{def}</span>
                    </li>
                  ))}
                </ol>

                {meaning.examples && meaning.examples.length > 0 && (
                  <div className="mt-2 pl-4 border-l-2 border-sky-500/40 text-xs italic text-slate-400 space-y-1">
                    {meaning.examples.map((ex, exIdx) => (
                      <p key={exIdx}>"{ex}"</p>
                    ))}
                  </div>
                )}

                {meaning.synonyms && meaning.synonyms.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Sinônimos:</span>
                    {meaning.synonyms.slice(0, 5).map((syn, sIdx) => (
                      <span key={sIdx} className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                        {syn}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
            <span className="text-slate-400 font-medium">Definição lexical contextualizada</span>
          </div>
        </div>
      )}
    </div>
  );
};
