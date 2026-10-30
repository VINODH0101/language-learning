export type { InterfaceLanguage } from '../types';

export interface TranslationDictionary {
  // Navigation & Header
  nav_dashboard: string;
  nav_home: string;
  nav_learn: string;
  nav_portuguese: string;
  nav_spanish: string;
  nav_english: string;
  nav_translate: string;
  nav_practice: string;
  nav_progress: string;
  nav_settings: string;
  nav_admin: string;
  nav_sign_in: string;
  nav_create_account: string;
  nav_sign_out: string;
  nav_guest_mode: string;
  nav_streak_days: string;
  nav_offline_badge: string;
  nav_explore: string;
  nav_vocabulary: string;
  sync_synced: string;
  sync_syncing: string;
  sync_offline: string;
  sync_error: string;

  // Cultural Discovery & Explore
  explore_title: string;
  explore_subtitle: string;
  explore_tab_discover: string;
  explore_tab_bookmarks: string;
  explore_search_placeholder: string;
  explore_filter_origin: string;
  explore_filter_region: string;
  explore_filter_content_lang: string;
  explore_filter_level: string;
  explore_filter_topic: string;
  explore_filter_all: string;
  explore_filter_all_regions: string;
  explore_filter_all_topics: string;
  explore_empty_title: string;
  explore_empty_desc: string;
  explore_empty_reset: string;
  explore_read_article: string;
  explore_bookmark_save: string;
  explore_bookmark_remove: string;
  explore_quiz_title: string;
  explore_quiz_check: string;
  explore_quiz_correct: string;
  explore_quiz_incorrect: string;
  explore_quiz_completed: string;
  explore_glossary_title: string;
  explore_tap_word_hint: string;
  explore_source_attribution: string;
  explore_license_badge: string;

  // Onboarding (7 Steps)
  onboarding_title: string;
  onboarding_step: string;
  onboarding_skip: string;
  onboarding_back: string;
  onboarding_continue: string;
  onboarding_finish: string;
  onboarding_step1_title: string;
  onboarding_step1_desc: string;
  onboarding_step2_title: string;
  onboarding_step2_desc: string;
  onboarding_step3_title: string;
  onboarding_step3_desc: string;
  onboarding_step4_title: string;
  onboarding_step4_desc: string;
  onboarding_step5_title: string;
  onboarding_step5_desc: string;
  onboarding_step6_title: string;
  onboarding_step6_desc: string;
  onboarding_step7_title: string;
  onboarding_step7_desc: string;
  onboarding_launch_sample: string;

  // Auth Modals & Form
  auth_sign_in_title: string;
  auth_sign_up_title: string;
  auth_forgot_password_title: string;
  auth_email_label: string;
  auth_password_label: string;
  auth_confirm_password_label: string;
  auth_full_name_label: string;
  auth_remember_me: string;
  auth_sign_in_btn: string;
  auth_sign_up_btn: string;
  auth_reset_btn: string;
  auth_no_account: string;
  auth_has_account: string;
  auth_forgot_password_link: string;
  auth_back_to_sign_in: string;
  auth_guest_migration_prompt: string;
  auth_guest_migration_confirm: string;
  auth_guest_migration_skip: string;
  auth_password_min_length: string;
  auth_password_mismatch: string;
  auth_invalid_email: string;
  auth_login_failed: string;
  auth_account_disabled: string;

  // Admin Dashboard
  admin_title: string;
  admin_subtitle: string;
  admin_tab_dashboard: string;
  admin_tab_users: string;
  admin_tab_analytics: string;
  admin_tab_audit: string;
  admin_stat_registered_users: string;
  admin_stat_active_users: string;
  admin_stat_lessons_completed: string;
  admin_stat_guest_sessions: string;
  admin_search_placeholder: string;
  admin_filter_status: string;
  admin_filter_target_lang: string;
  admin_filter_cefr: string;
  admin_table_user: string;
  admin_table_email: string;
  admin_table_status: string;
  admin_table_role: string;
  admin_table_created: string;
  admin_table_actions: string;
  admin_btn_view_details: string;
  admin_btn_disable: string;
  admin_btn_enable: string;
  admin_btn_delete: string;
  admin_btn_make_admin: string;
  admin_btn_remove_admin: string;
  admin_unauthorized_title: string;
  admin_unauthorized_desc: string;
  admin_unauthorized_btn: string;

  // Themes
  theme_light: string;
  theme_dark: string;
  theme_system: string;

  // Settings & Preferences
  settings_title: string;
  settings_subtitle: string;
  settings_interface_lang: string;
  settings_explanation_lang: string;
  settings_learning_lang: string;
  settings_regional_variety: string;
  settings_pt_variety: string;
  settings_es_variety: string;
  settings_en_variety: string;
  settings_decoupled_matrix_title: string;
  settings_decoupled_matrix_subtitle: string;
  settings_primary_target: string;
  settings_theme_label: string;
  settings_daily_goal_label: string;
  settings_study_mode_title: string;
  settings_study_mode_subtitle: string;
  settings_study_mode_full_title: string;
  settings_study_mode_full_desc: string;
  settings_study_mode_compact_title: string;
  settings_study_mode_compact_desc: string;
  settings_email_opt_in_title: string;
  settings_email_opt_in_desc: string;
  settings_save_btn: string;
  settings_saved_success: string;
  settings_delete_account_title: string;
  settings_delete_account_btn: string;
  matrix_badge_interface: string;
  matrix_badge_learning: string;
  matrix_badge_explanation: string;
  matrix_badge_variety: string;

  // Lesson Sections UI Chrome
  lesson_reading_title: string;
  lesson_reading_full_article: string;
  lesson_reading_hide_translation: string;
  lesson_reading_show_translation: string;
  lesson_reading_mode_original: string;
  lesson_reading_mode_side_by_side: string;
  lesson_reading_mode_sentence_by_sentence: string;
  lesson_reading_tap_hint: string;
  lesson_reading_word_saved: string;
  lesson_reading_save_error: string;
  lesson_reading_default_definition: string;

  lesson_conversation_title: string;
  lesson_conversation_pragmatic_notes: string;

  lesson_false_friend_badge: string;
  lesson_false_friend_meaning: string;

  lesson_exercise_label: string;
  lesson_exercise_of: string;
  lesson_exercise_placeholder: string;
  lesson_exercise_hint: string;
  lesson_exercise_correct: string;
  lesson_exercise_incorrect_prefix: string;
  lesson_exercise_expected_prefix: string;
  lesson_exercise_try_again: string;
  lesson_exercise_check: string;
  lesson_exercise_next: string;
  lesson_exercise_all_completed: string;

  lesson_grammar_structural_formula: string;
  lesson_grammar_theoretical_foundation: string;
  lesson_grammar_authentic_examples: string;
  lesson_grammar_common_errors: string;
  lesson_grammar_regional_variation: string;
  lesson_grammar_note: string;
  lesson_grammar_variety_prefix: string;

  lesson_vocab_advanced_lexicon: string;
  lesson_vocab_terms_selected: string;
  lesson_vocab_subtitle: string;
  lesson_vocab_search_placeholder: string;

  lesson_listening_title: string;
  lesson_listening_show_transcript: string;
  lesson_listening_hide_transcript: string;
  lesson_listening_active_tasks: string;

  lesson_speaking_title: string;
  lesson_speaking_subtitle: string;
  lesson_speaking_target: string;
  lesson_speaking_minutes: string;
  lesson_speaking_guiding_questions: string;
  lesson_speaking_recommended_phrases: string;
  lesson_speaking_phonetic_guide: string;
  lesson_speaking_tts_installed: string;
  lesson_speaking_tts_fallback: string;
  lesson_speaking_studio_title: string;
  lesson_speaking_studio_desc: string;
  lesson_speaking_btn_record: string;
  lesson_speaking_btn_stop: string;
  lesson_speaking_rec_unsupported: string;
  lesson_speaking_recording: string;
  lesson_speaking_transcript_title: string;

  lesson_writing_title: string;
  lesson_writing_target: string;
  lesson_writing_words: string;
  lesson_writing_guidelines: string;
  lesson_writing_rubric_c1: string;
  lesson_writing_connectors_title: string;
  lesson_writing_word_counter: string;
  lesson_writing_save_draft: string;
  lesson_writing_draft_saved: string;
  lesson_writing_draft_error: string;
  lesson_writing_copy_text: string;
  lesson_writing_copied: string;
  lesson_writing_placeholder: string;
  lesson_writing_target_reached: string;
  lesson_writing_self_rubric: string;

  lesson_scenarios_empty: string;
  lesson_scenarios_hide_translation: string;
  lesson_scenarios_show_translation: string;

