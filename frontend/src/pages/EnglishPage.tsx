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
import { courseService } from '../services/courseService';
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

export const EnglishPage: React.FC = () => {
  const [lesson, setLesson] = useState<DailyLessonPayload | null>(null);
  const [activeTab, setActiveTab] = useState<SectionTab>('vocab');
  const [convView, setConvView] = useState<'daily' | 'scenarios'>('daily');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const activeCourse = courseService.getActiveCourse();
    const config = activeCourse.target_language === 'en'
      ? courseService.toCourseConfig(activeCourse)
      : {
          target_language: 'en' as const,
          regional_variant: 'en-US' as const,
          cefr_level: 'C1' as const,
          explanation_language: 'pt' as const,
        };

    const generated = ClientLessonGenerator.generateOrGetLesson(config, today);
    setLesson(generated);

    const track = StorageService.getTrackState('en');
    if (track.completed_curriculum_node_ids.includes(generated.curriculum_node_id)) {
      setIsCompleted(true);
    }

    getActiveProgress('en').then(saved => {
      if (saved && saved.lesson_date === today && saved.selected_tab) {
        setActiveTab(saved.selected_tab as SectionTab);
      }
    });
  }, []);

  if (!lesson) {
    return <div className="p-8 text-center text-slate-400">Loading English lesson...</div>;
  }

  const handleSelectTab = (tab: SectionTab) => {
    setActiveTab(tab);
    if (lesson) {
      saveActiveProgress({
        id: 'en',
        language: 'en',
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
    const track = StorageService.getTrackState('en');
    if (!track.completed_curriculum_node_ids.includes(lesson.curriculum_node_id)) {
      track.completed_curriculum_node_ids.push(lesson.curriculum_node_id);
      track.total_lessons_completed += 1;
      track.streak_days += 1;
      track.last_lesson_date = new Date().toISOString().split('T')[0];
      StorageService.saveTrackState(track);

      // Also update courseService
      const active = courseService.getActiveCourse();
      if (active.target_language === 'en') {
        courseService.updateCourse(active.id, {
          streak_days: active.streak_days + 1,
          total_lessons_completed: active.total_lessons_completed + 1,
          completed_curriculum_node_ids: [...active.completed_curriculum_node_ids, lesson.curriculum_node_id],
          last_studied_at: new Date().toISOString(),
        });
      }
    }
    clearActiveProgress('en');
    setIsCompleted(true);
    toast.success('Congratulations! Today\'s English C1 lesson is completed!');
  };

  const navItems: Array<{ id: SectionTab; label: string; icon: React.ReactNode; count?: number }> = [
    { id: 'vocab', label: '1. Vocabulary', icon: <BookOpen className="w-4 h-4" />, count: lesson.section_2_vocabulary.length },
    { id: 'grammar', label: '2. Grammar', icon: <FileText className="w-4 h-4" /> },
    { id: 'reading', label: '3. Reading', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'conv', label: '4. Conversation', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'speaking', label: '5. Speech & Audio', icon: <Mic className="w-4 h-4" /> },
    { id: 'writing', label: '6. Writing', icon: <PenTool className="w-4 h-4" /> },
    { id: 'listening', label: '7. Listening', icon: <Headphones className="w-4 h-4" /> },
    { id: 'exercises', label: '8. Exercises', icon: <CheckCircle className="w-4 h-4 text-emerald-400" />, count: lesson.section_9_exercises.length },
    { id: 'false_friends', label: '9. Cognates', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
    { id: 'resources', label: '10. Resources', icon: <ExternalLink className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="indigo" size="sm">
              English {lesson.cefr_level}
            </Badge>
            <Badge variant="slate" size="sm">
              Variant {lesson.regional_variety}
            </Badge>
            {lesson.explanation_language && (
              <Badge variant="amber" size="sm">
                Explanations: {lesson.explanation_language.toUpperCase()}
              </Badge>
            )}
            <span className="text-xs text-slate-400 font-mono">
              Date: {lesson.lesson_date} • {lesson.estimated_study_minutes} min
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
            className={isCompleted ? 'bg-slate-800 text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-700'}
            icon={<Award className="w-4 h-4" />}
            onClick={handleMarkComplete}
            disabled={isCompleted}
          >
            {isCompleted ? 'Lesson Completed' : 'Mark as Completed'}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-medium no-scrollbar">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Viewport */}
      <div className="mt-4">
        {activeTab === 'vocab' && (
          <VocabularySection
            vocabulary={lesson.section_2_vocabulary}
            language="en"
            variety={lesson.regional_variety}
          />
        )}

        {activeTab === 'grammar' && (
          <GrammarSection
            grammar={lesson.section_3_grammar}
            language="en"
            variety={lesson.regional_variety}
          />
        )}

        {activeTab === 'reading' && (
          <ReadingSection
            reading={lesson.section_4_reading}
            language="en"
            variety={lesson.regional_variety}
          />
        )}

        {activeTab === 'conv' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConvView('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  convView === 'daily' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Today's Curated Dialogue
              </button>
              <button
                onClick={() => setConvView('scenarios')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  convView === 'scenarios' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Pragmatic Immersion Scenarios
              </button>
            </div>

            {convView === 'daily' ? (
              <ConversationSection
                conversation={lesson.section_5_conversation}
                language="en"
                variety={lesson.regional_variety}
              />
            ) : (
              <ScenariosSection language="en" variety={lesson.regional_variety} />
            )}
          </div>
        )}

        {activeTab === 'speaking' && (
          <SpeakingSection
            speaking={lesson.section_6_speaking}
            language="en"
            variety={lesson.regional_variety}
          />
        )}

        {activeTab === 'writing' && (
          <WritingSection writing={lesson.section_7_writing} language="en" />
        )}

        {activeTab === 'listening' && (
          <ListeningSection
            listening={lesson.section_8_listening}
            language="en"
            variety={lesson.regional_variety}
          />
        )}

        {activeTab === 'exercises' && (
          <ExerciseSection
            exercises={lesson.section_9_exercises}
            answerKeys={lesson.section_10_answer_keys}
            language="en"
          />
        )}

        {activeTab === 'false_friends' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lesson.false_friend_alerts.map(ff => (
              <FalseFriendCard key={ff.id} item={ff} />
            ))}
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-100">
              Open Educational & Cultural Resources (C1)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lesson.section_12_further_resources.map((res, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{res.resource_type}</span>
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1"
                    >
                      <span>Access Resource</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200">{res.title}</h3>
                  <p className="text-xs text-slate-400">{res.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
