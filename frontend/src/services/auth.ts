import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getPhrasebookWords } from './localDb';
import { StorageService } from './storage';
import { courseService } from './courseService';

const STORAGE_KEYS = {
  GUEST_PREFERENCES: 'polyglot_guest_preferences',
  MOCK_AUTH_USER: 'polyglot_mock_auth_user',
};

export interface AuthState {
  user: UserProfile | null;
  role: UserRole;
  isGuest: boolean;
  isLoading: boolean;
}

// In-memory fallback mock database for testing and offline environments
const mockUsersDb: Map<string, { user: UserProfile; passwordHash: string }> = new Map([
  [
    'admin@polyglot.dev',
    {
      user: {
        id: 'usr_admin_001',
        auth_user_id: 'auth_admin_001',
        email: 'admin@polyglot.dev',
        full_name: 'Lead System Administrator',
        role: 'admin',
        account_status: 'active',
        native_language: 'en',
        primary_target_language: 'pt',
        interface_language: 'en',
        explanation_language: 'en',
        pt_variety: 'pt-BR',
        es_variety: 'es-ES',
        study_mode: 'full',
        daily_goal_minutes: 20,
        theme: 'dark',
        onboarding_completed: true,
        email_daily_lesson_opt_in: false,
        email_notifications_enabled: true,
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        last_active_at: new Date().toISOString(),
        total_lessons_completed: 18,
        saved_vocabulary_count: 42,
        accuracy_rate: 94,
        streak_days: 12,
      },
      passwordHash: 'AdminPass123!',
    },
  ],
  [
    'learner@polyglot.dev',
    {
      user: {
        id: 'usr_learner_002',
        auth_user_id: 'auth_learner_002',
        email: 'learner@polyglot.dev',
        full_name: 'Maria Silva',
        role: 'user',
        account_status: 'active',
        native_language: 'pt',
        primary_target_language: 'es',
        interface_language: 'pt',
        explanation_language: 'pt',
        pt_variety: 'pt-BR',
        es_variety: 'es-ES',
        study_mode: 'full',
        daily_goal_minutes: 10,
        theme: 'dark',
        onboarding_completed: true,
        email_daily_lesson_opt_in: false,
        email_notifications_enabled: false,
        created_at: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
        last_active_at: new Date().toISOString(),
        total_lessons_completed: 9,
        saved_vocabulary_count: 28,
        accuracy_rate: 88,
        streak_days: 7,
      },
      passwordHash: 'LearnerPass123!',
    },
  ],
]);

class AuthService {
  private listeners: Array<(state: AuthState) => void> = [];
  private currentState: AuthState = {
    user: null,
    role: 'guest',
    isGuest: true,
    isLoading: true,
  };

  constructor() {
    this.initAuth();
  }