  // Dashboard & Home Page
  dash_loading: string;
  dash_banner_badge: string;
  dash_explanations_in: string;
  dash_greeting_prefix: string;
  dash_greeting_suffix: string;
  dash_today_is: string;
  dash_continue_focus: string;
  dash_streak_title: string;
  dash_streak_days: string;
  dash_srs_due_title: string;
  dash_srs_due_terms: string;
  dash_goal_progress_title: string;
  dash_goal_scheduled: string;
  dash_goal_of: string;
  dash_goal_tip: string;
  dash_goal_achieved: string;
  dash_goal_remaining: string;
  dash_next_lesson_title: string;
  dash_resume_lesson_title: string;
  dash_active_course: string;
  dash_advanced_level: string;
  dash_vocab_stat: string;
  dash_grammar_stat: string;
  dash_time_stat: string;
  dash_start_lesson_btn: string;
  dash_continue_lesson_btn: string;
  dash_courses_overview: string;
  dash_add_course_btn: string;
  dash_active_badge: string;
  dash_activate_btn: string;
  dash_completed_lessons: string;
  dash_study_now_btn: string;
  dash_goal_label: string;
  dash_daily_pace_title: string;
  dash_daily_pace_subtitle: string;
  dash_sprint_5m: string;
  dash_standard_10m: string;
  dash_immersion_20m: string;
  dash_srs_card_title: string;
  dash_srs_card_desc_due: string;
  dash_srs_card_desc_clean: string;
  dash_srs_card_btn: string;
  dash_vocab_card_title: string;
  dash_vocab_card_desc: string;
  dash_vocab_card_btn: string;
  dash_translate_card_title: string;
  dash_translate_card_desc: string;
  dash_translate_card_btn: string;
  dash_recent_activity_title: string;
  dash_accuracy_rate: string;
  dash_attempts_registered: string;
  dash_no_activity: string;
  dash_exercise_label: string;
  dash_cultural_title: string;
  dash_cultural_view_all: string;
  dash_read_label: string;
  dash_reading_time: string;
  dash_add_modal_title: string;
  dash_target_lang_label: string;
  dash_regional_variant_label: string;
  dash_cefr_label: string;
  dash_explanation_label: string;
  dash_cancel_btn: string;
  dash_create_course_btn: string;
}

