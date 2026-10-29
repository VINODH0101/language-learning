import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Volume2,
  FileText,
  MessageSquare,
  Mic,
  PenTool,
  Headphones,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Award,
} from 'lucide-react';
import { DailyLessonPayload } from '../types';
import { ClientLessonGenerator } from '../services/lessonGenerator';
import { StorageService } from '../services/storage';
import { courseService } from '../services/courseService';
import { VocabularySection } from '../components/lesson/VocabularySection';
import { GrammarSection } from '../components/lesson/GrammarSection';
import { ReadingSection } from '../components/lesson/ReadingSection';
import { ConversationSection } from '../components/lesson/ConversationSection';
import { SpeakingSection } from '../components/lesson/SpeakingSection';
import { WritingSection } from '../components/lesson/WritingSection';
import { ListeningSection } from '../components/lesson/ListeningSection';
import { ExerciseSection } from '../components/lesson/ExerciseSection';
import { FalseFriendCard } from '../components/lesson/FalseFriendCard';
import { ScenariosSection } from '../components/lesson/ScenariosSection';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { getActiveProgress, saveActiveProgress, clearActiveProgress } from '../services/localDb';
import { toast } from 'sonner';

type SectionTab =
  | 'vocab'
  | 'grammar'
  | 'reading'
  | 'conv'
  | 'speaking'
  | 'writing'
  | 'listening'
  | 'exercises'
  | 'false_friends'
  | 'resources';