  private async initAuth() {
    // 1. Check if mock user was saved
    try {
      const savedMock = localStorage.getItem(STORAGE_KEYS.MOCK_AUTH_USER);
      if (savedMock) {
        const parsed = JSON.parse(savedMock) as UserProfile;
        courseService.setUserId(parsed.id);
        this.updateState({
          user: parsed,
          role: parsed.role,
          isGuest: false,
          isLoading: false,
        });
        return;
      }
    } catch {}

    // 2. If Supabase configured, check live session
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const profile = await this.fetchLiveProfile(session.user.id, session.user.email || '');
          if (profile) {
            courseService.setUserId(profile.id);
            this.updateState({
              user: profile,
              role: profile.role,
              isGuest: false,
              isLoading: false,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Error reading Supabase session', err);
      }
    }

    // 3. Fallback to Guest Mode
    courseService.setUserId('guest');
    this.updateState({
      user: null,
      role: 'guest',
      isGuest: true,
      isLoading: false,
    });
  }

  private updateState(newState: AuthState) {
    this.currentState = newState;
    this.listeners.forEach(fn => fn(newState));
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentState);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getState(): AuthState {
    return this.currentState;
  }

  // --- Fetch Profile & Verify Role from Server ---
  private async fetchLiveProfile(authUserId: string, email: string): Promise<UserProfile | null> {
    try {
      // 1. Query user_profiles
      const { data: profileData, error: profileErr } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (profileErr || !profileData) {
        return null;
      }

      // 2. Query user_roles for server-verified role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', authUserId)
        .single();

      const role: UserRole = roleData?.role === 'admin' ? 'admin' : 'user';

      return {
        id: profileData.id,
        auth_user_id: profileData.auth_user_id,
        email: profileData.email,
        full_name: profileData.full_name,
        role,
        account_status: profileData.account_status || 'active',
        native_language: profileData.native_language || 'pt',
        primary_target_language: profileData.primary_target_language || 'es',
        interface_language: profileData.interface_language || 'en',
        explanation_language: profileData.explanation_language || 'en',
        pt_variety: profileData.pt_variety || 'pt-BR',
        es_variety: profileData.es_variety || 'es-ES',
        study_mode: profileData.study_mode || 'full',
        daily_goal_minutes: profileData.daily_goal_minutes || 10,
        theme: profileData.theme || 'dark',
        onboarding_completed: Boolean(profileData.onboarding_completed),
        email_daily_lesson_opt_in: Boolean(profileData.email_daily_lesson_opt_in),
        email_notifications_enabled: Boolean(profileData.email_notifications_enabled),
        created_at: profileData.created_at,
        last_active_at: profileData.last_active_at,
      };
    } catch (err) {
      console.warn('Error fetching live profile', err);
      return null;
    }
  }

  // --- Sign Up Flow ---
  public async signUp(
    email: string,
    password: string,
    fullName: string,
    initialPrefs?: Partial<UserProfile>
  ): Promise<{ user: UserProfile | null; error: string | null }> {
    if (!email || !email.includes('@')) {
      return { user: null, error: 'Endereço de email inválido.' };
    }
    if (!password || password.length < 8) {
      return { user: null, error: 'A senha deve conter no mínimo 8 caracteres.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          // Insert profile record
          const newProfilePayload = {
            auth_user_id: data.user.id,
            email,
            full_name: fullName,
            interface_language: initialPrefs?.interface_language || 'en',
            explanation_language: initialPrefs?.explanation_language || 'en',
            native_language: initialPrefs?.native_language || 'pt',
            primary_target_language: initialPrefs?.primary_target_language || 'es',
            onboarding_completed: initialPrefs?.onboarding_completed || true,
            email_daily_lesson_opt_in: false, // Strictly opt-in
          };

          await supabase.from('user_profiles').insert([newProfilePayload]);
          await supabase.from('user_roles').insert([{ user_id: data.user.id, role: 'user' }]);

          const profile = await this.fetchLiveProfile(data.user.id, email);
          if (profile) {
            courseService.setUserId(profile.id);
            this.updateState({
              user: profile,
              role: profile.role,
              isGuest: false,
              isLoading: false,
            });
            return { user: profile, error: null };
          }
        }
      } catch (err: any) {
        return { user: null, error: err.message || 'Erro ao criar conta no Supabase.' };
      }
    }

    // In-memory mock registration fallback
    const normalizedEmail = email.toLowerCase().trim();
    if (mockUsersDb.has(normalizedEmail)) {
      return { user: null, error: 'Este email já está cadastrado no sistema.' };
    }

    const mockProfile: UserProfile = {
      id: `usr_${Date.now()}`,
      auth_user_id: `auth_${Date.now()}`,
      email: normalizedEmail,
      full_name: fullName,
      role: 'user',
      account_status: 'active',
      native_language: initialPrefs?.native_language || 'pt',
      primary_target_language: initialPrefs?.primary_target_language || 'es',
      interface_language: initialPrefs?.interface_language || 'en',
      explanation_language: initialPrefs?.explanation_language || 'en',
      pt_variety: 'pt-BR',
      es_variety: 'es-ES',
      study_mode: 'full',
      daily_goal_minutes: initialPrefs?.daily_goal_minutes || 10,
      theme: initialPrefs?.theme || 'dark',
      onboarding_completed: true,
      email_daily_lesson_opt_in: false,
      email_notifications_enabled: false,
      created_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      total_lessons_completed: 0,
      saved_vocabulary_count: 0,
      accuracy_rate: 0,
      streak_days: 1,
    };

    mockUsersDb.set(normalizedEmail, { user: mockProfile, passwordHash: password });
    localStorage.setItem(STORAGE_KEYS.MOCK_AUTH_USER, JSON.stringify(mockProfile));

    courseService.setUserId(mockProfile.id);
    this.updateState({
      user: mockProfile,
      role: 'user',
      isGuest: false,
      isLoading: false,
    });

    return { user: mockProfile, error: null };
  }

