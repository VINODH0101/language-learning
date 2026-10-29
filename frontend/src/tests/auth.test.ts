import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../services/auth';
import { savePhrasebookWord, getPhrasebookWords } from '../services/localDb';

describe('AuthService (Access Modes: Guest, Registered, Admin)', () => {
  beforeEach(async () => {
    await authService.signOut();
    localStorage.clear();
  });

  it('initializes in Guest Mode by default without requiring an account', () => {
    const state = authService.getState();
    expect(state.isGuest).toBe(true);
    expect(state.user).toBeNull();
    expect(state.role).toBe('guest');
  });

  it('allows a guest to register an account with validation', async () => {
    // 1. Password under 8 chars rejected
    const weakPassRes = await authService.signUp(
      'newuser@polyglot.dev',
      'short',
      'New Learner'
    );
    expect(weakPassRes.user).toBeNull();
    expect(weakPassRes.error).toContain('mínimo 8 caracteres');

    // 2. Invalid email rejected
    const invalidEmailRes = await authService.signUp(
      'notanemail',
      'StrongPassword123!',
      'New Learner'
    );
    expect(invalidEmailRes.user).toBeNull();
    expect(invalidEmailRes.error).toContain('email');

    // 3. Successful registration
    const successRes = await authService.signUp(
      'learner_test@polyglot.dev',
      'StrongPassword123!',
      'Carlos Mendes'
    );
    expect(successRes.error).toBeNull();
    expect(successRes.user).not.toBeNull();
    expect(successRes.user?.email).toBe('learner_test@polyglot.dev');
    expect(successRes.user?.role).toBe('user');
    expect(authService.getState().isGuest).toBe(false);
  });

  it('rejects duplicate email registrations safely', async () => {
    await authService.signUp(
      'duplicate@polyglot.dev',
      'ValidPassword123!',
      'First User'
    );

    const dupRes = await authService.signUp(
      'duplicate@polyglot.dev',
      'OtherPassword123!',
      'Second User'
    );
    expect(dupRes.user).toBeNull();
    expect(dupRes.error).toContain('já está cadastrado');
  });

  it('authenticates registered users and prevents invalid credentials', async () => {
    // 1. Invalid login attempt
    const invalidRes = await authService.signIn('nonexistent@polyglot.dev', 'WrongPass');
    expect(invalidRes.user).toBeNull();
    expect(invalidRes.error).toBeDefined();

    // 2. Valid login with pre-configured mock learner
    const validRes = await authService.signIn('learner@polyglot.dev', 'LearnerPass123!');
    expect(validRes.error).toBeNull();
    expect(validRes.user).not.toBeNull();
    expect(validRes.user?.email).toBe('learner@polyglot.dev');
    expect(validRes.user?.role).toBe('user');
    expect(authService.getState().isGuest).toBe(false);
  });

  it('enforces Admin role verification and denies regular user privilege escalation', async () => {
    // 1. Regular user signs in
    const learnerLogin = await authService.signIn('learner@polyglot.dev', 'LearnerPass123!');
    expect(learnerLogin.user?.role).toBe('user');
    expect(authService.getState().role).toBe('user');

    // 2. Admin signs in
    await authService.signOut();
    const adminLogin = await authService.signIn('admin@polyglot.dev', 'AdminPass123!');
    expect(adminLogin.user?.role).toBe('admin');
    expect(authService.getState().role).toBe('admin');
  });

  it('rejects login for disabled user accounts with explanatory notice', async () => {
    // Admin disables learner account
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');
    await authService.setAccountStatus('usr_learner_002', 'disabled');
    await authService.signOut();

    // Disabled user tries to sign in
    const attempt = await authService.signIn('learner@polyglot.dev', 'LearnerPass123!');
    expect(attempt.user).toBeNull();
    expect(attempt.error).toContain('desativada por um administrador');

    // Admin re-enables learner account
    await authService.signIn('admin@polyglot.dev', 'AdminPass123!');
    await authService.setAccountStatus('usr_learner_002', 'active');
    await authService.signOut();
  });

  it('safely migrates guest phrasebook progress to registered account without duplicates', async () => {
    // 1. Guest saves words locally
    await savePhrasebookWord({
      user_id: 'guest',
      source_text: 'afluência',
      translated_text: 'crowd / influx',
      source_lang: 'pt',
      target_lang: 'en',
      is_verified: true,
    });

    const localWordsBefore = await getPhrasebookWords();
    expect(localWordsBefore.length).toBeGreaterThan(0);

    // 2. User registers and executes migration
    const reg = await authService.signUp(
      'migrating_user@polyglot.dev',
      'Password123!',
      'Migrated Learner'
    );
    expect(reg.user).not.toBeNull();

    const migrationResult = await authService.migrateGuestProgress(reg.user!.id);
    expect(migrationResult.wordsImported).toBe(localWordsBefore.length);
  });
});
