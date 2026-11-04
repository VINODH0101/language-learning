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
import { Button } from '../components/common/Button';

export interface ResumeErrorInfo {
  title: string;
  message: string;
  contentId: string;
  versionId?: string;
}

export const LearnPage: React.FC = () => {
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
      const fullItem = await contentCentredService.getContentItemById(contentId);
      if (!fullItem) {
        setResumeError({
          title: 'Reading Material Not Found',
          message: 'The requested reading piece could not be located in the catalog.',
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
            title: 'Exact Edition Unavailable',
            message: `The specific edition (${versionId}) associated with your reading progress could not be retrieved.`,
            contentId,
            versionId,
          });
          setIsLoadingResume(false);
          return;
        }

        // Integrity check: verify that the version strictly belongs to the requested content item
        if (specificVersion.content_item_id !== fullItem.id) {
          setResumeError({
            title: 'Edition Mismatch',
            message: 'The requested edition does not belong to the selected content item.',
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
          title: 'No Published Edition Available',
          message: 'No published version is currently available for this reading piece.',
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
        title: 'Error Resuming Reading Session',
        message: err?.message || 'A network or storage error occurred while preparing the reader.',
        contentId,
        versionId: versionId || undefined,
      });
    } finally {
      setIsLoadingResume(false);
    }
  }, []);

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
        <div className="animate-pulse font-serif text-lg">Opening reader...</div>
      </div>
    );
  }

  if (resumeError) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div
          role="alert"
          aria-label="Resume Error"
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
              Retry Resume
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={handleDismissResumeError}
            >
              Return to Catalog
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
