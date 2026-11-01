import React, { useState, useEffect } from 'react';
import { Bookmark, Search, Trash2, Volume2, Sparkles, BookOpen } from 'lucide-react';
import { Language, VocabularyItem } from '../../../types';
import { getPhrasebookWords, deletePhrasebookWord, SavedVocabularyRecord } from '../../../services/localDb';
import { SpeechService } from '../../../services/speech';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { FlashcardDeck } from '../../../components/practice/FlashcardDeck';
import { useI18n } from '../../../i18n/i18nContext';
import { toast } from 'sonner';

interface SavedPhrasebookPracticeCardProps {
  language: Language;
}

export const SavedPhrasebookPracticeCard: React.FC<SavedPhrasebookPracticeCardProps> = ({
  language,
}) => {
  const { t } = useI18n();
  const [items, setItems] = useState<SavedVocabularyRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await getPhrasebookWords(language);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    setIsReviewMode(false);
  }, [language]);

  const handleDelete = async (id: string, text: string) => {
    await deletePhrasebookWord(id);
    toast.success(`"${text}" removido.`);
    await loadData();
  };

  const handleSpeak = (text: string) => {
    SpeechService.speak(text, language);
  };

  const filtered = items.filter(
    item =>
      item.source_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translated_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Convert phrasebook words into VocabularyItem for FlashcardDeck
  const reviewDeck: VocabularyItem[] = filtered.map(item => ({
    id: `phrasebook_${item.id}`,
    language,
    lemma: item.source_text,
    part_of_speech: (item.part_of_speech as any) || 'noun',
    cefr_level: 'B1',
    definition_target: item.translated_text,
    definition_en: item.translated_text,
    example_sentence_target: item.context_sentence || item.source_text,
    example_sentence_en: item.translated_text,
    regional_tags: ['all'],
    collocations: [],
    attribution: {
      source_name: 'Caderno de Vocabulário Pessoal',
      source_url: 'local',
      license_type: 'User-Curated',
      attribution_text: 'Vocábulo salvo durante sessões de leitura e prática.',
    },
  }));

  if (isReviewMode && reviewDeck.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-100">
              Revisão de Palavras Salvas ({reviewDeck.length} itens)
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReviewMode(false)}
            className="text-xs cursor-pointer"
          >
            Voltar à Lista
          </Button>
        </div>
        <FlashcardDeck
          vocabularyList={reviewDeck}
          onReviewFinished={() => setIsReviewMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5" /> Caderno de Palavras Salvas
            </span>
            <Badge variant="amber" size="sm">
              {items.length} {items.length === 1 ? 'termo' : 'termos'}
            </Badge>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100">
            Vocabulário Coletado em Leituras e Diálogos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Palavras capturadas com o popover contextual ao explorar textos ou conversações.
          </p>
        </div>

        {items.length > 0 && (
          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => setIsReviewMode(true)}
            className="text-xs font-bold cursor-pointer shrink-0"
          >
            Praticar com Flashcards ({items.length})
          </Button>
        )}
      </div>

      {/* Search Input */}
      {items.length > 0 && (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar entre as palavras salvas..."
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      )}

      {/* Word List / Empty State */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-400">Carregando vocabulário salvo...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Nenhuma palavra salva ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Ao ler textos no Reading Studio ou praticar no Conversation Studio, clique em qualquer palavra para conferir a definição e salvá-la aqui.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400">
          Nenhuma palavra corresponde à busca "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
          {filtered.map(item => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm font-bold text-slate-100 block">{item.source_text}</span>
                  <span className="text-xs text-slate-300 block mt-0.5">{item.translated_text}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSpeak(item.source_text)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Ouvir pronúncia"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.source_text)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer transition-colors"
                    title="Excluir palavra"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {item.context_sentence && (
                <p className="text-[11px] text-slate-400 italic pt-1.5 border-t border-slate-800/60 line-clamp-2">
                  "{item.context_sentence}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