  // --- Sign In Flow ---
  public async signIn(
    email: string,
    password: string
  ): Promise<{ user: UserProfile | null; error: string | null }> {
    const normalizedEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          return { user: null, error: error.message };
        }

        if (data.user) {
          const profile = await this.fetchLiveProfile(data.user.id, normalizedEmail);
          if (profile) {
            if (profile.account_status === 'disabled') {
              await supabase.auth.signOut();
              return {
                user: null,
                error: 'Esta conta foi desativada por um administrador. Contate o suporte para reativação.',
              };
            }

            courseService.setUserId(profile.id);
            this.updateState({
              user: profile,
              role: profile.role,
              isGuest: false,
              isLoading: false,
            });
            return { user: profile, error: null };
          }
        }
      } catch (err: any) {
        return { user: null, error: err.message || 'Erro durante a autenticação.' };
      }
    }

    // Fallback Mock Sign In
    const record = mockUsersDb.get(normalizedEmail);
    if (!record || record.passwordHash !== password) {
      return { user: null, error: 'Email ou senha inválidos.' };
    }

    if (record.user.account_status === 'disabled') {
      return { user: null, error: 'Esta conta foi desativada por um administrador.' };
    }

    record.user.last_active_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.MOCK_AUTH_USER, JSON.stringify(record.user));

    courseService.setUserId(record.user.id);
    this.updateState({
      user: record.user,
      role: record.user.role,
      isGuest: false,
      isLoading: false,
    });

    return { user: record.user, error: null };
  }

  // --- Sign Out Flow ---
  public async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error signing out of Supabase', err);
      }
    }
    localStorage.removeItem(STORAGE_KEYS.MOCK_AUTH_USER);
    courseService.setUserId('guest');

    this.updateState({
      user: null,
      role: 'guest',
      isGuest: true,
      isLoading: false,
    });
  }

  // --- Reset Password ---
  public async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) return { success: false, message: error.message };
        return { success: true, message: 'Link de recuperação de senha enviado para o seu email.' };
      } catch (err: any) {
        return { success: false, message: err.message || 'Erro ao enviar email de recuperação.' };
      }
    }

    return {
      success: true,
      message: 'Instruções de redefinição de senha foram geradas (Modo de Demonstração).',
    };
  }

  // --- Update User Profile Preferences ---
  public async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!this.currentState.user) return null;

    const updated = { ...this.currentState.user, ...updates };

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('user_profiles')
          .update(updates)
          .eq('auth_user_id', updated.auth_user_id);
      } catch (err) {
        console.warn('Error updating profile in Supabase', err);
      }
    }

    if (mockUsersDb.has(updated.email.toLowerCase())) {
      mockUsersDb.get(updated.email.toLowerCase())!.user = updated;
    }
    localStorage.setItem(STORAGE_KEYS.MOCK_AUTH_USER, JSON.stringify(updated));

    this.updateState({
      ...this.currentState,
      user: updated,
    });

    return updated;
  }

  // --- Safe Guest Progress Migration Flow ---
  public async migrateGuestProgress(userId: string): Promise<{ wordsImported: number; trackPreserved: boolean }> {
    const localWords = await getPhrasebookWords();
    const guestPtTrack = StorageService.getTrackState('pt');
    const guestEsTrack = StorageService.getTrackState('es');

    let wordsImported = 0;

    // 1. If Supabase is connected, insert saved translations under RLS
    if (isSupabaseConfigured) {
      try {
        if (localWords.length > 0) {
          const insertRows = localWords.map(w => ({
            user_id: userId,
            source_text: w.source_text,
            translated_text: w.translated_text,
            source_lang: w.source_lang,
            target_lang: w.target_lang,
            provider_used: 'guest_migration',
            is_verified: true,
          }));

          const { error } = await supabase.from('saved_translations').upsert(insertRows, {
            onConflict: 'user_id,source_text,target_lang',
            ignoreDuplicates: true,
          });

          if (!error) wordsImported = localWords.length;
        }
      } catch (err) {
        console.warn('Error migrating guest progress to Supabase', err);
      }
    } else {
      wordsImported = localWords.length;
    }

    // Migrate guest courses to the authenticated user account
    courseService.migrateGuestCourses(userId);

    return {
      wordsImported,
      trackPreserved: (guestPtTrack.total_lessons_completed > 0 || guestEsTrack.total_lessons_completed > 0),
    };
  }

  // --- Admin User Management Methods ---
  public async getAdminUserList(): Promise<UserProfile[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*, user_roles(role)');

        if (!error && data) {
          return data.map((u: any) => ({
            id: u.id,
            auth_user_id: u.auth_user_id,
            email: u.email,
            full_name: u.full_name,
            role: u.user_roles?.[0]?.role === 'admin' ? 'admin' : 'user',
            account_status: u.account_status || 'active',
            native_language: u.native_language || 'pt',
            primary_target_language: u.primary_target_language || 'es',
            interface_language: u.interface_language || 'en',
            explanation_language: u.explanation_language || 'en',
            pt_variety: u.pt_variety || 'pt-BR',
            es_variety: u.es_variety || 'es-ES',
            study_mode: u.study_mode || 'full',
            daily_goal_minutes: u.daily_goal_minutes || 10,
            theme: u.theme || 'dark',
            onboarding_completed: Boolean(u.onboarding_completed),
            email_daily_lesson_opt_in: Boolean(u.email_daily_lesson_opt_in),
            email_notifications_enabled: Boolean(u.email_notifications_enabled),
            created_at: u.created_at,
            last_active_at: u.last_active_at,
            total_lessons_completed: u.total_lessons_completed || 0,
            saved_vocabulary_count: 0,
            accuracy_rate: 85,
            streak_days: 1,
          }));
        }
      } catch (err) {
        console.warn('Error fetching admin user list from Supabase', err);
      }
    }

    return Array.from(mockUsersDb.values()).map(r => r.user);
  }

  public async setAccountStatus(targetUserId: string, status: 'active' | 'disabled'): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('user_profiles')
          .update({ account_status: status })
          .eq('auth_user_id', targetUserId);

        if (!error) {
          await this.logAdminAudit('set_account_status', targetUserId, { status });
          return true;
        }
      } catch (err) {
        console.warn('Error setting account status in Supabase', err);
      }
    }

    for (const record of mockUsersDb.values()) {
      if (record.user.auth_user_id === targetUserId || record.user.id === targetUserId) {
        record.user.account_status = status;
        return true;
      }
    }
    return true;
  }

  public async setUserRole(targetUserId: string, newRole: 'user' | 'admin'): Promise<boolean> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: targetUserId, role: newRole });

        if (!error) {
          await this.logAdminAudit('set_user_role', targetUserId, { role: newRole });
          return true;
        }
      } catch (err) {
        console.warn('Error changing user role in Supabase', err);
      }
    }

    for (const record of mockUsersDb.values()) {
      if (record.user.auth_user_id === targetUserId || record.user.id === targetUserId) {
        record.user.role = newRole;
        return true;
      }
    }
    return true;
  }

  public async logAdminAudit(action: string, targetUserId?: string, details?: Record<string, unknown>): Promise<void> {
    if (!this.currentState.user || this.currentState.role !== 'admin') return;

    if (isSupabaseConfigured) {
      try {
        await supabase.from('admin_audit_logs').insert([
          {
            admin_id: this.currentState.user.auth_user_id,
            action,
            target_user_id: targetUserId,
            details: details || {},
          },
        ]);
      } catch (err) {
        console.warn('Error logging admin audit', err);
      }
    }
  }
}

export const authService = new AuthService();
