import React, { useState } from 'react';
import {
  ContentItem,
  ContentVersion,
  LearningActivity,
} from '../types/contentCentred';
import { LearnCatalog } from '../features/learn/LearnCatalog';
import { ReaderView } from '../features/learn/ReaderView';

export const LearnPage: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState<{
    item: ContentItem;
    version: ContentVersion;
    activities: LearningActivity[];
  } | null>(null);

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
