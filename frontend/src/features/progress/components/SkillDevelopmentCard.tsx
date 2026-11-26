import React from 'react';
import { BookOpen, Headphones, PenTool, Mic, BookMarked, Layers } from 'lucide-react';
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
  iconWrapClass: string;
}

export const SkillDevelopmentCard: React.FC<SkillDevelopmentCardProps> = ({
  skillActivityCounts,
}) => {
  const { t } = useI18n();

  const skills: SkillItem[] = [
    {
      id: 'reading',
      name: t('progress:skill_reading', 'Reading'),
      icon: <BookOpen className="w-4 h-4 text-sky-700" />,
      iconWrapClass: 'bg-sky-50 border-sky-200',
      count: skillActivityCounts.reading,
      description: t('progress:skill_reading_desc', 'Literature & Articles'),
    },
    {
      id: 'listening',
      name: t('progress:skill_listening', 'Listening'),
      icon: <Headphones className="w-4 h-4 text-amber-700" />,
      iconWrapClass: 'bg-amber-50 border-amber-200',
      count: skillActivityCounts.listening,
      description: t('progress:skill_listening_desc', 'Audio & Conversations'),
    },
    {
      id: 'grammar',
      name: t('progress:skill_grammar', 'Grammar'),
      icon: <Layers className="w-4 h-4 text-emerald-700" />,
      iconWrapClass: 'bg-emerald-50 border-emerald-200',
      count: skillActivityCounts.grammar,
      description: t('progress:skill_grammar_desc', 'Structural Syntax'),
    },
    {
      id: 'vocabulary',
      name: t('progress:skill_vocabulary', 'Vocabulary'),
      icon: <BookMarked className="w-4 h-4 text-stone-700" />,
      iconWrapClass: 'bg-stone-100 border-stone-200',
      count: skillActivityCounts.vocabulary,
      description: t('progress:skill_vocabulary_desc', 'Lexical Acquisition'),
    },
    {
      id: 'speaking',
      name: t('progress:skill_speaking', 'Speaking'),
      icon: <Mic className="w-4 h-4 text-rose-700" />,
      iconWrapClass: 'bg-rose-50 border-rose-200',
      count: skillActivityCounts.speaking,
      description: t('progress:skill_speaking_desc', 'Pronunciation & Fluency'),
    },
    {
      id: 'writing',
      name: t('progress:skill_writing', 'Writing'),
      icon: <PenTool className="w-4 h-4 text-stone-700" />,
      iconWrapClass: 'bg-stone-100 border-stone-200',
      count: skillActivityCounts.writing,
      description: t('progress:skill_writing_desc', 'Composition & Spelling'),
    },
  ];

  return (
    <Card
      title={t('progress:skills_title', 'Four-Skill Competency Matrix')}
      subtitle={t(
        'progress:skills_subtitle',
        'Recorded study activity across core linguistic competencies'
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {skills.map(skill => {
          const hasData = skill.count > 0;

          return (
            <div
              key={skill.id}
              className={`p-4 rounded-xl border transition-all ${
                hasData ? 'bg-white border-stone-200' : 'bg-[#FAF9F6] border-stone-200/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-lg border shrink-0 ${skill.iconWrapClass}`}>
                    {skill.icon}
                  </div>
                  <span className="text-xs font-bold text-stone-900 truncate">{skill.name}</span>
                </div>

                {hasData ? (
                  <Badge variant="amber" size="sm">
                    {skill.count} {t('progress:activities', 'Activities')}
                  </Badge>
                ) : (
                  <span className="text-[11px] font-medium text-stone-400 shrink-0">0</span>
                )}
              </div>

              <p className="text-xs text-stone-500 leading-relaxed mb-3">{skill.description}</p>

              {hasData ? (
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-stone-500">
                    <span>{t('progress:practice_volume', 'Practice Volume')}</span>
                    <span className="font-mono font-semibold text-stone-700">
                      {skill.count >= 20
                        ? t('progress:level_high', 'High')
                        : skill.count >= 5
                        ? t('progress:level_moderate', 'Developing')
                        : t('progress:level_starter', 'Starter')}
                    </span>
                  </div>
                  <ProgressBar
                    progress={Math.min(100, skill.count * 5)}
                    variant={skill.count >= 20 ? 'emerald' : 'bronze'}
                  />
                </div>
              ) : (
                <p className="text-[11px] text-stone-400">
                  {t('progress:insufficient_data_note', 'Complete related activities to record evidence.')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
