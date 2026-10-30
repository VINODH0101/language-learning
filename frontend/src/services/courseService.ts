/**
 * Polyglot C1 Daily — Multi-Course Management & Local Storage Isolation Service.
 * 
 * Enables learners to maintain multiple independent courses (e.g. English B1 with PT explanation,
 * Spanish A2 with EN explanation, Portuguese C1 with ES explanation) under a single account.
 * Partitions local storage strictly between guests and authenticated accounts to prevent
 * cross-account data leakage on shared devices.
 */

import { Course, CourseConfig, Language, RegionalVariety, CEFRLevel, ExplanationLanguage } from '../types';
import { supabase } from './supabaseClient';
import { enforceRegionalVariety, isValidRegionalVariety } from '../lib/languages/languageMatrix';
import { syncEngine } from './syncEngine';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const COURSE_STORAGE_PREFIX = 'polyglot_courses_';
const ACTIVE_COURSE_PREFIX = 'polyglot_active_course_';

const DEFAULT_COURSES: Array<Omit<Course, 'id' | 'user_id' | 'created_at' | 'updated_at'>> = [
  {
    target_language: 'pt',
    regional_variant: 'pt-BR',
    cefr_level: 'C1',
    explanation_language: 'en',
    daily_goal_minutes: 10,
    streak_days: 1,
    total_lessons_completed: 0,
    completed_curriculum_node_ids: [],
    is_active: true,
  },
  {
    target_language: 'es',
    regional_variant: 'es-ES',
    cefr_level: 'C1',
    explanation_language: 'en',
    daily_goal_minutes: 10,
    streak_days: 1,
    total_lessons_completed: 0,
    completed_curriculum_node_ids: [],
    is_active: false,
  },
  {
    target_language: 'en',
    regional_variant: 'en-US',
    cefr_level: 'C1',
    explanation_language: 'pt',
    daily_goal_minutes: 10,
    streak_days: 1,
    total_lessons_completed: 0,
    completed_curriculum_node_ids: [],
    is_active: false,
  },
];

type CourseListener = (courses: Course[], activeCourse: Course) => void;

class CourseService {
  private listeners: Set<CourseListener> = new Set();
  private currentUserId: string = 'guest';

  constructor() {
    this.initFromStorage();
  }

  public setUserId(userId: string | null): void {
    const newId = userId && userId.trim() ? userId : 'guest';
    if (this.currentUserId !== newId) {
      this.currentUserId = newId;
      this.notify();
    }
  }

  public getUserId(): string {
    return this.currentUserId;
  }

  private getStorageKey(userId?: string): string {
    const uid = userId || this.currentUserId;
    return `${COURSE_STORAGE_PREFIX}${uid}`;
  }

  private getActiveStorageKey(userId?: string): string {
    const uid = userId || this.currentUserId;
    return `${ACTIVE_COURSE_PREFIX}${uid}`;
  }

  public getCourses(userId?: string): Course[] {
    const key = this.getStorageKey(userId);
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: Course[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse courses from storage', e);
    }

    // Initialize defaults if none exist
    return this.initializeDefaultCourses(userId);
  }

  public getActiveCourse(userId?: string): Course {
    const courses = this.getCourses(userId);
    const activeKey = this.getActiveStorageKey(userId);
    let activeId: string | null = null;
    try {
      activeId = localStorage.getItem(activeKey);
    } catch {}

    if (activeId) {
      const found = courses.find(c => c.id === activeId);
      if (found) return found;
    }

    // Default to the first course marked is_active or simply the first one
    const activeOne = courses.find(c => c.is_active) || courses[0];
    return activeOne;
  }

