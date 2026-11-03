import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Languages,
  HelpCircle,
  Edit3,
  Save,
  Globe,
  Layers,
  Shield,
  Eye,
  ArrowLeft,
} from 'lucide-react';
import {
  ContentItem,
  ContentVersion,
  LearningActivity,
  LexicalAnnotation,
  GrammarPoint,
  ActivityQuestion,
} from '../../../types/contentCentred';
import { ExplanationLanguage } from '../../../types';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { contentCentredService } from '../../../services/contentCentredService';
import { toast } from 'sonner';

interface ContentReviewEditorProps {
  item: ContentItem;
  version: ContentVersion;
  activities: LearningActivity[];
  onBack: () => void;
  onPublished: () => void;
}

export const ContentReviewEditor: React.FC<ContentReviewEditorProps> = ({
  item,
  version: initialVersion,
  activities: initialActivities,
  onBack,
  onPublished,
}) => {
  const [version, setVersion] = useState<ContentVersion>(initialVersion);
  const [activities, setActivities] = useState<LearningActivity[]>(initialActivities);
  const [activeTab, setActiveTab] = useState<'text' | 'vocabulary' | 'grammar' | 'activities'>('text');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const payload = version.structured_payload;
  const isAlreadyPublished = version.is_published;

  // Edit sentence translation
  const handleUpdateTranslation = (pIdx: number, sIdx: number, lang: string, newTrans: string) => {
    const updatedParas = [...payload.paragraphs];
    const targetSentence = updatedParas[pIdx].sentences[sIdx];
    if (!targetSentence.translations) targetSentence.translations = {};
    targetSentence.translations[lang as ExplanationLanguage] = newTrans;

    setVersion({
      ...version,
      structured_payload: {
        ...payload,
        paragraphs: updatedParas,
      },
    });
  };

  // Edit vocabulary annotation
  const handleUpdateAnnotation = (glossId: string, field: keyof LexicalAnnotation, val: any) => {
    const updated = { ...payload.annotations };
    if (updated[glossId]) {
      updated[glossId] = { ...updated[glossId], [field]: val };
      setVersion({
        ...version,
        structured_payload: {
          ...payload,
          annotations: updated,
        },
      });
    }
  };

  // Edit activity question
  const handleUpdateQuestion = (actIdx: number, qIdx: number, field: keyof ActivityQuestion, val: any) => {
    const updatedActs = [...activities];
    const questions = updatedActs[actIdx].configuration.questions;
    questions[qIdx] = { ...questions[qIdx], [field]: val };
    setActivities(updatedActs);
  };

  // Save changes (creates a new version if already published)
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isAlreadyPublished) {
        // Enforce immutability: create new version edition
        const newVer = await contentCentredService.saveContentVersion({
          content_item_id: item.id,
          version_number: version.version_number + 1,
          cefr_level: version.cefr_level,
          structured_payload: version.structured_payload,
          is_published: false,
          change_summary: `Editorial revision from v${version.version_number}`,
        });
        setVersion(newVer);
        toast.info(`Published version was immutable. Created draft edition v${newVer.version_number}.`);
      } else {
        const savedVer = await contentCentredService.saveContentVersion(version);
        setVersion(savedVer);
        toast.success('Draft version updated successfully.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error saving version');
    } finally {
      setIsSaving(false);
    }
  };

  // Approve & Publish
  const handlePublish = async () => {
    if (item.rights_status === 'restricted' || item.rights_status === 'unknown') {
      toast.error('Cannot publish content with Restricted or Unknown rights. Please confirm licensing first.');
      return;
    }

    setIsPublishing(true);
    try {
      await contentCentredService.publishContentVersion(item.id, version.id);
      toast.success(`Published immutable version v${version.version_number} successfully!`);
      onPublished();
    } catch (err: any) {
      toast.error(err.message || 'Publication failed');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-stone-900">{item.title}</h2>
              <Badge variant={version.is_published ? 'emerald' : 'amber'}>
                {version.is_published ? `PUBLISHED (v${version.version_number})` : `DRAFT (v${version.version_number})`}
              </Badge>
              <Badge variant="slate">{item.target_language.toUpperCase()}</Badge>
              <Badge variant="slate">{version.cefr_level}</Badge>
            </div>
            <p className="font-mono text-xs text-stone-500 mt-1">
              Target: <span className="text-stone-800 font-semibold">{item.target_language}</span> | Explanation: <span className="text-stone-800 font-semibold">{item.explanation_language}</span> | Rights: <span className="text-stone-800 font-semibold">{item.rights_status}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isSaving}
            icon={<Save className="w-4 h-4" />}
            onClick={handleSave}
          >
            {isSaving ? 'Saving...' : isAlreadyPublished ? 'Save as New Edition' : 'Save Draft'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isPublishing}
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={handlePublish}
          >
            {isPublishing ? 'Publishing...' : 'Approve & Publish'}
          </Button>
        </div>
      </div>

      {isAlreadyPublished && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
          <span>
            This content edition is published and immutable. Any edits saved will automatically generate a new draft edition without mutating historical learner attempts.
          </span>
        </div>
      )}

      {/* Editor Sub-Navigation Tabs */}
      <div className="flex border-b border-stone-200 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'text'
              ? 'bg-stone-100 text-stone-900 border-b-2 border-stone-900 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Paragraphs & Sentences ({payload.paragraphs.length})
        </button>
        <button
          onClick={() => setActiveTab('vocabulary')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'vocabulary'
              ? 'bg-stone-100 text-stone-900 border-b-2 border-stone-900 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Extracted Vocabulary ({Object.keys(payload.annotations).length})
        </button>
        <button
          onClick={() => setActiveTab('grammar')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'grammar'
              ? 'bg-stone-100 text-stone-900 border-b-2 border-stone-900 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Grammar Points ({payload.grammar_points.length})
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'activities'
              ? 'bg-stone-100 text-stone-900 border-b-2 border-stone-900 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Comprehension Activities ({activities.reduce((sum, a) => sum + a.configuration.questions.length, 0)} Questions)
        </button>
      </div>

      {/* Tab 1: Paragraphs & Sentences */}
      {activeTab === 'text' && (
        <div className="space-y-4">
          {payload.paragraphs.map((p, pIdx) => (
            <div key={p.id} className="p-5 bg-stone-50/70 border border-stone-200 rounded-xl space-y-3">
              <span className="font-mono text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                Paragraph {pIdx + 1}
              </span>
              <div className="space-y-3">
                {p.sentences.map((s, sIdx) => (
                  <div key={s.id} className="p-4 bg-white border border-stone-200 rounded-lg space-y-2.5 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-serif text-sm font-semibold text-stone-900">{s.text}</p>
                      <span className="font-mono text-[10px] text-stone-400 shrink-0">{s.id}</span>
                    </div>

                    {/* Sentence translation editor */}
                    <div className="pt-1">
                      <label className="block font-mono text-[11px] font-semibold text-stone-600 mb-1">
                        Translation ({item.explanation_language.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={s.translations?.[item.explanation_language] || ''}
                        onChange={e =>
                          handleUpdateTranslation(pIdx, sIdx, item.explanation_language, e.target.value)
                        }
                        className="w-full bg-stone-50 border border-stone-300 rounded-lg px-3 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500 font-medium"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Vocabulary Annotations */}
      {activeTab === 'vocabulary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.values(payload.annotations).map(annot => (
            <div key={annot.id} className="p-5 bg-stone-50/70 border border-stone-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-serif text-base font-bold text-stone-900">{annot.term}</span>
                  <span className="font-mono text-xs text-stone-500 ml-2">({annot.pos})</span>
                </div>
                <Badge variant="slate">{annot.cefr || 'B1'}</Badge>
              </div>

              <div>
                <label className="block font-mono text-[11px] font-semibold text-stone-600 mb-1">Contextual Meaning</label>
                <textarea
                  rows={2}
                  value={annot.contextual_meaning}
                  onChange={e => handleUpdateAnnotation(annot.id, 'contextual_meaning', e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-lg p-2.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] font-semibold text-stone-600 mb-1">
                  Context Translation ({item.explanation_language.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={annot.context_translation?.[item.explanation_language] || ''}
                  onChange={e => {
                    const nextTrans = { ...annot.context_translation, [item.explanation_language]: e.target.value };
                    handleUpdateAnnotation(annot.id, 'context_translation', nextTrans);
                  }}
                  className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Grammar Points */}
      {activeTab === 'grammar' && (
        <div className="space-y-4">
          {payload.grammar_points.map(gp => (
            <div key={gp.id} className="p-5 bg-stone-50/70 border border-stone-200 rounded-xl space-y-2">
              <h3 className="font-serif text-sm font-bold text-stone-900">{gp.title}</h3>
              <p className="text-xs text-stone-700 leading-relaxed">{gp.explanation_summary}</p>
              {gp.explanations?.[item.explanation_language] && (
                <p className="font-serif text-xs text-stone-600 italic border-l-2 border-stone-300 pl-3 py-0.5">
                  {gp.explanations[item.explanation_language]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Generated Activities */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          {activities.map((act, actIdx) => (
            <div key={act.id} className="space-y-3">
              {act.configuration.questions.map((q, qIdx) => (
                <div key={q.id} className="p-5 bg-stone-50/70 border border-stone-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-stone-700 uppercase">
                      Question {qIdx + 1} ({q.type})
                    </span>
                    <Badge variant="slate">{act.activity_title}</Badge>
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] font-semibold text-stone-600 mb-1">Prompt / Question Stem</label>
                    <input
                      type="text"
                      value={q.stem}
                      onChange={e => handleUpdateQuestion(actIdx, qIdx, 'stem', e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] font-semibold text-stone-600 mb-1">Correct Answer</label>
                    <input
                      type="text"
                      value={q.correct_answer}
                      onChange={e => handleUpdateQuestion(actIdx, qIdx, 'correct_answer', e.target.value)}
                      className="w-full bg-white border border-emerald-400 rounded-lg px-3 py-2 text-xs text-emerald-950 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[11px] font-semibold text-stone-600 mb-1">Pedagogical Explanation</label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={e => handleUpdateQuestion(actIdx, qIdx, 'explanation', e.target.value)}
                      className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs text-stone-700 font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
