/**
 * Lexilume — Administrative & Operational Domain Types
 */

import { Language, CEFRLevel } from './index';

export type AdminPillarTab =
  | 'overview'
  | 'users'
  | 'review'
  | 'daily_content'
  | 'operations'
  | 'audit';

export type ContentReviewType = 'vocabulary' | 'reading' | 'exercise' | 'dialogue';
export type ContentReviewStatus = 'pending' | 'approved' | 'rejected';

export interface PendingContentItem {
  id: string;
  type: ContentReviewType;
  titleOrTerm: string;
  language: Language | string;
  cefrLevel: CEFRLevel | string;
  source: string;
  status: ContentReviewStatus;
  reasonFlagged?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface FailedJobItem {
  id: string;
  jobType: string;
  language: Language | string;
  cefrLevel: CEFRLevel | string;
  status: JobStatus;
  errorReason: string;
  retryCount: number;
  maxRetries: number;
  payload?: Record<string, unknown>;
  lastRunAt: string;
  createdAt: string;
}

export interface AdminOverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  totalCompletedLessons: number;
  activePoemsCount: number;
  activeConversationsCount: number;
  healthyProvidersCount: number;
  totalProvidersCount: number;
  pendingReviewCount: number;
  failedJobsCount: number;
  lastUpdated: string;
}
