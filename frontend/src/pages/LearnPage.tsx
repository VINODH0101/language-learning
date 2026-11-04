import React, { useState, useEffect } from 'react';
import {
  ContentItem,
  ContentVersion,
  LearningActivity,
} from '../types/contentCentred';
import { LearnCatalog } from '../features/learn/LearnCatalog';
import { ReaderView } from '../features/learn/ReaderView';
import { contentCentredService } from '../services/contentCentredService';

export const LearnPage: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState<{
    item: ContentItem;
    version: ContentVersion;
    activities: LearningActivity[];
  } | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState<boolean>(false);

  // Resume directly into ReaderView if an item or specific version was initiated from Home
  useEffect(() => {
    const resumeFromSession = async () => {
      try {
        const contentId = sessionStorage.getItem('lexilume_open_content_id');
        const versionId = sessionStorage.getItem('lexilume_open_version_id');
        if (!contentId) return;

        setIsLoadingResume(true);
        const fullItem = await contentCentredService.getContentItemById(contentId);
        if (fullItem) {
          let targetVersion: ContentVersion | null = fullItem.version || null;
          if (versionId && (!targetVersion || targetVersion.id !== versionId)) {
            const specificVersion = await contentCentredService.getContentVersion(versionId);
            if (specificVersion) {
              targetVersion = specificVersion;
            }
          }

          if (targetVersion) {
            const activities = await contentCentredService.getActivitiesForVersion(targetVersion.id);
            setSelectedContent({
              item: fullItem,
              version: targetVersion,
              activities,
            });
          }
        }
      } catch (err) {
        console.warn('Failed resuming reading from session storage:', err);
      } finally {
        sessionStorage.removeItem('lexilume_open_content_id');
        sessionStorage.removeItem('lexilume_open_version_id');
        setIsLoadingResume(false);
      }
    };

    resumeFromSession();
  }, []);

  if (isLoadingResume) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center text-stone-500">
        <div className="animate-pulse font-serif text-lg">Opening reader...</div>
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