  public setActiveCourse(courseId: string, userId?: string): Course {
    const uid = userId || this.currentUserId;
    const courses = this.getCourses(uid);
    let activated: Course | null = null;

    const updated = courses.map(c => {
      if (c.id === courseId) {
        activated = { ...c, is_active: true, updated_at: new Date().toISOString() };
        return activated;
      }
      return { ...c, is_active: false };
    });

    if (!activated) {
      throw new Error(`Course with id ${courseId} not found`);
    }

    this.saveCourses(updated, uid);
    try {
      localStorage.setItem(this.getActiveStorageKey(uid), courseId);
    } catch {}

    // Queue synchronization if authenticated
    if (uid !== 'guest') {
      syncEngine.queueAction('SYNC_COURSE', activated, uid).catch((err: any) => {
        console.warn('Failed to queue active course sync', err);
      });
    }

    this.notify();
    return activated;
  }

  public createCourse(
    data: Omit<Course, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    userId?: string
  ): Course {
    const uid = userId || this.currentUserId;
    const courses = this.getCourses(uid);

    // Enforce that regional variety is valid for target learning language
    const enforcedVariety = enforceRegionalVariety(data.target_language, data.regional_variant);
    const sanitizedData = {
      ...data,
      regional_variant: enforcedVariety,
    };

    // Prevent identical duplicates (same target_language, regional_variant, and cefr_level)
    const existing = courses.find(
      c =>
        c.target_language === sanitizedData.target_language &&
        c.regional_variant === sanitizedData.regional_variant &&
        c.cefr_level === sanitizedData.cefr_level
    );
    if (existing) {
      return this.setActiveCourse(existing.id, uid);
    }

    const now = new Date().toISOString();
    const id = generateUUID();

    const newCourse: Course = {
      ...sanitizedData,
      id,
      user_id: uid,
      streak_days: sanitizedData.streak_days || 1,
      total_lessons_completed: sanitizedData.total_lessons_completed || 0,
      completed_curriculum_node_ids: sanitizedData.completed_curriculum_node_ids || [],
      is_active: true,
      created_at: now,
      updated_at: now,
    };

    // Deactivate previous courses if the new one is active
    const updated = courses.map(c => ({ ...c, is_active: false }));
    updated.push(newCourse);

    this.saveCourses(updated, uid);
    try {
      localStorage.setItem(this.getActiveStorageKey(uid), id);
    } catch {}

    // Queue synchronization if authenticated
    if (uid !== 'guest') {
      syncEngine.queueAction('SYNC_COURSE', newCourse, uid).catch((err: any) => {
        console.warn('Failed to queue course insert sync', err);
      });
    }

    this.notify();
    return newCourse;
  }

  public updateCourse(
    courseId: string,
    updates: Partial<Omit<Course, 'id' | 'user_id' | 'created_at'>>,
    userId?: string
  ): Course {
    const uid = userId || this.currentUserId;
    const courses = this.getCourses(uid);
    let updatedCourse: Course | null = null;

    const nextCourses = courses.map(c => {
      if (c.id === courseId) {
        const targetLang = updates.target_language || c.target_language;
        const regionalVariant = updates.regional_variant
          ? enforceRegionalVariety(targetLang, updates.regional_variant)
          : c.regional_variant;

        updatedCourse = {
          ...c,
          ...updates,
          regional_variant: regionalVariant,
          updated_at: new Date().toISOString(),
        };
        return updatedCourse;
      }
      return c;
    });

    if (!updatedCourse) {
      throw new Error(`Course ${courseId} not found`);
    }

    this.saveCourses(nextCourses, uid);

    if (uid !== 'guest') {
      syncEngine.queueAction('SYNC_COURSE', updatedCourse, uid).catch((err: any) => {
        console.warn('Failed to queue course update sync', err);
      });
    }

    this.notify();
    return updatedCourse;
  }

