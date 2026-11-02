import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  AlertTriangle,
  Globe,
  Languages,
  BookOpen,
  Shield,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Language, ExplanationLanguage, CEFRLevel } from '../../../types';
import { ContentGenre, RightsStatus } from '../../../types/contentCentred';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { PipelineExecutionInput } from '../../../services/contentPipelineService';
import { useI18n } from '../../../i18n/i18nContext';

interface ContentImportFormProps {
  isProcessing: boolean;
  onSubmit: (input: PipelineExecutionInput) => Promise<void>;
}

export const ContentImportForm: React.FC<ContentImportFormProps> = ({
  isProcessing,
  onSubmit,
}) => {
  const { t } = useI18n();

  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState<Language>('en');
  const [explanationLanguage, setExplanationLanguage] = useState<ExplanationLanguage>('pt');
  const [genre, setGenre] = useState<ContentGenre>('culture_and_travel');
  const [declaredCefr, setDeclaredCefr] = useState<CEFRLevel>('B1');
  const [rightsStatus, setRightsStatus] = useState<RightsStatus>('public_domain');
  const [sourceAttribution, setSourceAttribution] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [error, setError] = useState<string | null>(null);

  const wordCount = rawText.trim() ? rawText.trim().split(/\s+/).length : 0;
  const isRightsRestricted = rightsStatus === 'restricted' || rightsStatus === 'unknown';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (wordCount < 15) {
      setError('Content must contain at least 15 words for linguistic processing');
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        rawText: rawText.trim(),
        targetLanguage,
        explanationLanguage,
        genre,
        declaredCefr,
        rightsStatus,
        sourceAttribution: sourceAttribution.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        author: author.trim() || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Processing failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Import & Process Authentic Content
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Transform authentic texts into interactive learning reading materials with automated segmentation, translation, vocabulary extraction, and comprehension activities.
          </p>
        </div>
        <Badge variant={isRightsRestricted ? 'rose' : 'emerald'}>
          {rightsStatus.replace('_', ' ').toUpperCase()}
        </Badge>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: Title and Core Linguistic Decoupling */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Content Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. A Morning Coffee in Dublin"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Author / Creator
          </label>
          <input
            type="text"
            value={author}
            onChange={e => setAuthor(e.target.value)}
            placeholder="e.g. James Joyce, BBC News, Editorial"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Decoupled Languages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl">
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            Learning Target Language
          </label>
          <select
            value={targetLanguage}
            onChange={e => setTargetLanguage(e.target.value as Language)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="en">English (en)</option>
            <option value="pt">Portuguese (pt)</option>
            <option value="es">Spanish (es)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            Explanation Language
          </label>
          <select
            value={explanationLanguage}
            onChange={e => setExplanationLanguage(e.target.value as ExplanationLanguage)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="pt">Portuguese (pt)</option>
            <option value="en">English (en)</option>
            <option value="es">Spanish (es)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Genre / Content Type
          </label>
          <select
            value={genre}
            onChange={e => setGenre(e.target.value as ContentGenre)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="conversation">Conversation</option>
            <option value="dialogue">Dialogue</option>
            <option value="short_story">Short Story</option>
            <option value="literature">Literature</option>
            <option value="news_article">News Article</option>
            <option value="workplace_email">Workplace Email</option>
            <option value="business_report">Business Report</option>
            <option value="academic_essay">Academic Essay</option>
            <option value="culture_and_travel">Culture & Travel</option>
            <option value="instructions_and_guides">Instructions & Guides</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            CEFR Target Level
          </label>
          <select
            value={declaredCefr}
            onChange={e => setDeclaredCefr(e.target.value as CEFRLevel)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="A1">A1 — Beginner</option>
            <option value="A2">A2 — Elementary</option>
            <option value="B1">B1 — Intermediate</option>
            <option value="B2">B2 — Upper-Intermediate</option>
            <option value="C1">C1 — Advanced</option>
            <option value="C2">C2 — Mastery</option>
          </select>
        </div>
      </div>

      {/* Main Text Input */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Authentic Text Content *
          </label>
          <span className="text-[11px] text-slate-400">
            {wordCount} words {wordCount < 15 && <span className="text-amber-400">(min 15 required)</span>}
          </span>
        </div>
        <textarea
          rows={8}
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder="Paste authentic reading content, dialogue, or literature passage here..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 transition-colors"
          required
        />
      </div>

      {/* Rights & Licensing */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
        <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-emerald-400" />
          Rights Declaration & Provenance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Rights Status</label>
            <select
              value={rightsStatus}
              onChange={e => setRightsStatus(e.target.value as RightsStatus)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="public_domain">Public Domain</option>
              <option value="original">Original Educational Creation</option>
              <option value="licensed">Open Licensed (CC-BY / Tatoeba)</option>
              <option value="permitted">Explicit Permission Granted</option>
              <option value="restricted">Restricted (Review Required)</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Attribution Notice</label>
            <input
              type="text"
              value={sourceAttribution}
              onChange={e => setSourceAttribution(e.target.value)}
              placeholder="e.g. Project Gutenberg, Public Domain"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Original Source URL (Optional)</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={e => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            />
          </div>
        </div>

        {isRightsRestricted && (
          <div className="p-2.5 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-300 text-[11px] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Restricted or Unknown rights status: This content can be processed into a draft for testing, but publication to learners will be blocked until rights are confirmed.
            </span>
          </div>
        )}
      </div>

      {/* Submission Action */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isProcessing || wordCount < 15 || !title.trim()}
          icon={<Sparkles className="w-4 h-4" />}
        >
          {isProcessing ? 'Processing Pipeline...' : 'Process Content Pipeline'}
        </Button>
      </div>
    </form>
  );
};
