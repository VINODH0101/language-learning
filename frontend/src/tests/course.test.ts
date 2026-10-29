import { describe, it, expect, beforeEach } from 'vitest';
import { courseService } from '../services/courseService';

describe('Multi-Course Management and Storage Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    courseService.setUserId('guest');
  });

  it('initializes default courses for a new guest user', () => {
    const courses = courseService.getCourses();
    expect(courses.length).toBeGreaterThanOrEqual(3);

    const active = courseService.getActiveCourse();
    expect(active).toBeDefined();
    expect(active.is_active).toBe(true);
  });

  it('allows creating a new custom course and sets it active', () => {
    const newCourse = courseService.createCourse({
      target_language: 'en',
      regional_variant: 'en-GB',
      cefr_level: 'B2',
      explanation_language: 'es',
      daily_goal_minutes: 20,
      streak_days: 1,
      total_lessons_completed: 0,
      completed_curriculum_node_ids: [],
      is_active: true,
    });

    expect(newCourse.target_language).toBe('en');
    expect(newCourse.regional_variant).toBe('en-GB');
    expect(newCourse.cefr_level).toBe('B2');
    expect(newCourse.explanation_language).toBe('es');

    const active = courseService.getActiveCourse();
    expect(active.id).toBe(newCourse.id);
  });

  it('switches between courses effortlessly', () => {
    const courses = courseService.getCourses();
    const course1 = courses[0];
    const course2 = courses[1];

    courseService.setActiveCourse(course1.id);
    expect(courseService.getActiveCourse().id).toBe(course1.id);

    courseService.setActiveCourse(course2.id);
    expect(courseService.getActiveCourse().id).toBe(course2.id);
  });

  it('isolates courses between guest and authenticated users on shared devices', () => {
    // Guest creates a German/English course
    const guestCourse = courseService.createCourse({
      target_language: 'en',
      regional_variant: 'en-US',
      cefr_level: 'A1',
      explanation_language: 'pt',
      daily_goal_minutes: 5,
      streak_days: 1,
      total_lessons_completed: 0,
      completed_curriculum_node_ids: [],
      is_active: true,
    });

    // Authenticated user signs in
    courseService.setUserId('usr_user_123');
    const userCourses = courseService.getCourses('usr_user_123');
    expect(userCourses.some(c => c.id === guestCourse.id)).toBe(false);

    // Sign out: guest partition restored
    courseService.setUserId('guest');
    const guestCoursesRestored = courseService.getCourses('guest');
    expect(guestCoursesRestored.some(c => c.id === guestCourse.id)).toBe(true);
  });

  it('prevents deleting the last remaining course', () => {
    const courses = courseService.getCourses();
    // Delete until 1 course left
    for (let i = 0; i < courses.length - 1; i++) {
      courseService.deleteCourse(courses[i].id);
    }
    const remaining = courseService.getCourses();
    expect(remaining.length).toBe(1);

    const deleteLast = courseService.deleteCourse(remaining[0].id);
    expect(deleteLast).toBe(false);
    expect(courseService.getCourses().length).toBe(1);
  });
});
