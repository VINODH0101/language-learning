import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import {
  ContentItem,
  ContentVersion,
  LearningActivity,
} from '../types/contentCentred';
import { LearnCatalog } from '../features/learn/LearnCatalog';
import { ReaderView } from '../features/learn/ReaderView';
import { contentCentredService } from '../services/contentCentredService';
import { contentAccess, recordToReaderVersion } from '../services/contentAccess';
import { Button } from '../components/common/Button';
import { useI18n } from '../i18n/i18nContext';

export interface ResumeErrorInfo {
  title: string;
  message: string;
  contentId: string;
  versionId?: string;
}

export const LearnPage: React.FC = () => {
  const { t } = useI18n();
  const [selectedContent, setSelectedContent] = useState<{
    item: ContentItem;
    version: ContentVersion;
    activities: LearningActivity[];
  } | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState<boolean>(false);
  const [resumeError, setResumeError] = useState<ResumeErrorInfo | null>(null);

  // Resume directly into ReaderView if an item or specific version was initiated from Home
  const attemptResume = useCallback(async () => {
    let contentId: string | null = null;
    let versionId: string | null = null;

    try {
      contentId = sessionStorage.getItem('lexilume_open_content_id');
      versionId = sessionStorage.getItem('lexilume_open_version_id');
    } catch {
      return;
    }

    if (!contentId) return;

    setIsLoadingResume(true);
    setResumeError(null);

    try {
      if (contentAccess.hasHttpBackend()) {
        const record = (await contentAccess.getContent(contentId, versionId || undefined)) as any;
        if (record) {
          const mappedItem: ContentItem = {
            id: record.id,
            title: record.title,
            slug: record.id,
            target_language: record.target_language,
            explanation_language: record.explanation_language,
            summary: record.summary,
            genre: (record.genre || 'short_story') as any,
            content_type: record.content_type,
            primary_cefr: record.cefr_level || record.primary_cefr || 'B1',
            estimated_read_minutes: record.estimated_read_minutes || 1,
            status: 'published',
            current_version_id: record.current_version_id,
            rights_status: 'original',
            created_at: record.published_at || record.created_at || new Date().toISOString(),
            updated_at: record.published_at || record.updated_at || new Date().toISOString(),
          };
          const activities = (await contentAccess.getActivities(contentId)) as LearningActivity[];
          setSelectedContent({
            item: mappedItem,
            version: recordToReaderVersion(mappedItem, record),
            activities,
          });
          try {
            sessionStorage.removeItem('lexilume_open_content_id');
            sessionStorage.removeItem('lexilume_open_version_id');
          } catch {}
          setIsLoadingResume(false);
          return;
        }
      }
      const fullItem = await contentCentredService.getContentItemById(contentId);
      if (!fullItem) {
        setResumeError({
          title: t('learning:resume_not_found_title', 'Reading Material Not Found'),
          message: t('learning:resume_not_found_desc', 'The requested reading piece could not be located in the catalog.'),
          contentId,
          versionId: versionId || undefined,
        });
        setIsLoadingResume(false);
        return;
      }

      let targetVersion: ContentVersion | null = null;

      if (versionId) {
        // Strict version resolution: retrieve the exact requested edition
        const specificVersion = await contentCentredService.getContentVersion(versionId);
        if (!specificVersion) {
          // Invariant: NEVER silently fall back to latest version!
          setResumeError({
            title: t('learning:resume_exact_unavailable_title', 'Exact Edition Unavailable'),
            message: t('learning:resume_exact_unavailable_desc', 'The requested revision of "{{title}}" could not be opened.', {
              title: versionId,
            }),
            contentId,
            versionId,
          });
          setIsLoadingResume(false);
          return;
        }

        // Integrity check: verify that the version strictly belongs to the requested content item
        if (specificVersion.content_item_id !== fullItem.id) {
          setResumeError({
            title: t('learning:resume_mismatch_title', 'Edition Mismatch'),
            message: t('learning:resume_mismatch_desc', 'Loaded edition does not match requested identifier.'),
            contentId,
            versionId,
          });
          setIsLoadingResume(false);
          return;
        }

        targetVersion = specificVersion;
      } else {
        // No specific version was requested: open current published version
        targetVersion = fullItem.version || null;
        if (!targetVersion && fullItem.current_version_id) {
          targetVersion = await contentCentredService.getContentVersion(fullItem.current_version_id);
        }
      }

      if (!targetVersion) {
        setResumeError({
          title: t('learning:resume_no_published_title', 'No Published Edition Available'),
          message: t('learning:resume_no_published_desc', 'The item "{{title}}" currently has no readable edition available.', {
            title: fullItem.title,
          }),
          contentId,
          versionId: versionId || undefined,
        });
        setIsLoadingResume(false);
        return;
      }

      const activities = await contentCentredService.getActivitiesForVersion(targetVersion.id);
      setSelectedContent({
        item: fullItem,
        version: targetVersion,
        activities,
      });

      // ONLY upon verified successful restoration: clear consumed session state!
      try {
        sessionStorage.removeItem('lexilume_open_content_id');
        sessionStorage.removeItem('lexilume_open_version_id');
      } catch {}
    } catch (err: any) {
      console.warn('Failed resuming reading from session storage:', err);
      setResumeError({
        title: t('learning:resume_session_error_title', 'Error Resuming Reading Session'),
        message:
          err?.message ||
          t('learning:resume_session_error_desc', 'A network or storage error occurred while preparing the reader.'),
        contentId,
        versionId: versionId || undefined,
      });
    } finally {
      setIsLoadingResume(false);
    }
  }, [t]);

  useEffect(() => {
    attemptResume();
  }, [attemptResume]);

  const handleDismissResumeError = () => {
    try {
      sessionStorage.removeItem('lexilume_open_content_id');
      sessionStorage.removeItem('lexilume_open_version_id');
    } catch {}
    setResumeError(null);
  };

  if (isLoadingResume) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center text-stone-500">
        <div className="animate-pulse font-serif text-lg">{t('learning:resume_opening', 'Opening reader...')}</div>
      </div>
    );
  }

  if (resumeError) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div
          role="alert"
          aria-label={t('learning:resume_error_aria', 'Resume Error')}
          className="bg-white border border-amber-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-serif font-bold text-lg text-stone-900">
                {resumeError.title}
              </h2>
              <p className="text-sm text-stone-600 leading-relaxed">
                {resumeError.message}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={attemptResume}
            >
              {t('learning:resume_retry', 'Retry Resume')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={handleDismissResumeError}
            >
              {t('learning:resume_return_catalog', 'Return to Catalog')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedContent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ReaderView
          item={selectedContent.item}
          version={selectedContent.version}
          activities={selectedContent.activities}
          onBack={() => setSelectedContent(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <LearnCatalog
        onSelectContent={(item, version, activities) => {
          setSelectedContent({ item, version, activities });
        }}
      />
    </div>
  );
};