export const SpanishPage: React.FC = () => {
  const [lesson, setLesson] = useState<DailyLessonPayload | null>(null);
  const [activeTab, setActiveTab] = useState<SectionTab>('vocab');
  const [convView, setConvView] = useState<'daily' | 'scenarios'>('daily');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const esCourse = courseService.getCourseForLanguage('es');
    const generated = ClientLessonGenerator.generateOrGetLesson(
      esCourse ? courseService.toCourseConfig(esCourse) : 'es',
      today
    );
    setLesson(generated);

    const track = StorageService.getTrackState('es');
    if (track.completed_curriculum_node_ids.includes(generated.curriculum_node_id)) {
      setIsCompleted(true);
    }

    getActiveProgress('es').then(saved => {
      if (saved && saved.lesson_date === today && saved.selected_tab) {
        setActiveTab(saved.selected_tab as SectionTab);
      }
    });
  }, []);

  if (!lesson) {
    return <div className="p-8 text-center text-slate-400">Cargando lección de español...</div>;
  }

  const handleSelectTab = (tab: SectionTab) => {
    setActiveTab(tab);
    if (lesson) {
      saveActiveProgress({
        id: 'es',
        language: 'es',
        curriculum_node_id: lesson.curriculum_node_id,
        lesson_date: lesson.lesson_date,
        selected_tab: tab,
        exercise_answers: {},
        completed_sections: [],
        updated_at: new Date().toISOString(),
      });
    }
  };

  const handleMarkComplete = () => {
    const track = StorageService.getTrackState('es');
    if (!track.completed_curriculum_node_ids.includes(lesson.curriculum_node_id)) {
      track.completed_curriculum_node_ids.push(lesson.curriculum_node_id);
      track.total_lessons_completed += 1;
      track.streak_days += 1;
      track.last_lesson_date = new Date().toISOString().split('T')[0];
      StorageService.saveTrackState(track);
    }
    clearActiveProgress('es');
    setIsCompleted(true);
    toast.success('¡Felicitaciones! ¡Lección de Español C1 completada!');
  };

  const navItems: Array<{ id: SectionTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'vocab', label: '1. Vocabulario', icon: <BookOpen className="w-4 h-4" />, count: lesson.section_2_vocabulary.length },
    { id: 'grammar', label: '2. Gramática', icon: <FileText className="w-4 h-4" /> },
    { id: 'reading', label: '3. Lectura', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'conv', label: '4. Conversación', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'speaking', label: '5. Expresión Oral', icon: <Mic className="w-4 h-4" /> },
    { id: 'writing', label: '6. Redacción', icon: <PenTool className="w-4 h-4" /> },
    { id: 'listening', label: '7. Audición', icon: <Headphones className="w-4 h-4" /> },
    { id: 'exercises', label: '8. Ejercicios', icon: <CheckCircle className="w-4 h-4 text-amber-400" />, count: lesson.section_9_exercises.length },
    { id: 'false_friends', label: '9. Falsos Amigos', icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
    { id: 'resources', label: '10. Recursos', icon: <ExternalLink className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="amber" size="sm">
              Español C1
            </Badge>
            <Badge variant="slate" size="sm">
              Variedad {lesson.regional_variety}
            </Badge>
            {lesson.explanation_language && (
              <Badge variant="amber" size="sm">
                Explicaciones: {lesson.explanation_language.toUpperCase()}
              </Badge>
            )}
            <span className="text-xs text-slate-400 font-mono">
              Fecha: {lesson.lesson_date} • {lesson.estimated_study_minutes} min
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">{lesson.curriculum_topic_title}</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {lesson.section_1_objectives[0]?.can_do_statement}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <Button
            variant={isCompleted ? 'secondary' : 'primary'}
            size="md"
            className={!isCompleted ? 'bg-amber-600 hover:bg-amber-700' : ''}
            icon={isCompleted ? <CheckCircle className="w-4 h-4 text-amber-400" /> : <Award className="w-4 h-4" />}
            onClick={handleMarkComplete}
            disabled={isCompleted}
          >
            {isCompleted ? '¡Lección Completada!' : 'Marcar Lección de Hoy'}
          </Button>
        </div>
      </div>

      {/* Sub-Nav Pill Scroller */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 no-scrollbar">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 text-slate-300">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="pt-2">
        {activeTab === 'vocab' && (
          <VocabularySection
            vocabulary={lesson.section_2_vocabulary}
            language="es"
            variety={lesson.regional_variety}
          />
        )}

        {activeTab === 'grammar' && (
          <GrammarSection
            grammar={lesson.section_3_grammar}
            language="es"
            variety={lesson.regional_variety}
          />
        )}

        {activeTab === 'reading' && (
          <ReadingSection
            reading={lesson.section_4_reading}
            language="es"
            variety={lesson.regional_variety}
          />
        )}

        {activeTab === 'conv' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 w-fit">
              <button
                onClick={() => setConvView('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  convView === 'daily'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Diálogo de la Lección
              </button>
              <button
                onClick={() => setConvView('scenarios')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition ${
                  convView === 'scenarios'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Escenarios del Mundo Real (Viaje, Reunión, Restaurante)
              </button>
            </div>
            {convView === 'daily' ? (
              <ConversationSection
                conversation={lesson.section_5_conversation}
                language="es"
                variety={lesson.regional_variety}
              />
            ) : (
              <ScenariosSection language="es" variety={lesson.regional_variety} />
            )}
          </div>
        )}

        {activeTab === 'speaking' && (
          <SpeakingSection
            speaking={lesson.section_6_speaking}
            language="es"
            variety={lesson.regional_variety}
          />
        )}

        {activeTab === 'writing' && (
          <WritingSection
            writing={lesson.section_7_writing}
            language="es"
          />
        )}

        {activeTab === 'listening' && (
          <ListeningSection
            listening={lesson.section_8_listening}
            language="es"
            variety={lesson.regional_variety}
          />
        )}

        {activeTab === 'exercises' && (
          <ExerciseSection
            exercises={lesson.section_9_exercises}
            answerKeys={lesson.section_10_answer_keys}
            language="es"
          />
        )}

        {activeTab === 'false_friends' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200">
                Interferencia Lingüística: Falsos Amigos Críticos entre Español y Portugués
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Términos formales similares con significados diametralmente opuestos que inducen a confusión.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lesson.false_friend_alerts.map(item => (
                <FalseFriendCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h3 className="text-sm font-semibold text-slate-200">
                Recursos Abiertos de Profundización Cultural y Filológica
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Enlaces a repositorios lingüísticos de libre acceso y bibliotecas digitales para el nivel C1.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {lesson.section_12_further_resources.map((res, idx) => (
                <a
                  key={idx}
                  href={res.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 block transition-all group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-amber-400 group-hover:text-amber-300">
                      {res.title}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-300">{res.description}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
