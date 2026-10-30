import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  Sparkles,
  Calendar,
  Lock,
  Server,
  Database,
  Activity,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Language, UserTrackState, DiagnosticResult } from '../types';
import { ptCurriculum, esCurriculum, enCurriculum } from '../data/seedData';
import { StorageService } from '../services/storage';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ProgressBar } from '../components/common/ProgressBar';
import { PlacementTestModal } from '../components/diagnostic/PlacementTestModal';
import { useI18n } from '../i18n/i18nContext';
import { toast } from 'sonner';

export const ProgressPage: React.FC = () => {
  const { t } = useI18n();
  const [selectedLang, setSelectedLang] = useState<Language>('pt');
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const track: UserTrackState = StorageService.getTrackState(selectedLang);
  const curriculum =
    selectedLang === 'pt'
      ? ptCurriculum
      : selectedLang === 'es'
      ? esCurriculum
      : enCurriculum;
  const attempts = StorageService.getExerciseAttempts();
  const srsItems = StorageService.getSRSItems(selectedLang);
  const diagnostics = StorageService.getDiagnosticResults().filter(d => d.language === selectedLang);

  // Real computed metrics (Zero fake statistics)
  const totalCompleted = track.completed_curriculum_node_ids.length;
  const totalCurriculumNodes = curriculum.length;
  const completionPct = Math.round((totalCompleted / totalCurriculumNodes) * 100);

  const correctAttempts = attempts.filter(a => a.is_correct).length;
  const accuracyPct = attempts.length > 0 ? Math.round((correctAttempts / attempts.length) * 100) : 0;

  // Real SRS distribution
  const presentedCount = srsItems.filter(s => s.mastery_status === 'presented').length;
  const learningCount = srsItems.filter(s => s.mastery_status === 'learning').length;
  const reviewingCount = srsItems.filter(s => s.mastery_status === 'reviewing').length;
  const masteredCount = srsItems.filter(s => s.mastery_status === 'mastered').length;

  // Weak areas: failed attempts
  const failedAttempts = attempts.filter(a => !a.is_correct).slice(0, 5);

  // Requirement: Do not show a C1 badge without real assessment evidence
  const hasDemonstratedC1 = diagnostics.some(d => d.recommended_cefr_level === 'C1') &&
    track.current_cefr_level === 'C1' &&
    totalCompleted >= totalCurriculumNodes;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Track Toggle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {t('navigation:nav_progress', 'Progresso')}
            </span>
            <Badge variant="indigo" size="sm">
              {track.current_cefr_level}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{t('navigation:nav_progress', 'Progresso')} & {t('dashboard:recent_activity_title', 'Desempenho')}</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {t('dashboard:accuracy_rate', 'Estatísticas')}: SuperMemo SM-2 & CEFR.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setSelectedLang('pt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedLang === 'pt'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Português
            </button>
            <button
              onClick={() => setSelectedLang('es')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedLang === 'es'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Español
            </button>
            <button
              onClick={() => setSelectedLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedLang === 'en'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
          </div>

          <Button
            variant="outline"
            size="md"
            icon={<Award className="w-4 h-4 text-indigo-400" />}
            onClick={() => setIsDiagnosticOpen(true)}
          >
            {t('common:details', 'Diagnóstico')}
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Nível CEFR</span>
            <Badge variant="emerald" size="sm">{track.current_cefr_level}</Badge>
          </div>
          <div className="text-2xl font-extrabold text-slate-100 mt-2">{track.current_cefr_level}</div>
          <p className="text-[11px] text-slate-400 mt-1">Alvo configurado: {track.target_cefr_level}</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Currículo</span>
            <span className="text-xs font-bold text-slate-300">{totalCompleted} / {totalCurriculumNodes}</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-100 mt-2">{completionPct}%</div>
          <ProgressBar progress={completionPct} className="mt-2" variant="indigo" />
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Acurácia Exercícios</span>
            <span className="text-xs font-bold text-slate-300">{correctAttempts} / {attempts.length}</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-100 mt-2">{accuracyPct}%</div>
          <p className="text-[11px] text-slate-400 mt-1">Baseado em tentativas reais</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Certificação C1</span>
            {hasDemonstratedC1 ? (
              <Badge variant="emerald" size="sm">Atestado</Badge>
            ) : (
              <Badge variant="slate" size="sm">Em Curso</Badge>
            )}
          </div>
          <div className="text-sm font-bold text-slate-200 mt-2">
            {hasDemonstratedC1 ? 'Atestado C1 Pleno' : 'Requer Prova C1'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {hasDemonstratedC1
              ? 'Conclusão curricular com evidência diagnóstica.'
              : 'Conclua os nós C1 e o teste de nivelamento.'}
          </p>
        </Card>
      </div>

      {/* Vocabulary Retention SM-2 Breakdown */}
      <Card
        title="Distribuição do Léxico por Estágio SM-2"
        subtitle="Diferenciação pedagógica obrigatória entre conteúdo meramente apresentado e conteúdo consolidado"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-slate-400 block font-semibold">1. Apresentados</span>
            <span className="text-xl font-bold text-slate-200 mt-1 block">{presentedCount}</span>
            <span className="text-[10px] text-slate-500">Expostos na lição</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-indigo-300 block font-semibold">2. Aprendendo</span>
            <span className="text-xl font-bold text-indigo-400 mt-1 block">{learningCount}</span>
            <span className="text-[10px] text-slate-500">1-2 repetições</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-sky-300 block font-semibold">3. Revisando</span>
            <span className="text-xl font-bold text-sky-400 mt-1 block">{reviewingCount}</span>
            <span className="text-[10px] text-slate-500">3-4 repetições</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-xs text-emerald-300 block font-semibold">4. Dominados</span>
            <span className="text-xl font-bold text-emerald-400 mt-1 block">{masteredCount}</span>
            <span className="text-[10px] text-slate-500">≥5 recalls / ≥21 dias</span>
          </div>
        </div>
      </Card>

      {/* Curriculum Roadmap Tree */}
      <Card
        title={`Matriz de Progressão Curricular (${selectedLang.toUpperCase()})`}
        subtitle="Nós de competência sequenciais de A1 a C1 com requisitos de desbloqueio"
      >
        <div className="space-y-3">
          {curriculum.map((node, idx) => {
            const isCompleted = track.completed_curriculum_node_ids.includes(node.id);
            const isCurrent = track.current_curriculum_node_id === node.id || (!isCompleted && idx === 0);

            return (
              <div
                key={node.id}
                className={`flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-800/40'
                    : isCurrent
                    ? 'bg-indigo-950/30 border-indigo-700/60'
                    : 'bg-slate-800/40 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : isCurrent ? (
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-200">{node.title}</span>
                      <Badge variant={node.cefr_level === 'C1' ? 'emerald' : 'sky'} size="sm">
                        {node.cefr_level}
                      </Badge>
                      {node.is_consolidation_review && (
                        <Badge variant="amber" size="sm">Consolidação</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{node.can_do_statement}</p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] font-mono text-slate-400">
                    {isCompleted ? t('common:completed', 'Concluído') : isCurrent ? t('common:active', 'Em Curso') : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Weak Areas & Error Diagnostics */}
      {failedAttempts.length > 0 && (
        <Card
          title="Pontos de Atenção e Erros Recentes"
          subtitle="Exercícios onde foram registradas incorreções para revisão direcionada"
        >
          <div className="space-y-2.5">
            {failedAttempts.map(att => (
              <div
                key={att.id}
                className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-xs flex justify-between items-center gap-2"
              >
                <div>
                  <span className="font-semibold text-rose-400 block">Resposta: "{att.submitted_answer}"</span>
                  <span className="text-slate-300 text-[11px]">{att.feedback}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(att.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Placement Test Modal */}
      <PlacementTestModal
        language={selectedLang}
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        onComplete={() => {
          setIsDiagnosticOpen(false);
        }}
      />
    </div>
  );
};
