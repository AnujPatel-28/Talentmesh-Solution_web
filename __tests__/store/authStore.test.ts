import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@/types/user';

const mockUser: UserProfile = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'candidate',
};

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().clearUser();
  });

  it('should initialize with default values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    // After clearUser() in beforeEach, isLoading becomes false
    expect(state.isLoading).toBe(false);
  });

  it('should update state when setUser is called', () => {
    useAuthStore.getState().setUser(mockUser, 'candidate', 'token-abc');
    
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.role).toBe('candidate');
    expect(state.sessionToken).toBe('token-abc');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should map recruiter role to company', () => {
    useAuthStore.getState().setUser(mockUser, 'recruiter');
    expect(useAuthStore.getState().role).toBe('company');
  });

  it('should map super_admin role to company', () => {
    useAuthStore.getState().setUser(mockUser, 'super_admin');
    expect(useAuthStore.getState().role).toBe('company');
  });

  it('should clear state when clearUser is called', () => {
    useAuthStore.getState().setUser(mockUser, 'candidate');
    useAuthStore.getState().clearUser();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.role).toBeNull();
  });

  it('should manually set loading state', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
    
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});
