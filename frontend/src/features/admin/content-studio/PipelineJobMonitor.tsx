import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ContentProcessingJob, ProcessingStageName } from '../../../types/contentCentred';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';

interface PipelineJobMonitorProps {
  job: ContentProcessingJob;
  onRetryStage: (jobId: string, stage: ProcessingStageName) => Promise<void>;
  onViewReview: () => void;
}

const STAGES: Array<{ name: ProcessingStageName; label: string; desc: string }> = [
  { name: 'stage_0_intake', label: '1. Intake & Validation', desc: 'Sanitizes text and verifies word boundaries' },
  { name: 'stage_1_detect_lang', label: '2. Language Detection', desc: 'Deterministic stop-word and n-gram verification' },
  { name: 'stage_2_classify', label: '3. Classification & CEFR', desc: 'Computes lexical density and average sentence length' },
  { name: 'stage_3_segment', label: '4. Text Segmentation', desc: 'Splits paragraphs, sentences and word-level tokens' },
  { name: 'stage_4_translate', label: '5. Contextual Translation', desc: 'Generates explanation language sentence alignments' },
  { name: 'stage_5_extract_lexicon', label: '6. Lexicon Extraction', desc: 'Extracts lemmas, parts of speech, and contextual meanings' },
  { name: 'stage_6_extract_grammar', label: '7. Grammar Identification', desc: 'Analyzes syntactic patterns and clause connectors' },
  { name: 'stage_7_generate_activities', label: '8. Activity Generation', desc: 'Creates comprehension questions and vocabulary checks' },
  { name: 'stage_8_validate', label: '9. Structural Validation', desc: 'Verifies pedagogical integrity and payload schema' },
];

export const PipelineJobMonitor: React.FC<PipelineJobMonitorProps> = ({
  job,
  onRetryStage,
  onViewReview,
}) => {
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Pipeline Processing Telemetry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Job ID: <span className="font-mono text-slate-300">{job.id}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              isCompleted ? 'emerald' : isFailed ? 'rose' : 'indigo'
            }
          >
            {job.status.toUpperCase()}
          </Badge>
          {isCompleted && (
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight className="w-4 h-4" />}
              onClick={onViewReview}
            >
              Review & Publish
            </Button>
          )}
        </div>
      </div>

      {isFailed && job.error_message && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Pipeline Execution Halted</p>
            <p className="text-rose-200/90 font-mono text-[11px]">{job.error_message}</p>
          </div>
        </div>
      )}

      {/* Stage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {STAGES.map((s, idx) => {
          const isDone = job.stages_completed.includes(s.name);
          const isCurrent = job.current_stage === s.name && job.status === 'running';
          const isStageFailed = isFailed && job.current_stage === s.name;
          const timingMs = job.stage_timings[s.name];

          return (
            <div
              key={s.name}
              className={`p-3.5 rounded-xl border transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-800/50 text-slate-200'
                  : isCurrent
                  ? 'bg-indigo-950/30 border-indigo-700/70 text-indigo-200 animate-pulse'
                  : isStageFailed
                  ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                  : 'bg-slate-950/50 border-slate-800/60 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : isStageFailed ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  {s.label}
                </span>
                {timingMs !== undefined && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {timingMs}ms
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                {s.desc}
              </p>

              {isStageFailed && (
                <div className="mt-2.5 pt-2 border-t border-rose-900/40 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => onRetryStage(job.id, s.name)}
                  >
                    Retry Stage
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
