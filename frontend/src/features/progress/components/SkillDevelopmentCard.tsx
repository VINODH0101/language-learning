import React from 'react';
import { BookOpen, Headphones, PenTool, Mic, BookMarked, Layers, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { ProgressBar } from '../../../components/common/ProgressBar';
import { useI18n } from '../../../i18n/i18nContext';

interface SkillDevelopmentCardProps {
  skillActivityCounts: {
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
    grammar: number;
    vocabulary: number;
  };
}

interface SkillItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
  description: string;
}

export const SkillDevelopmentCard: React.FC<SkillDevelopmentCardProps> = ({
  skillActivityCounts,
}) => {
  const { t } = useI18n();

  const skills: SkillItem[] = [
    {
      id: 'reading',
      name: t('progress:skill_reading', 'Reading Comprehension'),
      icon: <BookOpen className="w-4 h-4 text-sky-400" />,
      count: skillActivityCounts.reading,
      description: t('progress:skill_reading_desc', 'Literary poems, curated articles, reading questions'),
    },
    {
      id: 'listening',
      name: t('progress:skill_listening', 'Listening & Audio'),
      icon: <Headphones className="w-4 h-4 text-indigo-400" />,
      count: skillActivityCounts.listening,
      description: t('progress:skill_listening_desc', 'Full verses audio, authentic dialogues, comprehension tasks'),
    },
    {
      id: 'grammar',
      name: t('progress:skill_grammar', 'Grammar Competency'),
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      count: skillActivityCounts.grammar,
      description: t('progress:skill_grammar_desc', 'Structural formulas, reordering, conjugation exercises'),
    },
    {
      id: 'vocabulary',
      name: t('progress:skill_vocabulary', 'Vocabulary Breadth'),
      icon: <BookMarked className="w-4 h-4 text-amber-400" />,
      count: skillActivityCounts.vocabulary,
      description: t('progress:skill_vocabulary_desc', 'SM-2 spaced repetitions, cloze tasks, phrasebook entries'),
    },
    {
      id: 'speaking',
      name: t('progress:skill_speaking', 'Speaking & Oral Practice'),
      icon: <Mic className="w-4 h-4 text-rose-400" />,
      count: skillActivityCounts.speaking,
      description: t('progress:skill_speaking_desc', 'Dialogue turns completed, pronunciation practice'),
    },
    {
      id: 'writing',
      name: t('progress:skill_writing', 'Writing Practice'),
      icon: <PenTool className="w-4 h-4 text-purple-400" />,
      count: skillActivityCounts.writing,
      description: t('progress:skill_writing_desc', 'Free response tasks, genre registers, grammar corrections'),
    },
  ];

  return (
    <Card
      title={t('progress:skills_title', 'Communicative Skill Development')}
      subtitle={t(
        'progress:skills_subtitle',
        'Verified activity across core CEFR linguistic competencies (distinguishing practice activity from formal mastery)'
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {skills.map(skill => {
          const hasData = skill.count > 0;

          return (
            <div
              key={skill.id}
              className={`p-4 rounded-2xl border transition-all ${
                hasData
                  ? 'bg-slate-950/60 border-slate-800'
                  : 'bg-slate-950/30 border-slate-850 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {skill.icon}
                  </div>
                  <span className="text-xs font-bold text-slate-200">{skill.name}</span>
                </div>

                {hasData ? (
                  <Badge variant="indigo" size="sm">
                    {skill.count} {t('progress:activities', 'events')}
                  </Badge>
                ) : (
                  <Badge variant="slate" size="sm">
                    {t('progress:insufficient_data', 'No data')}
                  </Badge>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                {skill.description}
              </p>

              {hasData ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{t('progress:practice_volume', 'Practice Volume')}</span>
                    <span className="font-mono text-slate-200">
                      {skill.count >= 20 ? t('progress:level_high', 'Robust') : skill.count >= 5 ? t('progress:level_moderate', 'Developing') : t('progress:level_starter', 'Initial')}
                    </span>
                  </div>
                  <ProgressBar
                    progress={Math.min(100, skill.count * 5)}
                    variant={skill.count >= 20 ? 'emerald' : 'indigo'}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 italic">
                  <AlertCircle className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{t('progress:insufficient_data_note', 'Complete related activities to record evidence')}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
