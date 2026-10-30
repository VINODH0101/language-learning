/**
 * Lexilume Discover Hub Component
 * 
 * Central discovery nexus for multilingual learning materials:
 * - Public-domain books (Gutendex / Project Gutenberg)
 * - Wikipedia cultural & linguistic explorations
 * - Thematic vocabulary clusters
 * - Interactive conversation scenario cards
 * - Filterable by CEFR Level (A1–C1) & Target Language
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  BookOpen,
  Languages,
  Sparkles,
  MessageSquare,
  Globe2,
  Library,
  ExternalLink,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Language } from '../../types';
import { ReadingManager } from '../../services/providers/reading/readingManager';
import { NormalizedBook } from '../../services/normalization/responseNormalizers';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export type DiscoverCategory = 'all' | 'books' | 'articles' | 'themes' | 'scenarios';

export interface ThematicCluster {
  id: string;
  title: string;
  description: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  language: Language;
  terms: string[];
}

const THEMATIC_CLUSTERS: ThematicCluster[] = [
  {
    id: 'theme-pt-1',
    title: 'Gastronomia e Doçaria Conventual Portuguesa',
    description: 'Pastéis de Belém, queijadas de Sintra e terminologia culinária das regiões de Portugal.',
    cefrLevel: 'B1',
    language: 'pt',
    terms: ['doçaria', 'conventual', 'gemas', 'caldo verde', 'bacalhau à gomes de sá'],
  },
  {
    id: 'theme-pt-2',
    title: 'Discurso Acadêmico & Ensaística Contemporânea',
    description: 'Conectivos frásicos de nível C1, transições argumentativas e rigor ensaístico.',
    cefrLevel: 'C1',
    language: 'pt',
    terms: ['outrossim', 'concomitantemente', 'epistemologia', 'paradigma', 'dialética'],
  },
  {
    id: 'theme-es-1',
    title: 'Rutas Gastronómicas e Identidad Culinaria Ibérica',
    description: 'Tapas andaluzas, jamón ibérico y vocabulario culinario esencial de España y América.',
    cefrLevel: 'B1',
    language: 'es',
    terms: ['sobremesa', 'maridaje', 'tapeo', 'guiso', 'denominación de origen'],
  },
  {
    id: 'theme-es-2',
    title: 'Retórica Jurídica y Filosofía Política Hispánica',
    description: 'Términos de debate formal, argumentación C1 y precisión institucional.',
    cefrLevel: 'C1',
    language: 'es',
    terms: ['jurisprudencia', 'vindicación', 'prerrogativa', 'inalienable', 'arbitraje'],
  },
  {
    id: 'theme-en-1',
    title: 'Cognitive Computing & Algorithmic Ethics',
    description: 'High-level vocabulary for artificial intelligence, neural networks, and digital ethics.',
    cefrLevel: 'C1',
    language: 'en',
    terms: ['heuristic', 'gradient descent', 'stochastic', 'alignment', 'interpretability'],
  },
];

const DISCOVERY_SCENARIOS = [
  {
    id: 'scen-pt-1',
    title: 'Negociação na Feira da Ladra',
    description: 'Comunicação informal, regateio amigável e expressões castiças lisboetas.',
    cefrLevel: 'B2',
    language: 'pt',
  },
  {
    id: 'scen-pt-2',
    title: 'Defesa de Tese Universitária em Coimbra',
    description: 'Defesa oral de hipóteses e réplica a perguntas da banca avaliadora.',
    cefrLevel: 'C1',
    language: 'pt',
  },
  {
    id: 'scen-es-1',
    title: 'Entrevista de Prensa y Rueda Cultural',
    description: 'Preguntas incisivas sobre literatura, cine y actualidad sociopolítica.',
    cefrLevel: 'C1',
    language: 'es',
  },
];

export interface DiscoverHubProps {
  initialLanguage?: Language;
  onNavigateToPractice?: (mode: string) => void;
}

export const DiscoverHub: React.FC<DiscoverHubProps> = ({
  initialLanguage = 'pt',
  onNavigateToPractice,
}) => {
  const [selectedLang, setSelectedLang] = useState<Language>(initialLanguage);
  const [selectedCefr, setSelectedCefr] = useState<string>('all');
  const [category, setCategory] = useState<DiscoverCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Gutendex books
  const [books, setBooks] = useState<NormalizedBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const fetchBooks = async () => {
      setLoadingBooks(true);
      try {
        const readingManager = ReadingManager.getInstance();
        const res = await readingManager.getPublicDomainBooks({
          language: selectedLang,
          topic: searchQuery || undefined,
        });
        if (!isCancelled) {
          setBooks(res);
        }
      } catch (e) {
        if (!isCancelled) setBooks([]);
      } finally {
        if (!isCancelled) setLoadingBooks(false);
      }
    };

    fetchBooks();
    return () => { isCancelled = true; };
  }, [selectedLang, searchQuery]);

  const filteredThemes = THEMATIC_CLUSTERS.filter(t => {
    if (t.language !== selectedLang) return false;
    if (selectedCefr !== 'all' && t.cefrLevel !== selectedCefr) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredScenarios = DISCOVERY_SCENARIOS.filter(s => {
    if (s.language !== selectedLang) return false;
    if (selectedCefr !== 'all' && s.cefrLevel !== selectedCefr) return false;
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Discover Hub Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-100">Discover Hub — Exploração Multilingual</h1>
                <Badge variant="sky" size="sm">Recursos Abertos</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Obras em domínio público (Gutendex), enciclopédia cultural e clusters temáticos organizados por nível CEFR.
              </p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            {(['pt', 'es', 'en'] as Language[]).map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedLang === lang
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar livros em domínio público, temas ou cenários..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs">
            {(['all', 'books', 'themes', 'scenarios'] as DiscoverCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  category === cat
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' && 'Tudo'}
                {cat === 'books' && 'Livros Gutendex'}
                {cat === 'themes' && 'Temas Léxicos'}
                {cat === 'scenarios' && 'Cenários Roleplay'}
              </button>
            ))}
          </div>

          {/* CEFR Level Filter */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            {['all', 'B1', 'B2', 'C1'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedCefr(lvl)}
                className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedCefr === lvl
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl === 'all' ? 'CEFR Todos' : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Public Domain Books */}
      {(category === 'all' || category === 'books') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Library className="w-4 h-4 text-sky-400" />
              Livros em Domínio Público (Gutendex / Gutenberg)
            </h3>
            <span className="text-xs text-slate-500">
              {books.length} Obras Disponíveis
            </span>
          </div>

          {loadingBooks ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Carregando catálogo de clássicos em domínio público...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {books.slice(0, 6).map(book => (
                <div
                  key={book.id}
                  className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-3"
                >
                  <div>
                    <Badge variant="sky" size="sm" className="mb-2">Domínio Público</Badge>
                    <h4 className="text-sm font-bold text-slate-100 line-clamp-2 leading-snug">
                      {book.title}
                    </h4>
                    <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                      {book.authors?.join(', ') || 'Autor Clássico'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {(book as any).downloadCount ? `${(book as any).downloadCount.toLocaleString()} downloads` : 'Livre'}
                    </span>
                    {onNavigateToPractice ? (
                      <button
                        onClick={() => onNavigateToPractice('reading')}
                        className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ler no Studio</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-sky-400 font-semibold">
                        Acessível no Reading Studio
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Grid: Thematic Vocabulary Clusters */}
      {(category === 'all' || category === 'themes') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Clusters Temáticos & Vocabulário Especializado
            </h3>
            <Badge variant="emerald" size="sm">
              {filteredThemes.length} Coleções
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredThemes.map(theme => (
              <div
                key={theme.id}
                className="p-5 bg-slate-950/40 rounded-xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="emerald">{theme.cefrLevel}</Badge>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {theme.language.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-100">{theme.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{theme.description}</p>
                </div>

                {/* Sample terms tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {theme.terms.map((term, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-[11px] text-emerald-300 font-mono"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Conversation Roleplay Topics */}
      {(category === 'all' || category === 'scenarios') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              Tópicos de Diálogo & Simulação Conversacional
            </h3>
            <Badge variant="indigo" size="sm">
              {filteredScenarios.length} Cenários
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {filteredScenarios.map(scen => (
              <div
                key={scen.id}
                className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="indigo" size="sm">{scen.cefrLevel}</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100">{scen.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">{scen.description}</p>
                </div>

                {onNavigateToPractice ? (
                  <button
                    onClick={() => onNavigateToPractice('conversation')}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer pt-2 border-t border-slate-800/80"
                  >
                    <span>Praticar Diálogo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-purple-400 font-semibold pt-2 border-t border-slate-800/80">
                    Disponível no Conversation Studio
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
