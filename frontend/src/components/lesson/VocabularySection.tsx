import React, { useState } from 'react';
import { Search, Tag, ExternalLink } from 'lucide-react';
import { VocabularyItem, Language } from '../../types';
import { AudioButton } from '../common/AudioButton';
import { Badge } from '../common/Badge';
import { useI18n } from '../../i18n/i18nContext';

interface VocabularySectionProps {
  vocabulary: VocabularyItem[];
  language: Language;
  variety: string;
}

export const VocabularySection: React.FC<VocabularySectionProps> = ({
  vocabulary,
  language,
  variety,
}) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = vocabulary.filter(v =>
    v.lemma.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.definition_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.definition_target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            {t('lesson_vocab_advanced_lexicon', 'Léxico Avançado')} ({vocabulary.length} {t('lesson_vocab_terms_selected', 'termos selecionados')})
          </h3>
          <p className="text-xs text-slate-400">
            {t('lesson_vocab_subtitle', 'Termos essenciais com pronúncia IPA, acepções monolíngues e colocações frequentes.')}
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t('lesson_vocab_search_placeholder', 'Buscar termo ou tradução...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Vocabulary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((item, idx) => (
          <div
            key={item.id || idx}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              {/* Top row: Lemma, POS, IPA, Audio */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-slate-100">{item.lemma}</span>
                  {item.phonetic_ipa && (
                    <span className="text-xs font-mono text-indigo-400/90">{item.phonetic_ipa}</span>
                  )}
                  <Badge variant="slate" size="sm">
                    {item.part_of_speech}
                  </Badge>
                  <Badge variant={item.cefr_level === 'C1' ? 'emerald' : 'sky'} size="sm">
                    {item.cefr_level}
                  </Badge>
                </div>
                <AudioButton
                  text={item.example_sentence_target || item.lemma}
                  language={language}
                  variety={variety}
                  audioUrl={item.audio_url}
                />
              </div>

              {/* Definitions */}
              <div className="space-y-1 mb-3">
                {language === 'en' ? (
                  <>
                    <p className="text-xs font-semibold text-slate-100 leading-snug">
                      {item.definition_en}
                    </p>
                    <div className="space-y-0.5 text-xs text-slate-400">
                      {item.definition_pt && (
                        <p>
                          <span className="font-bold text-indigo-400">PT:</span> {item.definition_pt}
                        </p>
                      )}
                      {item.definition_es && (
                        <p>
                          <span className="font-bold text-emerald-400">ES:</span> {item.definition_es}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-medium text-slate-200 leading-snug">
                      {item.definition_target}
                    </p>
                    <p className="text-xs text-slate-400 italic">
                      <span className="font-bold text-slate-300 not-italic">EN:</span> {item.definition_en}
                    </p>
                  </>
                )}
              </div>

              {/* Example Sentence */}
              <div className="bg-slate-800/60 border-l-2 border-indigo-500 rounded-r-lg p-2.5 my-2 text-xs space-y-1">
                <p className="text-slate-100 font-medium">{item.example_sentence_target}</p>
                {language === 'en' ? (
                  <div className="space-y-0.5 pt-1 border-t border-slate-700/50">
                    {item.example_sentence_pt && (
                      <p className="text-slate-300">
                        <span className="font-bold text-indigo-400">PT:</span> {item.example_sentence_pt}
                      </p>
                    )}
                    {item.example_sentence_es && (
                      <p className="text-slate-300">
                        <span className="font-bold text-emerald-400">ES:</span> {item.example_sentence_es}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 mt-0.5">
                    <span className="font-bold text-slate-300">EN:</span> {item.example_sentence_en}
                  </p>
                )}
              </div>

              {/* Collocations */}
              {item.collocations && item.collocations.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Tag className="w-3 h-3" /> Colocações:
                  </span>
                  {item.collocations.map((col, cIdx) => (
                    <span
                      key={cIdx}
                      className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              )}

              {/* False Friend Warning */}
              {item.false_friend_warning && (
                <div className="mt-2.5 p-2 rounded bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300">
                  ⚠️ {item.false_friend_warning}
                </div>
              )}
            </div>

            {/* Attribution footer */}
            <div className="mt-3 pt-2 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-400">
              <span>{item.attribution?.source_name} ({item.attribution?.license_type})</span>
              {item.attribution?.source_url && (
                <a
                  href={item.attribution.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-400 inline-flex items-center gap-0.5"
                >
                  Fonte <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