  public deleteCourse(courseId: string, userId?: string): boolean {
    const uid = userId || this.currentUserId;
    const courses = this.getCourses(uid);
    if (courses.length <= 1) {
      // Keep at least one course
      return false;
    }

    const nextCourses = courses.filter(c => c.id !== courseId);
    if (nextCourses.length === courses.length) {
      return false;
    }

    // If deleted course was active, activate the first remaining
    const deletedWasActive = courses.find(c => c.id === courseId)?.is_active;
    if (deletedWasActive && nextCourses.length > 0) {
      nextCourses[0].is_active = true;
      try {
        localStorage.setItem(this.getActiveStorageKey(uid), nextCourses[0].id);
      } catch {}
    }

    this.saveCourses(nextCourses, uid);

    const toDelete = courses.find(c => c.id === courseId);
    if (toDelete && uid !== 'guest') {
      syncEngine.queueAction('DELETE_COURSE', toDelete, uid).catch((err: any) => {
        console.warn('Failed to queue course delete sync', err);
      });
    }

    this.notify();
    return true;
  }

  public migrateGuestCourses(authenticatedUserId: string): Course[] {
    const guestCourses = this.getCourses('guest');
    const userCourses = this.getCourses(authenticatedUserId);

    const merged = [...userCourses];
    for (const gc of guestCourses) {
      const exists = merged.some(
        uc =>
          uc.target_language === gc.target_language &&
          uc.regional_variant === gc.regional_variant &&
          uc.cefr_level === gc.cefr_level
      );
      if (!exists) {
        merged.push({
          ...gc,
          id: generateUUID(),
          user_id: authenticatedUserId,
          is_active: false,
          updated_at: new Date().toISOString(),
        });
      }
    }

    this.saveCourses(merged, authenticatedUserId);
    this.setUserId(authenticatedUserId);
    return merged;
  }

  public toCourseConfig(course: Course): CourseConfig {
    return {
      course_id: course.id,
      target_language: course.target_language,
      regional_variant: course.regional_variant,
      cefr_level: course.cefr_level,
      explanation_language: course.explanation_language,
    };
  }

  public getCourseForLanguage(lang: Language, userId?: string): Course | undefined {
    const courses = this.getCourses(userId);
    return courses.find(c => c.target_language === lang && c.is_active) || courses.find(c => c.target_language === lang);
  }

  public updateActiveExplanationLanguage(explanationLanguage: ExplanationLanguage, userId?: string): Course {
    const active = this.getActiveCourse(userId);
    return this.updateCourse(active.id, { explanation_language: explanationLanguage }, userId);
  }

  public updateActiveRegionalVariant(regionalVariant: RegionalVariety, userId?: string): Course {
    const active = this.getActiveCourse(userId);
    return this.updateCourse(active.id, { regional_variant: regionalVariant }, userId);
  }

  public subscribe(listener: CourseListener): () => void {
    this.listeners.add(listener);
    // Send immediate initial state
    try {
      listener(this.getCourses(), this.getActiveCourse());
    } catch {}
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const courses = this.getCourses();
    const active = this.getActiveCourse();
    this.listeners.forEach(fn => {
      try {
        fn(courses, active);
      } catch (e) {
        console.warn('Error in course listener', e);
      }
    });
  }

  private saveCourses(courses: Course[], userId?: string): void {
    const key = this.getStorageKey(userId);
    try {
      localStorage.setItem(key, JSON.stringify(courses));
    } catch (e) {
      console.warn('Failed to save courses to localStorage', e);
    }
  }

  private initializeDefaultCourses(userId?: string): Course[] {
    const uid = userId || this.currentUserId;
    const now = new Date().toISOString();
    const initial: Course[] = DEFAULT_COURSES.map((tmpl) => ({
      ...tmpl,
      id: generateUUID(),
      user_id: uid,
      created_at: now,
      updated_at: now,
    }));

    this.saveCourses(initial, uid);
    try {
      localStorage.setItem(this.getActiveStorageKey(uid), initial[0].id);
    } catch {}
    return initial;
  }

  private initFromStorage(): void {
    try {
      const activeGuest = this.getActiveCourse('guest');
      if (!activeGuest) {
        this.initializeDefaultCourses('guest');
      }
    } catch {}
  }
}

export const courseService = new CourseService();
