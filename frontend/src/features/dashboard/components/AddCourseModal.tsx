import React, { useState } from 'react';
import { Globe, X } from 'lucide-react';
import { Course, Language, RegionalVariety, CEFRLevel, ExplanationLanguage } from '../../../types';
import { Button } from '../../../components/common/Button';
import { useI18n } from '../../../i18n/i18nContext';
import { courseService } from '../../../services/courseService';
import { toast } from 'sonner';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: (course: Course) => void;
}

export const AddCourseModal: React.FC<AddCourseModalProps> = ({
  isOpen,
  onClose,
  onCourseCreated,
}) => {
  const { t, interfaceLanguage } = useI18n();

  const [newTargetLang, setNewTargetLang] = useState<Language>(interfaceLanguage === 'en' ? 'pt' : 'en');
  const [newRegionalVariant, setNewRegionalVariant] = useState<RegionalVariety>('en-US');
  const [newCefrLevel, setNewCefrLevel] = useState<CEFRLevel>('B1');
  const [newExplanationLang, setNewExplanationLang] = useState<ExplanationLanguage>(
    interfaceLanguage.startsWith('pt') ? 'pt' : interfaceLanguage === 'es' ? 'es' : 'en'
  );
  const [newDailyGoal, setNewDailyGoal] = useState<number>(10);

  if (!isOpen) return null;

  const getLanguageLabel = (lang: Language) => {
    if (interfaceLanguage === 'en') {
      return lang === 'en' ? 'English' : lang === 'pt' ? 'Portuguese' : lang === 'es' ? 'Spanish' : lang;
    }
    if (interfaceLanguage === 'es') {
      return lang === 'en' ? 'Inglés' : lang === 'pt' ? 'Portugués' : lang === 'es' ? 'Español' : lang;
    }
    return lang === 'en' ? 'Inglês' : lang === 'pt' ? 'Português' : lang === 'es' ? 'Espanhol' : lang;
  };

  const handleCreateCourseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = courseService.createCourse({
        target_language: newTargetLang,
        regional_variant: newRegionalVariant,
        cefr_level: newCefrLevel,
        explanation_language: newExplanationLang,
        daily_goal_minutes: newDailyGoal,
        streak_days: 1,
        total_lessons_completed: 0,
        completed_curriculum_node_ids: [],
        is_active: true,
      });
      onCourseCreated(created);
      onClose();
      const msg = interfaceLanguage === 'en'
        ? `New ${getLanguageLabel(created.target_language)} course created successfully!`
        : interfaceLanguage === 'es'
        ? `¡Nuevo curso de ${getLanguageLabel(created.target_language)} creado con éxito!`
        : `Novo curso de ${getLanguageLabel(created.target_language)} adicionado com sucesso!`;
      toast.success(msg);
    } catch (err: any) {
      toast.error(err.message || (interfaceLanguage === 'en' ? 'Error creating course.' : 'Erro ao criar novo curso.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-slate-100 text-base">{t('dash_add_modal_title')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreateCourseSubmit} className="space-y-4 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">{t('dash_target_lang_label')}</label>
            <select
              value={newTargetLang}
              onChange={e => {
                const l = e.target.value as Language;
                setNewTargetLang(l);
                if (l === 'en') setNewRegionalVariant('en-US');
                else if (l === 'pt') setNewRegionalVariant('pt-BR');
                else if (l === 'es') setNewRegionalVariant('es-ES');
                else if (l === 'fr') setNewRegionalVariant('fr-FR');
                else if (l === 'de') setNewRegionalVariant('de-DE');
                else if (l === 'it') setNewRegionalVariant('it-IT');
                else if (l === 'ja') setNewRegionalVariant('ja-JP');
                else if (l === 'ko') setNewRegionalVariant('ko-KR');
                else if (l === 'ru') setNewRegionalVariant('ru-RU');
                else if (l === 'nl') setNewRegionalVariant('nl-NL');
                else if (l === 'zh') setNewRegionalVariant('zh-CN');
                else if (l === 'tr') setNewRegionalVariant('tr-TR');
                else if (l === 'ta') setNewRegionalVariant('ta-IN');
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px]"
            >
              <option value="en">English (EN)</option>
              <option value="pt">Português (PT)</option>
              <option value="es">Español (ES)</option>
              <option value="fr">Français (FR)</option>
              <option value="de">Deutsch (DE)</option>
              <option value="it">Italiano (IT)</option>
              <option value="ja">日本語 (JA)</option>
              <option value="ko">한국어 (KO)</option>
              <option value="zh">中文 (ZH)</option>
              <option value="ru">Русский (RU)</option>
              <option value="nl">Nederlands (NL)</option>
              <option value="tr">Türkçe (TR)</option>
              <option value="ta">தமிழ் (TA)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">{t('dash_regional_variant_label')}</label>
            <select
              value={newRegionalVariant}
              onChange={e => setNewRegionalVariant(e.target.value as RegionalVariety)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px]"
            >
              {newTargetLang === 'en' && (
                <>
                  <option value="en-US">American English (en-US)</option>
                  <option value="en-GB">British English (en-GB)</option>
                </>
              )}
              {newTargetLang === 'pt' && (
                <>
                  <option value="pt-BR">Português Brasileiro (pt-BR)</option>
                  <option value="pt-PT">Português Europeu (pt-PT)</option>
                </>
              )}
              {newTargetLang === 'es' && (
                <>
                  <option value="es-ES">Español Peninsular (es-ES)</option>
                  <option value="es-419">Español Latinoamericano (es-419)</option>
                  <option value="es-MX">Español Mexicano (es-MX)</option>
                  <option value="es-AR">Español Rioplatense (es-AR)</option>
                </>
              )}
              {newTargetLang !== 'en' && newTargetLang !== 'pt' && newTargetLang !== 'es' && (
                <option value={`${newTargetLang}-${newTargetLang.toUpperCase()}`}>
                  {newTargetLang.toUpperCase()} Standard
                </option>
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">{t('dash_cefr_label')}</label>
              <select
                value={newCefrLevel}
                onChange={e => setNewCefrLevel(e.target.value as CEFRLevel)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px]"
              >
                <option value="A1">{t('common:cefr_a1', 'A1 - Beginner')}</option>
                <option value="A2">{t('common:cefr_a2', 'A2 - Elementary')}</option>
                <option value="B1">{t('common:cefr_b1', 'B1 - Intermediate')}</option>
                <option value="B2">{t('common:cefr_b2', 'B2 - Upper-Intermediate')}</option>
                <option value="C1">{t('common:cefr_c1', 'C1 - Advanced Mastery')}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">{t('dash_explanation_label')}</label>
              <select
                value={newExplanationLang}
                onChange={e => setNewExplanationLang(e.target.value as ExplanationLanguage)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[44px]"
              >
                <option value="en">English (EN)</option>
                <option value="pt">Português (PT)</option>
                <option value="es">Español (ES)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={onClose}
            >
              {t('dash_cancel_btn')}
            </Button>
            <Button variant="primary" size="sm" type="submit" className="bg-indigo-600 hover:bg-indigo-500">
              {t('dash_create_course_btn')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