export const translations: Record<string, TranslationDictionary> = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_home: 'Home',
    nav_learn: 'Learn',
    nav_portuguese: 'Portuguese',
    nav_spanish: 'Spanish',
    nav_english: 'English',
    nav_translate: 'Translation & EN',
    nav_practice: 'Practice & SRS',
    nav_progress: 'Progress',
    nav_settings: 'Settings',
    nav_admin: 'Admin Console',
    nav_sign_in: 'Sign In',
    nav_create_account: 'Create Account',
    nav_sign_out: 'Sign Out',
    nav_guest_mode: 'Guest Mode',
    nav_streak_days: 'days',
    nav_offline_badge: 'Offline Mode',
    nav_explore: 'Worldwide Culture',
    nav_vocabulary: 'Vocabulary & Phrases',
    sync_synced: 'Cloud Synced',
    sync_syncing: 'Syncing Changes...',
    sync_offline: 'Offline Mode',
    sync_error: 'Sync Pending (Offline)',

    explore_title: 'Worldwide Culture & Authentic Discovery',
    explore_subtitle: 'Explore authentic cultural articles, regional festivals, traditions, and news written in Portuguese, Spanish, and English across A1–C1 levels.',
    explore_tab_discover: 'Discover All Content',
    explore_tab_bookmarks: 'My Saved Articles',
    explore_search_placeholder: 'Search by title, country, keywords, or topics...',
    explore_filter_origin: 'Culture Origin Country',
    explore_filter_region: 'Geographic Region',
    explore_filter_content_lang: 'Content Language',
    explore_filter_level: 'CEFR Reading Level',
    explore_filter_topic: 'Cultural Theme',
    explore_filter_all: 'All Content Languages',
    explore_filter_all_regions: 'All Regions',
    explore_filter_all_topics: 'All Themes',
    explore_empty_title: 'No Cultural Articles Found',
    explore_empty_desc: 'No articles currently match your specific filter criteria. You can clear or broaden your filters below.',
    explore_empty_reset: 'Reset All Filters',
    explore_read_article: 'Read Article',
    explore_bookmark_save: 'Save to Bookmarks',
    explore_bookmark_remove: 'Remove Bookmark',
    explore_quiz_title: 'Reading Comprehension Check',
    explore_quiz_check: 'Confirm Answer',
    explore_quiz_correct: 'Correct! Excellent comprehension.',
    explore_quiz_incorrect: 'Incorrect. Review the passage explanation above.',
    explore_quiz_completed: 'All comprehension questions evaluated.',
    explore_glossary_title: 'Key Vocabulary & Idiomatic Expressions',
    explore_tap_word_hint: 'Tip: Tap or click any underlined word in the text to inspect its definition and save to your phrasebook.',
    explore_source_attribution: 'Open Cultural Syllabus & Attribution',
    explore_license_badge: 'Open Educational Content',

    onboarding_title: 'Welcome to Lexilume',
    onboarding_step: 'Step',
    onboarding_skip: 'Skip Setup',
    onboarding_back: 'Back',
    onboarding_continue: 'Continue',
    onboarding_finish: 'Start Learning',
    onboarding_step1_title: 'Master Portuguese & Spanish at C1 Level',
    onboarding_step1_desc: 'An advanced dual-track language learning platform powered by open authentic materials, deterministic spaced repetition, and zero paid AI dependencies.',
    onboarding_step2_title: 'Choose Interface Language',
    onboarding_step2_desc: 'Select the language used for buttons, navigation, and dashboard controls.',
    onboarding_step3_title: 'Choose Primary Target Language',
    onboarding_step3_desc: 'Which language do you want to prioritize in today’s immersion?',
    onboarding_step4_title: 'Choose Explanation & Grammar Language',
    onboarding_step4_desc: 'Which language should be used for linguistic analysis, vocabulary definitions, and grammar formulas?',
    onboarding_step5_title: 'Current CEFR Proficiency Level',
    onboarding_step5_desc: 'Select your current starting level (A1 beginner to C1 advanced). Lessons will adapt accordingly.',
    onboarding_step6_title: 'Daily Learning Commitment',
    onboarding_step6_desc: 'Choose your daily study rhythm. You can change this at any time.',
    onboarding_step7_title: 'You are all set!',
    onboarding_step7_desc: 'Your personalized curriculum is configured and ready. You can study immediately as a guest or create an account to sync across devices.',
    onboarding_launch_sample: 'Open Today’s Sample Lesson',

    auth_sign_in_title: 'Sign In to Your Account',
    auth_sign_up_title: 'Create Your Lexilume Account',
    auth_forgot_password_title: 'Reset Password',
    auth_email_label: 'Email Address',
    auth_password_label: 'Password',
    auth_confirm_password_label: 'Confirm Password',
    auth_full_name_label: 'Full Name',
    auth_remember_me: 'Keep me signed in',
    auth_sign_in_btn: 'Sign In',
    auth_sign_up_btn: 'Create Account',
    auth_reset_btn: 'Send Reset Link',
    auth_no_account: 'Don’t have an account yet? Register here.',
    auth_has_account: 'Already have an account? Sign in.',
    auth_forgot_password_link: 'Forgot password?',
    auth_back_to_sign_in: 'Back to Sign In',
    auth_guest_migration_prompt: 'We noticed you have learning progress and saved vocabulary from your guest session. Would you like to import it into your account?',
    auth_guest_migration_confirm: 'Import Guest Progress',
    auth_guest_migration_skip: 'Start Fresh (Discard Guest Data)',
    auth_password_min_length: 'Password must be at least 8 characters long.',
    auth_password_mismatch: 'Passwords do not match.',
    auth_invalid_email: 'Please provide a valid email address.',
    auth_login_failed: 'Invalid email or password. Please try again.',
    auth_account_disabled: 'This account has been disabled by an administrator.',

    admin_title: 'Administrative Control Center',
    admin_subtitle: 'Secure role-based management, learning analytics, and audit logging under Row-Level Security.',
    admin_tab_dashboard: 'Overview',
    admin_tab_users: 'User Management',
    admin_tab_analytics: 'Learning Analytics',
    admin_tab_audit: 'Audit Log',
    admin_stat_registered_users: 'Registered Learners',
    admin_stat_active_users: 'Active Learners (30d)',
    admin_stat_lessons_completed: 'Lessons Completed',
    admin_stat_guest_sessions: 'Guest Study Sessions',
    admin_search_placeholder: 'Search by email or user ID...',
    admin_filter_status: 'Account Status',
    admin_filter_target_lang: 'Target Language',
    admin_filter_cefr: 'CEFR Level',
    admin_table_user: 'Learner',
    admin_table_email: 'Email',
    admin_table_status: 'Status',
    admin_table_role: 'Role',
    admin_table_created: 'Registered',
    admin_table_actions: 'Actions',
    admin_btn_view_details: 'View Profile',
    admin_btn_disable: 'Disable Account',
    admin_btn_enable: 'Enable Account',
    admin_btn_delete: 'Delete Account',
    admin_btn_make_admin: 'Promote to Admin',
    admin_btn_remove_admin: 'Revoke Admin',
    admin_unauthorized_title: 'Access Restricted (403)',
    admin_unauthorized_desc: 'You do not have administrative privileges to access this area. Administrative roles are enforced server-side via Row-Level Security.',
    admin_unauthorized_btn: 'Return to Dashboard',

    theme_light: 'Light Theme',
    theme_dark: 'Dark Theme',
    theme_system: 'System Default',

    settings_title: 'Learner Preferences & Language Architecture',
    settings_subtitle: 'Configure your independent 4-dimension language matrix, study mode, and notifications.',
    settings_interface_lang: 'Interface Language (UI Chrome)',
    settings_explanation_lang: 'Explanation Language (Pedagogy & Notes)',
    settings_learning_lang: 'Active Learning Language (Target Course)',
    settings_regional_variety: 'Regional Variety (Dialect / Accent)',
    settings_pt_variety: 'Portuguese Variety',
    settings_es_variety: 'Spanish Variety',
    settings_en_variety: 'English Variety',
    settings_decoupled_matrix_title: 'Independent 4-Way Language Separation',
    settings_decoupled_matrix_subtitle: 'Strictly decouple UI navigation, target learning words, grammar explanations, and dialectal varieties.',
    settings_primary_target: 'Primary Target Language',
    settings_theme_label: 'Interface Theme',
    settings_daily_goal_label: 'Daily Session Goal',
    settings_study_mode_title: 'Daily Study Mode',
    settings_study_mode_subtitle: 'Adjust lesson depth based on your daily schedule',
    settings_study_mode_full_title: 'Full C1 Mastery Mode (~45-60 min)',
    settings_study_mode_full_desc: 'Comprehensive 12-section daily syllabus with authentic reading, spoken drills, and essay composition.',
    settings_study_mode_compact_title: 'Compact Review Mode (~15-20 min)',
    settings_study_mode_compact_desc: 'Accelerated core vocabulary, quick exercises, and priority spaced repetition items.',
    settings_email_opt_in_title: 'Daily Lesson Emails (Optional Opt-In)',
    settings_email_opt_in_desc: 'Receive your daily dual Portuguese & Spanish C1 lesson in your inbox every morning. Strictly opt-in.',
    settings_save_btn: 'Save Preferences',
    settings_saved_success: 'Preferences saved successfully!',
    settings_delete_account_title: 'Danger Zone: Account Deletion',
    settings_delete_account_btn: 'Permanently Delete My Account',
    matrix_badge_interface: 'UI',
    matrix_badge_learning: 'TARGET',
    matrix_badge_explanation: 'EXPLAIN',
    matrix_badge_variety: 'VARIETY',

    lesson_reading_title: 'Reading Comprehension',
    lesson_reading_full_article: 'Full Article',
    lesson_reading_hide_translation: 'Hide Translation',
    lesson_reading_show_translation: 'Show Translation',
    lesson_reading_mode_original: 'Original',
    lesson_reading_mode_side_by_side: 'Side by Side',
    lesson_reading_mode_sentence_by_sentence: 'Sentence by Sentence',
    lesson_reading_tap_hint: '💡 Tap any word to inspect definition and save to vocabulary.',
    lesson_reading_word_saved: 'added to your personal vocabulary!',
    lesson_reading_save_error: 'Error saving word locally.',
    lesson_reading_default_definition: 'Vocabulary term from passage',

    lesson_conversation_title: 'Authentic Dialogic Interaction',
    lesson_conversation_pragmatic_notes: 'Pragmatic & Sociolinguistic Notes',

    lesson_false_friend_badge: 'False Friend Alert (PT ↔ ES)',
    lesson_false_friend_meaning: 'Meaning',

    lesson_exercise_label: 'Exercise',
    lesson_exercise_of: 'of',
    lesson_exercise_placeholder: 'Type your answer here...',
    lesson_exercise_hint: 'Hint:',
    lesson_exercise_correct: 'Excellent! Correct answer.',
    lesson_exercise_incorrect_prefix: 'Incorrect:',
    lesson_exercise_expected_prefix: 'Incorrect. Expected answer:',
    lesson_exercise_try_again: 'Try Again',
    lesson_exercise_check: 'Check Answer',
    lesson_exercise_next: 'Next Exercise',
    lesson_exercise_all_completed: '🎉 All exercises completed!',

    lesson_grammar_structural_formula: 'Syntactic Structural Formula',
    lesson_grammar_theoretical_foundation: 'Theoretical Foundation & Application',
    lesson_grammar_authentic_examples: 'Authentic Context Examples',
    lesson_grammar_common_errors: 'Common Learner Errors & Interference to Avoid',
    lesson_grammar_regional_variation: 'Regional Linguistic Variation',
    lesson_grammar_note: 'Note:',
    lesson_grammar_variety_prefix: 'Variety',

    lesson_vocab_advanced_lexicon: 'Advanced Lexicon',
    lesson_vocab_terms_selected: 'selected terms',
    lesson_vocab_subtitle: 'Essential terms with IPA pronunciation, monolingual definitions, and collocations.',
    lesson_vocab_search_placeholder: 'Search term or translation...',

    lesson_listening_title: 'Listening Comprehension & Intonation',
    lesson_listening_show_transcript: 'Reveal Transcript',
    lesson_listening_hide_transcript: 'Hide Transcript',
    lesson_listening_active_tasks: 'Active Listening Roadmap:',

    lesson_speaking_title: 'Advanced Spoken Production',
    lesson_speaking_subtitle: 'Discourse and Argumentation',
    lesson_speaking_target: 'Target:',
    lesson_speaking_minutes: 'minutes',
    lesson_speaking_guiding_questions: 'Guiding Questions for Structure:',
    lesson_speaking_recommended_phrases: 'Recommended C1 Expressions & Connectors:',
    lesson_speaking_phonetic_guide: 'Phonetic & Prosodic Guide:',
    lesson_speaking_tts_installed: 'Native voice synthesis: Voice installed in browser.',
    lesson_speaking_tts_fallback: 'Native voice synthesis: Using system default synthesizer.',
    lesson_speaking_studio_title: 'Interactive Spoken Practice Studio',
    lesson_speaking_studio_desc: 'Record your speech via browser microphone to check clarity and fluency.',
    lesson_speaking_btn_record: 'Record Spoken Practice',
    lesson_speaking_btn_stop: 'Stop Recording',
    lesson_speaking_rec_unsupported: 'Speech recognition unavailable in this browser (Chrome/Edge recommended).',
    lesson_speaking_recording: 'Recording audio... Speak naturally in the target language.',
    lesson_speaking_transcript_title: 'Captured Transcript:',

    lesson_writing_title: 'Argumentative Written Composition',
    lesson_writing_target: 'Target:',
    lesson_writing_words: 'words',
    lesson_writing_guidelines: 'Structural Guidelines:',
    lesson_writing_rubric_c1: 'Evaluation Criteria:',
    lesson_writing_connectors_title: 'Suggested Discourse Connectors (Auto-Detected):',
    lesson_writing_word_counter: 'Word Count:',
    lesson_writing_save_draft: 'Save Draft',
    lesson_writing_draft_saved: 'Draft saved locally to your device!',
    lesson_writing_draft_error: 'Error saving draft.',
    lesson_writing_copy_text: 'Copy Text',
    lesson_writing_copied: 'Copied!',
    lesson_writing_placeholder: 'Draft your composition here using recommended connectors and structures...',
    lesson_writing_target_reached: '✓ Target reached! Review inter-paragraph cohesion.',
    lesson_writing_self_rubric: 'Self-Evaluation Rubric',

    lesson_scenarios_empty: 'No conversation scenarios available at this time.',
    lesson_scenarios_hide_translation: 'Hide Translation',
    lesson_scenarios_show_translation: 'Show Translation',

    // Dashboard & Home Page
    dash_loading: 'Loading dashboard...',
    dash_banner_badge: 'Lexilume Daily Immersion',
    dash_explanations_in: 'Explanations in',
    dash_greeting_prefix: 'Hello',
    dash_greeting_suffix: 'Ready for today\'s goal?',
    dash_today_is: 'Today is',
    dash_continue_focus: 'Keep progressing towards CEFR level',
    dash_streak_title: 'Streak',
    dash_streak_days: 'Days',
    dash_srs_due_title: 'Review',
    dash_srs_due_terms: 'Terms',
    dash_goal_progress_title: 'Daily Goal Progress',
    dash_goal_scheduled: 'min/day scheduled',
    dash_goal_of: 'of',
    dash_goal_tip: 'Consistent study stimulates long-term memory retention.',
    dash_goal_achieved: 'Today\'s goal achieved! 🎉',
    dash_goal_remaining: 'min remaining',
    dash_next_lesson_title: 'Next Lesson of the Day',
    dash_resume_lesson_title: 'Resume In-Progress Lesson',
    dash_active_course: 'Active Course',
    dash_advanced_level: 'Advanced',
    dash_vocab_stat: 'Vocabulary',
    dash_grammar_stat: 'Grammar',
    dash_time_stat: 'Estimated Time',
    dash_start_lesson_btn: 'Start Lesson',
    dash_continue_lesson_btn: 'Continue Where You Left Off',
    dash_courses_overview: 'Courses Overview',
    dash_add_course_btn: 'Add Course',
    dash_active_badge: 'Active',
    dash_activate_btn: 'Activate',
    dash_completed_lessons: 'lessons completed',
    dash_study_now_btn: 'Study Now',
    dash_goal_label: 'Goal',
    dash_daily_pace_title: 'Daily Learning Pace',
    dash_daily_pace_subtitle: 'Adapt the study intensity to your available time today:',
    dash_sprint_5m: '5 min — Quick Sprint',
    dash_standard_10m: '10 min — Ideal Standard',
    dash_immersion_20m: '20 min — C1 Immersion',
    dash_srs_card_title: 'Spaced Repetition (SM-2)',
    dash_srs_card_desc_due: 'You have {count} terms scheduled for review today.',
    dash_srs_card_desc_clean: 'All your review flashcards are up to date for today!',
    dash_srs_card_btn: 'Open Flashcard Deck',
    dash_vocab_card_title: 'Vocabulary Library',
    dash_vocab_card_desc: 'Explore the Top 200 essential words and everyday phrases with explanations in your language.',
    dash_vocab_card_btn: 'Explore Vocabulary & PDF',
    dash_translate_card_title: 'Translator & False Friends',
    dash_translate_card_desc: 'Translate expressions between Portuguese, Spanish, and English with automatic false-cognate detection.',
    dash_translate_card_btn: 'Open Translation Tool',
    dash_recent_activity_title: 'Recent Activity & Accuracy Statistics',
    dash_accuracy_rate: 'Overall Accuracy',
    dash_attempts_registered: 'attempts recorded',
    dash_no_activity: 'No activity recorded yet today. Start by completing exercises from any track!',
    dash_exercise_label: 'Exercise',
    dash_cultural_title: 'Worldwide Cultural Exploration',
    dash_cultural_view_all: 'View Complete Catalog',
    dash_read_label: 'Read',
    dash_reading_time: 'min read',
    dash_add_modal_title: 'Add New Course',
    dash_target_lang_label: 'Target Language (What do you want to learn?)',
    dash_regional_variant_label: 'Regional Variety',
    dash_cefr_label: 'CEFR Level',
    dash_explanation_label: 'Explanations In',
    dash_cancel_btn: 'Cancel',
    dash_create_course_btn: 'Create & Activate Course',
  },

  pt: {
    nav_dashboard: 'Painel',
    nav_home: 'Início',
    nav_learn: 'Aprender',
    nav_portuguese: 'Português',
    nav_spanish: 'Espanhol',
    nav_english: 'Inglês',
    nav_translate: 'Tradução & EN',
    nav_practice: 'Prática & SRS',
    nav_progress: 'Progresso',
    nav_settings: 'Configurações',
    nav_admin: 'Painel Admin',
    nav_sign_in: 'Entrar',
    nav_create_account: 'Criar Conta',
    nav_sign_out: 'Sair',
    nav_guest_mode: 'Modo Visitante',
    nav_streak_days: 'dias',
    nav_offline_badge: 'Modo Offline',
    nav_explore: 'Cultura Mundial',
    nav_vocabulary: 'Vocabulário & Frases',
    sync_synced: 'Sincronizado na Nuvem',
    sync_syncing: 'Sincronizando Alterações...',
    sync_offline: 'Modo Offline',
    sync_error: 'Pendente (Modo Offline)',

    explore_title: 'Cultura Mundial & Descoberta Autêntica',
    explore_subtitle: 'Explore artigos culturais autênticos, festivais regionais, tradições e notícias em português, espanhol e inglês nos níveis A1 a C1.',
    explore_tab_discover: 'Explorar Todo o Acervo',
    explore_tab_bookmarks: 'Meus Artigos Salvos',
    explore_search_placeholder: 'Buscar por título, país de origem, palavras-chave ou temas...',
    explore_filter_origin: 'País de Origem da Cultura',
    explore_filter_region: 'Região Geográfica',
    explore_filter_content_lang: 'Idioma do Conteúdo',
    explore_filter_level: 'Nível CEFR de Leitura',
    explore_filter_topic: 'Tema Cultural',
    explore_filter_all: 'Todos os Idiomas de Conteúdo',
    explore_filter_all_regions: 'Todas as Regiões',
    explore_filter_all_topics: 'Todos os Temas',
    explore_empty_title: 'Nenhum Artigo Cultural Encontrado',
    explore_empty_desc: 'Nenhum conteúdo corresponde aos filtros aplicados. Redefina ou amplie os critérios de busca abaixo.',
    explore_empty_reset: 'Limpar Todos os Filtros',
    explore_read_article: 'Ler Artigo Completo',
    explore_bookmark_save: 'Salvar nos Favoritos',
    explore_bookmark_remove: 'Remover Favorito',
    explore_quiz_title: 'Teste de Interpretação e Inferência',
    explore_quiz_check: 'Confirmar Resposta',
    explore_quiz_correct: 'Correto! Excelente compreensão textual.',
    explore_quiz_incorrect: 'Incorreto. Reveja a explicação pedagógica acima.',
    explore_quiz_completed: 'Todas as questões foram avaliadas.',
    explore_glossary_title: 'Vocabulário Chave & Expressões Idiomáticas',
    explore_tap_word_hint: 'Dica: Toque em qualquer termo sublinhado no texto para ver sua definição e salvar no seu vocabulário pessoal.',
    explore_source_attribution: 'Currículo Cultural Aberto & Licenciamento',
    explore_license_badge: 'Conteúdo Educacional Aberto',

    onboarding_title: 'Bem-vindo ao Lexilume',
    onboarding_step: 'Etapa',
    onboarding_skip: 'Pular Configuração',
    onboarding_back: 'Voltar',
    onboarding_continue: 'Continuar',
    onboarding_finish: 'Começar a Aprender',
    onboarding_step1_title: 'Domine Português e Espanhol no Nível C1',
    onboarding_step1_desc: 'Uma plataforma avançada de aprendizagem bilíngue baseada em fontes abertas autênticas, repetição espaçada determinística e sem dependência de IAs pagas.',
    onboarding_step2_title: 'Escolha o Idioma da Interface',
    onboarding_step2_desc: 'Selecione o idioma utilizado nos menus, botões e controles da plataforma.',
    onboarding_step3_title: 'Escolha seu Idioma Alvo Principal',
    onboarding_step3_desc: 'Qual idioma você deseja priorizar na imersão de hoje?',
    onboarding_step4_title: 'Escolha o Idioma de Explicação e Gramática',
    onboarding_step4_desc: 'Qual idioma prefere para explicações gramaticais, notas e definições de vocabulário?',
    onboarding_step5_title: 'Nível CEFR Atual ou Estimado',
    onboarding_step5_desc: 'Selecione seu nível inicial (A1 iniciante até C1 avançado). O currículo se adaptará a ele.',
    onboarding_step6_title: 'Meta Diária de Dedicação',
    onboarding_step6_desc: 'Defina seu ritmo diário de estudo. Você pode alterar isto a qualquer momento.',
    onboarding_step7_title: 'Tudo pronto!',
    onboarding_step7_desc: 'Seu currículo personalizado está configurado. Você pode estudar imediatamente como visitante ou criar uma conta para sincronizar.',
    onboarding_launch_sample: 'Abrir Lição de Amostra de Hoje',

    auth_sign_in_title: 'Entrar na sua Conta',
    auth_sign_up_title: 'Criar sua Conta Lexilume',
    auth_forgot_password_title: 'Recuperar Senha',
    auth_email_label: 'Endereço de Email',
    auth_password_label: 'Senha',
    auth_confirm_password_label: 'Confirmar Senha',
    auth_full_name_label: 'Nome Completo',
    auth_remember_me: 'Manter-me conectado',
    auth_sign_in_btn: 'Entrar',
    auth_sign_up_btn: 'Criar Conta',
    auth_reset_btn: 'Enviar Link de Recuperação',
    auth_no_account: 'Ainda não tem conta? Cadastre-se aqui.',
    auth_has_account: 'Já possui uma conta? Faça login.',
    auth_forgot_password_link: 'Esqueceu a senha?',
    auth_back_to_sign_in: 'Voltar ao Login',
    auth_guest_migration_prompt: 'Detectamos progresso e vocabulário salvo da sua sessão de visitante. Deseja importá-los para a sua nova conta?',
    auth_guest_migration_confirm: 'Importar Progresso de Visitante',
    auth_guest_migration_skip: 'Iniciar do Zero (Descartar Dados de Visitante)',
    auth_password_min_length: 'A senha deve conter no mínimo 8 caracteres.',
    auth_password_mismatch: 'As senhas informadas não coincidem.',
    auth_invalid_email: 'Por favor, informe um endereço de email válido.',
    auth_login_failed: 'Email ou senha inválidos. Tente novamente.',
    auth_account_disabled: 'Esta conta foi desativada por um administrador.',

    admin_title: 'Centro de Controle Administrativo',
    admin_subtitle: 'Gestão segura baseada em papéis, estatísticas de aprendizagem e log de auditoria com RLS.',
    admin_tab_dashboard: 'Visão Geral',
    admin_tab_users: 'Gestão de Usuários',
    admin_tab_analytics: 'Estatísticas de Aprendizado',
    admin_tab_audit: 'Log de Auditoria',
    admin_stat_registered_users: 'Alunos Registrados',
    admin_stat_active_users: 'Alunos Ativos (30d)',
    admin_stat_lessons_completed: 'Lições Concluídas',
    admin_stat_guest_sessions: 'Sessões de Visitantes',
    admin_search_placeholder: 'Buscar por email ou ID do usuário...',
    admin_filter_status: 'Status da Conta',
    admin_filter_target_lang: 'Idioma Alvo',
    admin_filter_cefr: 'Nível CEFR',
    admin_table_user: 'Aluno',
    admin_table_email: 'Email',
    admin_table_status: 'Status',
    admin_table_role: 'Função',
    admin_table_created: 'Cadastro',
    admin_table_actions: 'Ações',
    admin_btn_view_details: 'Ver Perfil',
    admin_btn_disable: 'Desativar Conta',
    admin_btn_enable: 'Reativar Conta',
    admin_btn_delete: 'Excluir Conta',
    admin_btn_make_admin: 'Promover a Admin',
    admin_btn_remove_admin: 'Revogar Admin',
    admin_unauthorized_title: 'Acesso Restrito (403)',
    admin_unauthorized_desc: 'Você não possui permissões administrativas para acessar esta área. Permissões são validadas estritamente no servidor via Row-Level Security.',
    admin_unauthorized_btn: 'Voltar ao Painel',

    theme_light: 'Tema Claro',
    theme_dark: 'Tema Escuro',
    theme_system: 'Padrão do Sistema',

    settings_title: 'Preferências do Aprendiz & Arquitetura de Idiomas',
    settings_subtitle: 'Configure sua matriz de 4 dimensões de idiomas, modo de estudo diário e notificações.',
    settings_interface_lang: 'Idioma da Interface (Navegação & Menus)',
    settings_explanation_lang: 'Idioma de Explicação (Gramática & Notas)',
    settings_learning_lang: 'Idioma de Aprendizado Ativo (Curso Atual)',
    settings_regional_variety: 'Variedade Regional (Dialeto / Fonética)',
    settings_pt_variety: 'Variedade de Português',
    settings_es_variety: 'Variedade de Espanhol',
    settings_en_variety: 'Variedade de Inglês',
    settings_decoupled_matrix_title: 'Desacoplamento em 4 Dimensões Linguísticas',
    settings_decoupled_matrix_subtitle: 'Separação estrita entre menus da UI, palavras estudadas, notas pedagógicas e variações regionais.',
    settings_primary_target: 'Idioma Alvo Principal',
    settings_theme_label: 'Tema Visual',
    settings_daily_goal_label: 'Meta Diária de Sessão',
    settings_study_mode_title: 'Modo de Estudo Diário',
    settings_study_mode_subtitle: 'Ajuste a profundidade da lição de acordo com sua rotina',
    settings_study_mode_full_title: 'Modo Completo C1 (~45-60 min)',
    settings_study_mode_full_desc: 'Syllabus integral de 12 seções com textos autênticos, produção oral e redação.',
    settings_study_mode_compact_title: 'Modo Compacto (~15-20 min)',
    settings_study_mode_compact_desc: 'Vocabulário essencial, exercícios rápidos e repetição espaçada prioritária.',
    settings_email_opt_in_title: 'Envio Diário de Lições por Email (Opcional)',
    settings_email_opt_in_desc: 'Receba a lição bilíngue C1 todas as manhãs na sua caixa de entrada. Estritamente opcional (opt-in).',
    settings_save_btn: 'Salvar Preferências',
    settings_saved_success: 'Preferências salvas com sucesso!',
    settings_delete_account_title: 'Zona de Perigo: Exclusão de Conta',
    settings_delete_account_btn: 'Excluir Minha Conta Permanentemente',
    matrix_badge_interface: 'UI',
    matrix_badge_learning: 'ALVO',
    matrix_badge_explanation: 'EXPLICAÇÃO',
    matrix_badge_variety: 'VARIANTE',

    lesson_reading_title: 'Compreensão de Texto',
    lesson_reading_full_article: 'Artigo Completo',
    lesson_reading_hide_translation: 'Ocultar Tradução',
    lesson_reading_show_translation: 'Ver Tradução',
    lesson_reading_mode_original: 'Original',
    lesson_reading_mode_side_by_side: 'Lado a Lado',
    lesson_reading_mode_sentence_by_sentence: 'Frase por Frase',
    lesson_reading_tap_hint: '💡 Toque em qualquer palavra para traduzir e salvar no vocabulário pessoal.',
    lesson_reading_word_saved: 'adicionado ao seu vocabulário pessoal!',
    lesson_reading_save_error: 'Erro ao salvar palavra localmente.',
    lesson_reading_default_definition: 'Termo de vocabulário do texto',

    lesson_conversation_title: 'Interação Dialógica Autêntica',
    lesson_conversation_pragmatic_notes: 'Observações Pragmáticas e Registro',

    lesson_false_friend_badge: 'Alerta de Falso Amigo (PT ↔ ES)',
    lesson_false_friend_meaning: 'Significado',

    lesson_exercise_label: 'Exercício',
    lesson_exercise_of: 'de',
    lesson_exercise_placeholder: 'Digite sua resposta aqui...',
    lesson_exercise_hint: 'Dica:',
    lesson_exercise_correct: 'Excelente! Resposta correta.',
    lesson_exercise_incorrect_prefix: 'Incorreto:',
    lesson_exercise_expected_prefix: 'Incorreto. Resposta esperada:',
    lesson_exercise_try_again: 'Tentar Novamente',
    lesson_exercise_check: 'Verificar Resposta',
    lesson_exercise_next: 'Próximo Exercício',
    lesson_exercise_all_completed: '🎉 Todos os exercícios concluídos!',

    lesson_grammar_structural_formula: 'Fórmula Estrutural Sintática',
    lesson_grammar_theoretical_foundation: 'Fundamentação Teórica e Aplicação',
    lesson_grammar_authentic_examples: 'Exemplos Autênticos em Contexto C1',
    lesson_grammar_common_errors: 'Erros Comuns de Alunos e Interferências a Evitar',
    lesson_grammar_regional_variation: 'Variação Linguística Regional',
    lesson_grammar_note: 'Nota:',
    lesson_grammar_variety_prefix: 'Variedade',

    lesson_vocab_advanced_lexicon: 'Léxico Avançado',
    lesson_vocab_terms_selected: 'termos selecionados',
    lesson_vocab_subtitle: 'Termos essenciais com pronúncia IPA, acepções monolíngues e colocações frequentes.',
    lesson_vocab_search_placeholder: 'Buscar termo ou tradução...',

    lesson_listening_title: 'Compreensão Auditiva e Entonação C1',
    lesson_listening_show_transcript: 'Revelar Transcrição',
    lesson_listening_hide_transcript: 'Ocultar Transcrição',
    lesson_listening_active_tasks: 'Roteiro de Escuta Ativa:',

    lesson_speaking_title: 'Produção Oral Avançada C1',
    lesson_speaking_subtitle: 'Discurso e Argumentação',
    lesson_speaking_target: 'Meta:',
    lesson_speaking_minutes: 'minutos',
    lesson_speaking_guiding_questions: 'Questões Norteadoras para Estruturação:',
    lesson_speaking_recommended_phrases: 'Expressões e Conectores C1 Recomendados:',
    lesson_speaking_phonetic_guide: 'Guia Fonético e Prosódico:',
    lesson_speaking_tts_installed: 'Síntese de voz nativa: Voz instalada detectada no navegador.',
    lesson_speaking_tts_fallback: 'Síntese de voz nativa: Utilizando sintetizador padrão do sistema.',
    lesson_speaking_studio_title: 'Estúdio de Prática Oral Interativa',
    lesson_speaking_studio_desc: 'Grave sua fala pelo microfone do navegador para verificar clareza e fluência.',
    lesson_speaking_btn_record: 'Gravar Prática Oral',
    lesson_speaking_btn_stop: 'Parar Gravação',
    lesson_speaking_rec_unsupported: 'Reconhecimento de fala indisponível neste navegador (Chrome/Edge recomendado).',
    lesson_speaking_recording: 'Gravando áudio... Fale naturalmente no idioma de estudo.',
    lesson_speaking_transcript_title: 'Transcrição Capturada:',

    lesson_writing_title: 'Composição Escrita Argumentativa C1',
    lesson_writing_target: 'Meta:',
    lesson_writing_words: 'palavras',
    lesson_writing_guidelines: 'Diretrizes de Estrutura:',
    lesson_writing_rubric_c1: 'Critérios de Avaliação C1:',
    lesson_writing_connectors_title: 'Conectores Discursivos Sugeridos (Reconhecimento Automático):',
    lesson_writing_word_counter: 'Contador de Palavras:',
    lesson_writing_save_draft: 'Salvar Rascunho',
    lesson_writing_draft_saved: 'Rascunho salvo no seu dispositivo com sucesso!',
    lesson_writing_draft_error: 'Erro ao salvar rascunho.',
    lesson_writing_copy_text: 'Copiar Texto',
    lesson_writing_copied: 'Copiado!',
    lesson_writing_placeholder: 'Redija aqui sua composição C1 utilizando os conectores e estruturas recomendados...',
    lesson_writing_target_reached: '✓ Meta atingida! Revise a coesão interparagráfica.',
    lesson_writing_self_rubric: 'Rubrica de Autoavaliação C1',

    lesson_scenarios_empty: 'Nenhum cenário de conversação disponível no momento.',
    lesson_scenarios_hide_translation: 'Ocultar Tradução',
    lesson_scenarios_show_translation: 'Ver Tradução',

    // Dashboard & Home Page
    dash_loading: 'Carregando painel de aprendizagem...',
    dash_banner_badge: 'Imersão Diária Lexilume',
    dash_explanations_in: 'Explicações em',
    dash_greeting_prefix: 'Olá',
    dash_greeting_suffix: 'Pronto para a meta de hoje?',
    dash_today_is: 'Hoje é',
    dash_continue_focus: 'Continue avançando com foco no nível',
    dash_streak_title: 'Ofensiva',
    dash_streak_days: 'Dias',
    dash_srs_due_title: 'Revisão',
    dash_srs_due_terms: 'Termos',
    dash_goal_progress_title: 'Progresso da Meta Diária',
    dash_goal_scheduled: 'min/dia programados',
    dash_goal_of: 'de',
    dash_goal_tip: 'Estudo consistente estimula a retenção de longo prazo.',
    dash_goal_achieved: 'Meta de hoje atingida! 🎉',
    dash_goal_remaining: 'min restantes',
    dash_next_lesson_title: 'Próxima Lição do Dia',
    dash_resume_lesson_title: 'Retomar Lição em Andamento',
    dash_active_course: 'Curso Ativo',
    dash_advanced_level: 'Avançado',
    dash_vocab_stat: 'Vocabulário',
    dash_grammar_stat: 'Gramática',
    dash_time_stat: 'Tempo Estimado',
    dash_start_lesson_btn: 'Iniciar Lição',
    dash_continue_lesson_btn: 'Continuar de Onde Parou',
    dash_courses_overview: 'Visão Geral dos Cursos',
    dash_add_course_btn: 'Adicionar Curso',
    dash_active_badge: 'Ativo',
    dash_activate_btn: 'Ativar',
    dash_completed_lessons: 'lições concluídas',
    dash_study_now_btn: 'Estudar Agora',
    dash_goal_label: 'Meta',
    dash_daily_pace_title: 'Ritmo de Aprendizado Diário',
    dash_daily_pace_subtitle: 'Adapte a intensidade ao tempo disponível hoje:',
    dash_sprint_5m: '5 min — Sprint Rápido',
    dash_standard_10m: '10 min — Padrão Ideal',
    dash_immersion_20m: '20 min — Imersão C1',
    dash_srs_card_title: 'Revisão Espaçada (SM-2)',
    dash_srs_card_desc_due: 'Você tem {count} termos agendados para consolidação hoje.',
    dash_srs_card_desc_clean: 'Todos os seus cartões de revisão estão em dia para hoje!',
    dash_srs_card_btn: 'Abrir Deck de Flashcards',
    dash_vocab_card_title: 'Biblioteca de Vocabulário',
    dash_vocab_card_desc: 'Explore o Top 200 palavras essenciais e frases do cotidiano com explicações no seu idioma.',
    dash_vocab_card_btn: 'Explorar Vocabulário & PDF',
    dash_translate_card_title: 'Tradutor & Falsos Cognatos',
    dash_translate_card_desc: 'Traduza expressões entre Português, Espanhol e Inglês com detecção automática de armadilhas lexicais.',
    dash_translate_card_btn: 'Abrir Ferramenta de Tradução',
    dash_recent_activity_title: 'Atividades Recentes & Estatísticas de Precisão',
    dash_accuracy_rate: 'Acurácia Geral',
    dash_attempts_registered: 'tentativas registradas',
    dash_no_activity: 'Nenhuma atividade registrada ainda hoje. Comece completando os exercícios de uma das trilhas!',
    dash_exercise_label: 'Exercício',
    dash_cultural_title: 'Exploração Cultural do Mundo',
    dash_cultural_view_all: 'Ver Acervo Completo',
    dash_read_label: 'Ler',
    dash_reading_time: 'min de leitura',
    dash_add_modal_title: 'Adicionar Novo Curso',
    dash_target_lang_label: 'Idioma Alvo (O que você quer aprender?)',
    dash_regional_variant_label: 'Variedade Regional',
    dash_cefr_label: 'Nível CEFR',
    dash_explanation_label: 'Explicações em',
    dash_cancel_btn: 'Cancelar',
    dash_create_course_btn: 'Criar e Ativar Curso',
  },

  es: {
    nav_dashboard: 'Panel',
    nav_home: 'Inicio',
    nav_learn: 'Aprender',
    nav_portuguese: 'Portugués',
    nav_spanish: 'Español',
    nav_english: 'Inglés',
    nav_translate: 'Traducción & EN',
    nav_practice: 'Práctica & SRS',
    nav_progress: 'Progreso',
    nav_settings: 'Configuración',
    nav_admin: 'Panel Admin',
    nav_sign_in: 'Iniciar Sesión',
    nav_create_account: 'Crear Cuenta',
    nav_sign_out: 'Cerrar Sesión',
    nav_guest_mode: 'Modo Invitado',
    nav_streak_days: 'días',
    nav_offline_badge: 'Modo Offline',
    nav_explore: 'Cultura Mundial',
    nav_vocabulary: 'Vocabulario & Frases',
    sync_synced: 'Sincronizado en la Nube',
    sync_syncing: 'Sincronizando Cambios...',
    sync_offline: 'Modo Offline',
    sync_error: 'Pendiente (Modo Offline)',

    explore_title: 'Cultura Mundial & Descubrimiento Auténtico',
    explore_subtitle: 'Explore artículos culturales auténticos, fiestas regionales, tradiciones y noticias en portugués, español e inglés para niveles A1 a C1.',
    explore_tab_discover: 'Explorar Todo el Catálogo',
    explore_tab_bookmarks: 'Mis Artículos Guardados',
    explore_search_placeholder: 'Buscar por título, país de origen, palabras clave o temas...',
    explore_filter_origin: 'País de Origen de la Cultura',
    explore_filter_region: 'Región Geográfica',
    explore_filter_content_lang: 'Idioma del Contenido',
    explore_filter_level: 'Nivel CEFR de Lectura',
    explore_filter_topic: 'Tema Cultural',
    explore_filter_all: 'Todos los Idiomas de Contenido',
    explore_filter_all_regions: 'Todas las Regiones',
    explore_filter_all_topics: 'Todos los Temas',
    explore_empty_title: 'No se Encontraron Artículos Culturales',
    explore_empty_desc: 'Ningún artículo coincide con los filtros aplicados. Restablezca o amplíe los criterios de búsqueda a continuación.',
    explore_empty_reset: 'Restablecer Todos los Filtros',
    explore_read_article: 'Leer Artículo Completo',
    explore_bookmark_save: 'Guardar en Favoritos',
    explore_bookmark_remove: 'Quitar de Favoritos',
    explore_quiz_title: 'Prueba de Comprensión e Inferencia',
    explore_quiz_check: 'Confirmar Respuesta',
    explore_quiz_correct: '¡Correcto! Excelente comprensión lectora.',
    explore_quiz_incorrect: 'Incorrecto. Revise la explicación pedagógica arriba.',
    explore_quiz_completed: 'Todas las preguntas han sido evaluadas.',
    explore_glossary_title: 'Vocabulario Clave & Giros Expresivos',
    explore_tap_word_hint: 'Consejo: Toque cualquier término subrayado en el texto para ver su significado y guardarlo en su vocabulario personal.',
    explore_source_attribution: 'Currículo Cultural Abierto & Licencias',
    explore_license_badge: 'Contenido Educativo Abierto',

    onboarding_title: 'Bienvenido a Lexilume',
    onboarding_step: 'Paso',
    onboarding_skip: 'Omitir Configuración',
    onboarding_back: 'Atrás',
    onboarding_continue: 'Continuar',
    onboarding_finish: 'Comenzar a Aprender',
    onboarding_step1_title: 'Domine Portugués y Español a Nivel C1',
    onboarding_step1_desc: 'Una plataforma avanzada de aprendizaje bilingüe basada en fuentes abiertas auténticas, repetición espaciada determinista y sin dependencia de IAs de pago.',
    onboarding_step2_title: 'Elija el Idioma de la Interfaz',
    onboarding_step2_desc: 'Seleccione el idioma utilizado en los menús, botones y controles de la plataforma.',
    onboarding_step3_title: 'Elija su Idioma Objetivo Principal',
    onboarding_step3_desc: '¿Qué idioma desea priorizar en la inmersión de hoy?',
    onboarding_step4_title: 'Elija el Idioma de Explicación y Gramática',
    onboarding_step4_desc: '¿Qué idioma prefiere para análisis lingüístico, notas y definiciones de vocabulario?',
    onboarding_step5_title: 'Nivel CEFR Actual o Estimado',
    onboarding_step5_desc: 'Seleccione su nivel de partida (A1 principiante hasta C1 avanzado). El currículo se adaptará a él.',
    onboarding_step6_title: 'Meta Diaria de Estudio',
    onboarding_step6_desc: 'Defina su ritmo diario de aprendizaje. Puede modificarlo en cualquier momento.',
    onboarding_step7_title: '¡Todo listo!',
    onboarding_step7_desc: 'Su currículo personalizado está configurado. Puede estudiar de inmediato como invitado o crear una cuenta para sincronizar.',
    onboarding_launch_sample: 'Abrir Lección de Muestra de Hoy',

    auth_sign_in_title: 'Iniciar Sesión en su Cuenta',
    auth_sign_up_title: 'Crear Cuenta Lexilume',
    auth_forgot_password_title: 'Restablecer Contraseña',
    auth_email_label: 'Correo Electrónico',
    auth_password_label: 'Contraseña',
    auth_confirm_password_label: 'Confirmar Contraseña',
    auth_full_name_label: 'Nombre Completo',
    auth_remember_me: 'Recordarme',
    auth_sign_in_btn: 'Iniciar Sesión',
    auth_sign_up_btn: 'Crear Cuenta',
    auth_reset_btn: 'Enviar Enlace de Restablecimiento',
    auth_no_account: '¿Aún no tiene cuenta? Regístrese aquí.',
    auth_has_account: '¿Ya tiene una cuenta? Inicie sesión.',
    auth_forgot_password_link: '¿Olvidó su contraseña?',
    auth_back_to_sign_in: 'Volver al Inicio de Sesión',
    auth_guest_migration_prompt: 'Detectamos progreso y vocabulario guardado de su sesión como invitado. ¿Desea importarlo a su cuenta registrada?',
    auth_guest_migration_confirm: 'Importar Progreso de Invitado',
    auth_guest_migration_skip: 'Empezar de Cero (Descartar Datos de Invitado)',
    auth_password_min_length: 'La contraseña debe tener al menos 8 caracteres.',
    auth_password_mismatch: 'Las contraseñas ingresadas no coinciden.',
    auth_invalid_email: 'Por favor, ingrese un correo electrónico válido.',
    auth_login_failed: 'Correo o contraseña incorrectos. Intente nuevamente.',
    auth_account_disabled: 'Esta cuenta ha sido desactivada por un administrador.',

    admin_title: 'Centro de Control Administrativo',
    admin_subtitle: 'Gestión segura basada en roles, analítica de aprendizaje y registro de auditoría con RLS.',
    admin_tab_dashboard: 'Visión General',
    admin_tab_users: 'Gestión de Usuarios',
    admin_tab_analytics: 'Analítica de Aprendizaje',
    admin_tab_audit: 'Registro de Auditoría',
    admin_stat_registered_users: 'Alumnos Registrados',
    admin_stat_active_users: 'Alumnos Activos (30d)',
    admin_stat_lessons_completed: 'Lecciones Completadas',
    admin_stat_guest_sessions: 'Sesiones de Invitados',
    admin_search_placeholder: 'Buscar por correo o ID de usuario...',
    admin_filter_status: 'Estado de Cuenta',
    admin_filter_target_lang: 'Idioma Objetivo',
    admin_filter_cefr: 'Nivel CEFR',
    admin_table_user: 'Alumno',
    admin_table_email: 'Correo',
    admin_table_status: 'Estado',
    admin_table_role: 'Rol',
    admin_table_created: 'Registro',
    admin_table_actions: 'Acciones',
    admin_btn_view_details: 'Ver Perfil',
    admin_btn_disable: 'Desactivar Cuenta',
    admin_btn_enable: 'Reactivar Cuenta',
    admin_btn_delete: 'Eliminar Cuenta',
    admin_btn_make_admin: 'Promover a Admin',
    admin_btn_remove_admin: 'Revocar Admin',
    admin_unauthorized_title: 'Acceso Restringido (403)',
    admin_unauthorized_desc: 'No posee privilegios administrativos para acceder a esta área. Los roles se validan estrictamente en el servidor mediante Row-Level Security.',
    admin_unauthorized_btn: 'Volver al Panel',

    theme_light: 'Tema Claro',
    theme_dark: 'Tema Oscuro',
    theme_system: 'Predeterminado del Sistema',

    settings_title: 'Preferencias del Alumno & Arquitectura de Idiomas',
    settings_subtitle: 'Configure su matriz de 4 dimensiones de idiomas, modo de estudio diario y notificaciones.',
    settings_interface_lang: 'Idioma de la Interfaz (Navegación & Menús)',
    settings_explanation_lang: 'Idioma de Explicación (Gramática & Notas)',
    settings_learning_lang: 'Idioma de Aprendizaje Activo (Curso Actual)',
    settings_regional_variety: 'Variedad Regional (Dialecto / Acento)',
    settings_pt_variety: 'Variedad de Portugués',
    settings_es_variety: 'Variedad de Español',
    settings_en_variety: 'Variedad de Inglés',
    settings_decoupled_matrix_title: 'Desacoplamiento en 4 Dimensiones Lingüísticas',
    settings_decoupled_matrix_subtitle: 'Separación estricta entre menús de la interfaz, palabras estudiadas, notas pedagógicas y variedades dialectales.',
    settings_primary_target: 'Idioma Objetivo Principal',
    settings_theme_label: 'Tema Visual',
    settings_daily_goal_label: 'Meta Diaria de Sesión',
    settings_study_mode_title: 'Modo de Estudio Diario',
    settings_study_mode_subtitle: 'Ajuste la intensidad de la lección según su tiempo diario',
    settings_study_mode_full_title: 'Modo Completo C1 (~45-60 min)',
    settings_study_mode_full_desc: 'Syllabus integral de 12 secciones con lecturas auténticas, práctica oral y redacción argumentativa.',
    settings_study_mode_compact_title: 'Modo Compacto (~15-20 min)',
    settings_study_mode_compact_desc: 'Vocabulario esencial, ejercicios rápidos y repaso espaciado prioritario.',
    settings_email_opt_in_title: 'Envío Diario de Lecciones por Correo (Opcional)',
    settings_email_opt_in_desc: 'Reciba su lección bilingüe C1 cada mañana en su bandeja de entrada. Estrictamente opcional (opt-in).',
    settings_save_btn: 'Guardar Preferencias',
    settings_saved_success: '¡Preferencias guardadas con éxito!',
    settings_delete_account_title: 'Zona de Riesgo: Eliminación de Cuenta',
    settings_delete_account_btn: 'Eliminar Mi Cuenta Permanentemente',
    matrix_badge_interface: 'UI',
    matrix_badge_learning: 'OBJETIVO',
    matrix_badge_explanation: 'EXPLICACIÓN',
    matrix_badge_variety: 'VARIANTE',

    lesson_reading_title: 'Comprensión de Lectura',
    lesson_reading_full_article: 'Artículo Completo',
    lesson_reading_hide_translation: 'Ocultar Traducción',
    lesson_reading_show_translation: 'Ver Traducción',
    lesson_reading_mode_original: 'Original',
    lesson_reading_mode_side_by_side: 'Lado a Lado',
    lesson_reading_mode_sentence_by_sentence: 'Frase por Frase',
    lesson_reading_tap_hint: '💡 Toque cualquier palabra para ver la definición y guardarla en su vocabulario.',
    lesson_reading_word_saved: '¡agregado a su vocabulario personal!',
    lesson_reading_save_error: 'Error al guardar palabra localmente.',
    lesson_reading_default_definition: 'Término de vocabulario del texto',

    lesson_conversation_title: 'Interacción Dialógica Auténtica',
    lesson_conversation_pragmatic_notes: 'Observaciones Pragmáticas y Registro',

    lesson_false_friend_badge: 'Alerta de Falso Amigo (PT ↔ ES)',
    lesson_false_friend_meaning: 'Significado',

    lesson_exercise_label: 'Ejercicio',
    lesson_exercise_of: 'de',
    lesson_exercise_placeholder: 'Escriba su respuesta aquí...',
    lesson_exercise_hint: 'Pista:',
    lesson_exercise_correct: '¡Excelente! Respuesta correcta.',
    lesson_exercise_incorrect_prefix: 'Incorrecto:',
    lesson_exercise_expected_prefix: 'Incorrecto. Respuesta esperada:',
    lesson_exercise_try_again: 'Intentar de Nuevo',
    lesson_exercise_check: 'Comprobar Respuesta',
    lesson_exercise_next: 'Siguiente Ejercicio',
    lesson_exercise_all_completed: '🎉 ¡Todos los ejercicios completados!',

    lesson_grammar_structural_formula: 'Fórmula Estructural Sintáctica',
    lesson_grammar_theoretical_foundation: 'Fundamentación Teórica y Aplicación',
    lesson_grammar_authentic_examples: 'Ejemplos Auténticos en Contexto C1',
    lesson_grammar_common_errors: 'Errores Comunes de Alumnos e Interferencias a Evitar',
    lesson_grammar_regional_variation: 'Variación Lingüística Regional',
    lesson_grammar_note: 'Nota:',
    lesson_grammar_variety_prefix: 'Variedad',

    lesson_vocab_advanced_lexicon: 'Léxico Avanzado',
    lesson_vocab_terms_selected: 'términos seleccionados',
    lesson_vocab_subtitle: 'Términos esenciales con pronunciación IPA, acepciones monolingües y colocaciones frecuentes.',
    lesson_vocab_search_placeholder: 'Buscar término o traducción...',

    lesson_listening_title: 'Comprensión Auditiva y Entonación',
    lesson_listening_show_transcript: 'Revelar Transcripción',
    lesson_listening_hide_transcript: 'Ocultar Transcripción',
    lesson_listening_active_tasks: 'Guía de Escucha Activa:',

    lesson_speaking_title: 'Producción Oral Avanzada C1',
    lesson_speaking_subtitle: 'Discurso y Argumentación',
    lesson_speaking_target: 'Meta:',
    lesson_speaking_minutes: 'minutos',
    lesson_speaking_guiding_questions: 'Preguntas Guía para Estructuración:',
    lesson_speaking_recommended_phrases: 'Expresiones y Conectores Recomendados:',
    lesson_speaking_phonetic_guide: 'Guía Fonética y Prosódica:',
    lesson_speaking_tts_installed: 'Síntesis de voz nativa: Voz instalada detectada en el navegador.',
    lesson_speaking_tts_fallback: 'Síntesis de voz nativa: Utilizando sintetizador predeterminado del sistema.',
    lesson_speaking_studio_title: 'Estudio de Práctica Oral Interactiva',
    lesson_speaking_studio_desc: 'Grabe su voz mediante el micrófono del navegador para evaluar fluidez y articulación.',
    lesson_speaking_btn_record: 'Grabar Práctica Oral',
    lesson_speaking_btn_stop: 'Detener Grabación',
    lesson_speaking_rec_unsupported: 'Reconocimiento de voz no disponible en este navegador (se recomienda Chrome/Edge).',
    lesson_speaking_recording: 'Grabando audio... Hable con naturalidad en el idioma de estudio.',
    lesson_speaking_transcript_title: 'Transcripción Capturada:',

    lesson_writing_title: 'Composición Escrita Argumentativa C1',
    lesson_writing_target: 'Meta:',
    lesson_writing_words: 'palabras',
    lesson_writing_guidelines: 'Directrices de Estructura:',
    lesson_writing_rubric_c1: 'Criterios de Evaluación C1:',
    lesson_writing_connectors_title: 'Conectores Discursivos Sugeridos (Reconocimiento Automático):',
    lesson_writing_word_counter: 'Contador de Palabras:',
    lesson_writing_save_draft: 'Guardar Borrador',
    lesson_writing_draft_saved: '¡Borrador guardado localmente en su dispositivo!',
    lesson_writing_draft_error: 'Error al guardar borrador.',
    lesson_writing_copy_text: 'Copiar Texto',
    lesson_writing_copied: '¡Copiado!',
    lesson_writing_placeholder: 'Redacte aquí su composición C1 utilizando los conectores y estructuras recomendados...',
    lesson_writing_target_reached: '✓ ¡Meta alcanzada! Revise la cohesión interparrafal.',
    lesson_writing_self_rubric: 'Rúbrica de Autoevaluación C1',

    lesson_scenarios_empty: 'No hay escenarios de conversación disponibles por el momento.',
    lesson_scenarios_hide_translation: 'Ocultar Traducción',
    lesson_scenarios_show_translation: 'Ver Traducción',

    // Dashboard & Home Page
    dash_loading: 'Cargando panel de aprendizaje...',
    dash_banner_badge: 'Inmersión Diaria Lexilume',
    dash_explanations_in: 'Explicaciones en',
    dash_greeting_prefix: '¡Hola',
    dash_greeting_suffix: '¿Listo para el objetivo de hoy?',
    dash_today_is: 'Hoy es',
    dash_continue_focus: 'Sigue avanzando con enfoque en el nivel',
    dash_streak_title: 'Racha',
    dash_streak_days: 'Días',
    dash_srs_due_title: 'Repaso',
    dash_srs_due_terms: 'Términos',
    dash_goal_progress_title: 'Progreso del Objetivo Diario',
    dash_goal_scheduled: 'min/día programados',
    dash_goal_of: 'de',
    dash_goal_tip: 'El estudio constante estimula la retención a largo plazo.',
    dash_goal_achieved: '¡Objetivo de hoy completado! 🎉',
    dash_goal_remaining: 'min restantes',
    dash_next_lesson_title: 'Próxima Lección del Día',
    dash_resume_lesson_title: 'Reanudar Lección en Curso',
    dash_active_course: 'Curso Activo',
    dash_advanced_level: 'Avanzado',
    dash_vocab_stat: 'Vocabulario',
    dash_grammar_stat: 'Gramática',
    dash_time_stat: 'Tiempo Estimado',
    dash_start_lesson_btn: 'Iniciar Lección',
    dash_continue_lesson_btn: 'Continuar Donde lo Dejaste',
    dash_courses_overview: 'Visión General de los Cursos',
    dash_add_course_btn: 'Añadir Curso',
    dash_active_badge: 'Activo',
    dash_activate_btn: 'Activar',
    dash_completed_lessons: 'lecciones completadas',
    dash_study_now_btn: 'Estudiar Ahora',
    dash_goal_label: 'Meta',
    dash_daily_pace_title: 'Ritmo de Aprendizaje Diario',
    dash_daily_pace_subtitle: 'Adapta la intensidad al tiempo disponible hoy:',
    dash_sprint_5m: '5 min — Sprint Rápido',
    dash_standard_10m: '10 min — Estándar Ideal',
    dash_immersion_20m: '20 min — Inmersión C1',
    dash_srs_card_title: 'Repaso Espaciado (SM-2)',
    dash_srs_card_desc_due: 'Tienes {count} términos programados para consolidación hoy.',
    dash_srs_card_desc_clean: '¡Todas tus tarjetas de repaso están al día hoy!',
    dash_srs_card_btn: 'Abrir Baraja de Flashcards',
    dash_vocab_card_title: 'Biblioteca de Vocabulario',
    dash_vocab_card_desc: 'Explora las Top 200 palabras esenciales y frases cotidianas con explicaciones en tu idioma.',
    dash_vocab_card_btn: 'Explorar Vocabulario & PDF',
    dash_translate_card_title: 'Traductor & Falsos Amigos',
    dash_translate_card_desc: 'Traduce expresiones entre portugués, español e inglés con detección automática de falsos amigos.',
    dash_translate_card_btn: 'Abrir Herramienta de Traducción',
    dash_recent_activity_title: 'Actividad Reciente y Estadísticas de Precisión',
    dash_accuracy_rate: 'Precisión General',
    dash_attempts_registered: 'intentos registrados',
    dash_no_activity: 'No hay actividades registradas hoy. ¡Comienza completando ejercicios en cualquiera de los cursos!',
    dash_exercise_label: 'Ejercicio',
    dash_cultural_title: 'Exploración Cultural del Mundo',
    dash_cultural_view_all: 'Ver Catálogo Completo',
    dash_read_label: 'Leer',
    dash_reading_time: 'min de lectura',
    dash_add_modal_title: 'Añadir Nuevo Curso',
    dash_target_lang_label: 'Idioma Objetivo (¿Qué quieres aprender?)',
    dash_regional_variant_label: 'Variedad Regional',
    dash_cefr_label: 'Nivel CEFR',
    dash_explanation_label: 'Explicaciones en',
    dash_cancel_btn: 'Cancelar',
    dash_create_course_btn: 'Crear y Activar Curso',
  },
};
