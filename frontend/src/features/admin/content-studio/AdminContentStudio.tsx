import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Sparkles,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  Search,
  Globe,
} from 'lucide-react';
import {
  ContentItem,
  ContentVersion,
  LearningActivity,
  ContentProcessingJob,
  ProcessingStageName,
} from '../../../types/contentCentred';
import { Language, CEFRLevel } from '../../../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { ContentImportForm } from './ContentImportForm';
import { PipelineJobMonitor } from './PipelineJobMonitor';
import { ContentReviewEditor } from './ContentReviewEditor';
import { contentCentredService } from '../../../services/contentCentredService';
import {
  contentPipelineService,
  PipelineExecutionInput,
} from '../../../services/contentPipelineService';
import { toast } from 'sonner';

export const AdminContentStudio: React.FC = () => {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'import' | 'monitor' | 'review'>('list');

  // Active working entities
  const [activeJob, setActiveJob] = useState<ContentProcessingJob | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ContentVersion | null>(null);
  const [selectedActivities, setSelectedActivities] = useState<LearningActivity[]>([]);

  // Filtering
  const [filterLang, setFilterLang] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadItems = async () => {
    setLoading(true);
    try {
      const all = await contentCentredService.getContentItems({});
      setItems(all);
    } catch (e) {
      console.warn('Error loading content items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Listen to pipeline events
  useEffect(() => {
    const unsub = contentPipelineService.subscribe(event => {
      if (activeJob && activeJob.id === event.jobId) {
        setActiveJob(prev => (prev ? { ...prev, current_stage: event.stage, stage_timings: event.timings } : null));
      }
    });
    return unsub;
  }, [activeJob]);

  const handleStartImport = async (input: PipelineExecutionInput) => {
    setActiveView('monitor');
    try {
      const result = await contentPipelineService.executePipeline(input);
      setActiveJob(result.job);
      setSelectedItem(result.item);
      setSelectedVersion(result.version);
      setSelectedActivities(result.activities);
      toast.success('Pipeline analysis completed! Ready for review.');
      await loadItems();
    } catch (err: any) {
      toast.error(err.message || 'Pipeline execution failed');
    }
  };

  const handleOpenReview = async (item: ContentItem) => {
    try {
      const full = await contentCentredService.getContentItemById(item.id);
      if (full && full.version) {
        const acts = await contentCentredService.getActivitiesForVersion(full.version.id);
        setSelectedItem(full);
        setSelectedVersion(full.version);
        setSelectedActivities(acts);
        setActiveView('review');
      } else {
        toast.error('Version not found for this item');
      }
    } catch (e) {
      toast.error('Failed to load version details');
    }
  };

  const handleRetryStage = async (jobId: string, stage: ProcessingStageName) => {
    try {
      const retried = await contentPipelineService.retryStage(jobId, stage);
      setActiveJob(retried);
      toast.success(`Stage ${stage} retried successfully.`);
    } catch (e: any) {
      toast.error(e.message || 'Retry failed');
    }
  };

  const filteredItems = items.filter(it => {
    if (filterLang !== 'all' && it.target_language !== filterLang) return false;
    if (filterStatus !== 'all' && it.status !== filterStatus) return false;
    if (searchQuery.trim() && !it.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Sub-Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-mono font-medium mb-1">
            <BookOpen className="w-3.5 h-3.5 text-stone-600" />
            <span>Content Publishing Studio</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            Editorial Pipeline & Catalog
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Ingest authentic materials, review linguistic segmentations, and publish high-quality reading content for learners.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeView !== 'list' && (
            <Button variant="ghost" size="sm" onClick={() => setActiveView('list')}>
              Catalog View
            </Button>
          )}
          {activeView !== 'import' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setActiveView('import')}
            >
              Import New Content
            </Button>
          )}
        </div>
      </div>

      {/* View: Import */}
      {activeView === 'import' && (
        <ContentImportForm
          isProcessing={false}
          onSubmit={handleStartImport}
        />
      )}

      {/* View: Monitor */}
      {activeView === 'monitor' && activeJob && (
        <PipelineJobMonitor
          job={activeJob}
          onRetryStage={handleRetryStage}
          onViewReview={() => setActiveView('review')}
        />
      )}

      {/* View: Review Editor */}
      {activeView === 'review' && selectedItem && selectedVersion && (
        <ContentReviewEditor
          item={selectedItem}
          version={selectedVersion}
          activities={selectedActivities}
          onBack={() => setActiveView('list')}
          onPublished={() => {
            setActiveView('list');
            loadItems();
          }}
        />
      )}

      {/* View: Catalog List */}
      {activeView === 'list' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search content titles..."
                className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterLang}
                onChange={e => setFilterLang(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-400 focus:bg-white"
              >
                <option value="all">All Languages</option>
                <option value="en">English (en)</option>
                <option value="pt">Portuguese (pt)</option>
                <option value="es">Spanish (es)</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-400 focus:bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="review_required">Review Required</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Items Table */}
          {filteredItems.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-16 text-center space-y-3 shadow-sm">
              <FileText className="w-8 h-8 text-stone-400 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-stone-800">No Content Items Found</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
                No articles match your active filter. Click "Import New Content" to analyze and publish your first text.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white border border-stone-200 hover:border-stone-300 rounded-xl p-5 flex flex-col justify-between transition-all shadow-sm group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant={item.status === 'published' ? 'emerald' : item.status === 'review_required' ? 'amber' : 'slate'}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="slate">{item.target_language.toUpperCase()}</Badge>
                        <Badge variant="slate">{item.primary_cefr}</Badge>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif text-base font-bold text-stone-900 group-hover:text-stone-700 transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.summary || 'Authentic educational narrative.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 mt-4 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-stone-500">
                      ~{item.estimated_read_minutes} min read
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenReview(item)}
                    >
                      Review & Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
