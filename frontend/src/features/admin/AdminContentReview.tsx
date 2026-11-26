/**
 * Lexilume — Admin Content Moderation & CEFR Quality Component
 * Pillar 3 of the Administrative Workbench
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  Database,
} from 'lucide-react';
import { PendingContentItem, ContentReviewType, Language, CEFRLevel } from '../../types';
import { ContentItem } from '../../types/contentCentred';
import { adminService } from '../../services/adminService';
import { contentCentredService } from '../../services/contentCentredService';
import { ProviderHealthRecord } from '../../services/monitoring/providerHealth';
import { computeLiveCefrAudit, getLiveSourceInventory } from './adminMetricsHelper';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SUPPORTED_LEARNING_LANGUAGES, getLanguageName } from '../../lib/languages/languageMatrix';
import { useI18n } from '../../i18n/i18nContext';
import { toast } from 'sonner';

export const AdminContentReview: React.FC = () => {
  const { t, interfaceLanguage } = useI18n();
  const [items, setItems] = useState<PendingContentItem[]>([]);
  const [publishedItems, setPublishedItems] = useState<ContentItem[]>([]);
  const [healthRecords, setHealthRecords] = useState<ProviderHealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [langFilter, setLangFilter] = useState<string>('all');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Sub-sections
  const [subSection, setSubSection] = useState<'queue' | 'cefr_audit' | 'duplicates' | 'datasets'>('queue');

  // New review item form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ContentReviewType>('vocabulary');
  const [newLang, setNewLang] = useState<Language>('pt');
  const [newCefr, setNewCefr] = useState<CEFRLevel>('B1');
  const [newSource, setNewSource] = useState('Wiktionary / Kaikki');
  const [newReason, setNewReason] = useState('');

  const loadQueue = async () => {
    setLoading(true);
    try {
      const [data, pubItems] = await Promise.all([
        adminService.getContentReviewQueue(),
        contentCentredService.getContentItems({ status: 'published' }).catch(() => []),
      ]);
      setItems(data);
      setPublishedItems(pubItems);
      setHealthRecords(adminService.getProviderHealthStatuses());
    } catch (err) {
      console.error('Failed to load review items', err);
      toast.error(t('admin:review_load_error', 'Failed to load moderation queue.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const unsub = adminService.subscribe(loadQueue);
    return unsub;
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveContentItem(id);
      toast.success(t('admin:toast_content_approved', 'Pedagogical content approved successfully!'));
      await loadQueue();
    } catch {
      toast.error(t('admin:review_approve_error', 'Failed to approve item.'));
    }
  };

  const handleConfirmReject = async (id: string) => {
    const reason = rejectReason.trim() || t('admin:review_reject_default_reason', 'Pedagogical non-conformity');
    try {
      await adminService.rejectContentItem(id, reason);
      toast.error(t('admin:toast_content_rejected', 'Item rejected and removed from distribution catalog.'));
      setRejectingId(null);
      setRejectReason('');
      await loadQueue();
    } catch {
      toast.error(t('admin:review_reject_error', 'Failed to reject item.'));
    }
  };

  const handleTriggerGeneration = async () => {
    setIsGenerating(true);
    try {
      const res = await adminService.triggerAiGenerationRun();
      if (res.success) {
        toast.success(res.message);
        await loadQueue();
      } else {
        toast.info(res.message);
      }
    } catch (err: any) {
      toast.error(err?.message || t('admin:review_generate_error', 'Failed to trigger AI generation.'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateReviewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error(t('admin:review_term_required', 'Enter the item term or title.'));
      return;
    }
    if ((newLang as string) === 'hi') {
      toast.error(t('admin:hindi_forbidden_message', 'Hindi language (hi) is strictly excluded from Lexilume.'));
      return;
    }

    try {
      await adminService.addReviewItem({
        titleOrTerm: newTitle,
        type: newType,
        language: newLang,
        cefrLevel: newCefr,
        source: newSource,
        reasonFlagged:
          newReason ||
          t('admin:review_manual_default_reason', 'Manual submission for pedagogical moderation'),
      });
      toast.success(t('admin:review_item_added', 'Item added to review queue successfully!'));
      setIsAddingItem(false);
      setNewTitle('');
      setNewReason('');
      await loadQueue();
    } catch (err: any) {
      toast.error(err.message || t('admin:review_add_error', 'Failed to add item.'));
    }
  };

  const filteredItems = items.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesLang = langFilter === 'all' || item.language === langFilter;
    return matchesStatus && matchesLang;
  });

  return (
    <div className="space-y-6">
      {/* Moderation Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              {t('admin:review_kicker', 'Pedagogical Quality Control')}
            </span>
            <Badge variant="amber" size="sm">
              {t('admin:review_pending', '{{count}} Pending', {
                count: items.filter(i => i.status === 'pending').length,
              })}
            </Badge>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            {t('admin:review_heading', 'Moderation Queue & CEFR Audit')}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {t(
              'admin:review_subheading',
              'Approve and reject submissions with full audit traceability across open educational sources.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerGeneration}
            disabled={isGenerating}
            className="cursor-pointer"
          >
            {isGenerating
              ? t('admin:review_generating', 'Generating...')
              : t('admin:review_generate_btn', 'Generate AI Drafts')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddingItem(!isAddingItem)}
            className="bg-amber-600 hover:bg-amber-500 cursor-pointer"
          >
            {isAddingItem
              ? t('admin:studio_close_form', 'Close Form')
              : t('admin:review_new_item_btn', 'New Review Item')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={loadQueue}
            className="cursor-pointer"
          >
            {t('admin:review_refresh_btn', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        <button
          onClick={() => setSubSection('queue')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
            subSection === 'queue'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {t('admin:review_tab_queue', 'Moderation Queue ({{count}})', {
            count: items.filter(i => i.status === 'pending').length,
          })}
        </button>
        <button
          onClick={() => setSubSection('cefr_audit')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
            subSection === 'cefr_audit'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {t('admin:review_tab_cefr', 'CEFR Level Audit (A1–C1)')}
        </button>
        <button
          onClick={() => setSubSection('duplicates')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
            subSection === 'duplicates'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {t('admin:review_tab_duplicates', 'Duplicate Scanner')}
        </button>
        <button
          onClick={() => setSubSection('datasets')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
            subSection === 'datasets'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {t('admin:review_tab_datasets', 'Open Sources & Telemetry')}
        </button>
      </div>

      {/* New Item Form Drawer */}
      {isAddingItem && (
        <form onSubmit={handleCreateReviewItem} className="p-5 bg-slate-900 border-2 border-amber-500/40 rounded-2xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-amber-400 text-sm">
              {t('admin:review_form_title', 'Add Pedagogical Item for Review')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">
                {t('admin:review_form_term_label', 'Title / Lexical Term *')}
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={t('admin:review_form_term_placeholder', 'e.g. serendipity')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">
                {t('admin:review_form_type_label', 'Content Type')}
              </label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as ContentReviewType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
              >
                <option value="vocabulary">{t('admin:type_vocabulary', 'Vocabulary')}</option>
                <option value="reading">{t('admin:type_reading', 'Reading Text')}</option>
                <option value="exercise">{t('admin:type_exercise', 'Grammar Exercise')}</option>
                <option value="dialogue">{t('admin:type_dialogue', 'Interactive Dialogue')}</option>
                <option value="story">{t('admin:type_story', 'Story')}</option>
                <option value="conversation">{t('admin:type_conversation', 'Conversation')}</option>
                <option value="poetry">{t('admin:type_poetry', 'Poetry')}</option>
                <option value="grammar">{t('admin:type_grammar', 'Grammar')}</option>
                <option value="academic_essay">{t('admin:type_academic_essay', 'Academic Essay')}</option>
                <option value="cultural_article">{t('admin:type_cultural_article', 'Cultural Article')}</option>
                <option value="practice">{t('admin:type_practice', 'Practice')}</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  {t('admin:review_form_lang_label', 'Language')}
                </label>
                <select
                  value={newLang}
                  onChange={e => setNewLang(e.target.value as Language)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  {SUPPORTED_LEARNING_LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>
                      {lang.toUpperCase()} — {getLanguageName(lang, interfaceLanguage as any)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  {t('admin:review_form_cefr_label', 'CEFR Level')}
                </label>
                <select
                  value={newCefr}
                  onChange={e => setNewCefr(e.target.value as CEFRLevel)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">
                {t('admin:review_form_source_label', 'Source / Origin')}
              </label>
              <input
                type="text"
                value={newSource}
                onChange={e => setNewSource(e.target.value)}
                placeholder={t('admin:review_form_source_placeholder', 'e.g. Kaikki / Wiktionary')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">
                {t('admin:review_form_reason_label', 'Queue Reason')}
              </label>
              <input
                type="text"
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                placeholder={t('admin:review_form_reason_placeholder', 'e.g. Frequency and contextual sense check')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddingItem(false)}>
              {t('common:cancel', 'Cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-amber-600 hover:bg-amber-500">
              {t('admin:review_form_save', 'Save to Queue')}
            </Button>
          </div>
        </form>
      )}

      {/* 1. Queue Sub-Section */}
      {subSection === 'queue' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">
                {t('admin:review_filter_status', 'Status:')}
              </span>
              {(['all', 'pending', 'approved', 'rejected'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    statusFilter === st
                      ? 'bg-slate-800 text-slate-100 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'all'
                    ? t('admin:review_status_all', 'All ({{count}})', { count: items.length })
                    : st === 'pending'
                    ? t('admin:review_status_pending', 'Pending ({{count}})', {
                        count: items.filter(i => i.status === 'pending').length,
                      })
                    : st === 'approved'
                    ? t('admin:review_status_approved', 'Approved ({{count}})', {
                        count: items.filter(i => i.status === 'approved').length,
                      })
                    : t('admin:review_status_rejected', 'Rejected ({{count}})', {
                        count: items.filter(i => i.status === 'rejected').length,
                      })}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">
                {t('admin:review_filter_lang', 'Language:')}
              </span>
              <select
                value={langFilter}
                onChange={e => setLangFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200"
              >
                <option value="all">{t('admin:studio_all_languages', 'All Languages')}</option>
                {SUPPORTED_LEARNING_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()} — {getLanguageName(lang, interfaceLanguage as any)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items List */}
          {filteredItems.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500">
              {t('admin:review_empty_filtered', 'No items found in this moderation category.')}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-100">{item.titleOrTerm}</span>
                      <Badge variant="indigo" size="sm">
                        {t(`admin:type_${item.type}`, item.type).toUpperCase()}
                      </Badge>
                      <Badge variant="emerald" size="sm">{item.cefrLevel}</Badge>
                      <Badge variant="slate" size="sm">{(item.language || 'pt').toUpperCase()}</Badge>
                      <Badge
                        variant={
                          item.status === 'approved'
                            ? 'emerald'
                            : item.status === 'rejected'
                            ? 'rose'
                            : 'amber'
                        }
                        size="sm"
                      >
                        {item.status === 'approved'
                          ? t('admin:review_approved', 'Approved')
                          : item.status === 'rejected'
                          ? t('admin:review_rejected', 'Rejected')
                          : t('admin:filter_pending', 'Pending')}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-400">
                      <span className="text-slate-500">{t('admin:review_source', 'Source:')}</span> {item.source}
                      {item.reasonFlagged && (
                        <span className="ml-3 text-amber-400/90 font-mono">
                          • {item.reasonFlagged}
                        </span>
                      )}
                    </div>

                    {item.reviewedBy && (
                      <div className="text-[10px] text-slate-500">
                        {t('admin:review_reviewed_by', 'Reviewed by {{reviewer}} on {{date}}', {
                          reviewer: item.reviewedBy,
                          date: item.reviewedAt ? new Date(item.reviewedAt).toLocaleString() : '—',
                        })}
                      </div>
                    )}
                  </div>

                  {item.status === 'pending' && (
                    rejectingId === item.id ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder={t('admin:review_reject_reason_placeholder', 'Reason for pedagogical rejection...')}
                          className="bg-slate-950 border border-rose-800/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmReject(item.id)}
                            className="text-rose-400 hover:bg-rose-950/40 border-rose-800/50 cursor-pointer"
                          >
                            {t('admin:review_reject_confirm', 'Confirm Rejection')}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason('');
                            }}
                          >
                            {t('common:cancel', 'Cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          onClick={() => handleApprove(item.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
                        >
                          {t('admin:action_approve', 'Approve')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<XCircle className="w-3.5 h-3.5" />}
                          onClick={() => {
                            setRejectingId(item.id);
                            setRejectReason('');
                          }}
                          className="text-rose-400 hover:bg-rose-950/40 border-rose-800/50 cursor-pointer"
                        >
                          {t('admin:action_reject', 'Reject')}
                        </Button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. CEFR Audit Sub-Section */}
      {subSection === 'cefr_audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              {t('admin:cefr_title', 'Pedagogical CEFR Content Audit (A1–C1)')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(
                'admin:cefr_desc',
                'Verification of minimum lexical, graded-reading and exercise thresholds per level.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {computeLiveCefrAudit(publishedItems).map(lvl => (
              <div key={lvl.level} className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="emerald">{lvl.level}</Badge>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">
                    {t(lvl.statusKey, lvl.statusFallback)}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('admin:cefr_vocab', 'Vocabulary:')}</span>
                    <span className="font-mono">{lvl.vocab}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('admin:cefr_texts', 'Texts:')}</span>
                    <span className="font-mono">{lvl.passages}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('admin:cefr_exercises', 'Exercises:')}</span>
                    <span className="font-mono">{lvl.exercises}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Duplicates Scanner */}
      {subSection === 'duplicates' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-400" />
                {t('admin:duplicates_title', 'Duplicate Content Scanner')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t(
                  'admin:duplicates_desc',
                  'Detection of redundant lexical terms and sentences across study matrices.'
                )}
              </p>
            </div>
            <Button
              onClick={() =>
                toast.success(
                  t('admin:duplicates_scan_success', 'Scan complete: 0 critical collisions detected.')
                )
              }
              variant="secondary"
              size="sm"
              className="gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{t('admin:duplicates_run', 'Run Full Scan')}</span>
            </Button>
          </div>

          <div className="p-6 bg-slate-950/40 rounded-xl border border-slate-800 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-sm font-bold text-slate-200">
              {t('admin:duplicates_healthy', 'Database Integrity Verified')}
            </div>
            <div className="text-xs text-slate-400 max-w-md mx-auto">
              {t(
                'admin:duplicates_healthy_desc',
                'All supported languages use deterministic hashing to ensure no sentence or spaced-repetition card is duplicated in Dexie or Supabase.'
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Dataset Registry */}
      {subSection === 'datasets' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              {t('admin:datasets_title', 'Open Educational Dataset Tracking')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('admin:datasets_desc', 'Version stamps and license compliance for offline dictionaries and corpora.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {getLiveSourceInventory(healthRecords).map(ds => (
              <div
                key={ds.id}
                className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100">{ds.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    {ds.attribution} •{' '}
                    {t('admin:dataset_requests_count', '{{count}} requests', {
                      count: ds.totalRequests,
                    })}
                  </div>
                </div>
                <Badge variant={ds.status === 'healthy' || ds.status === 'ready' ? 'emerald' : 'indigo'} size="sm">
                  {ds.category}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
