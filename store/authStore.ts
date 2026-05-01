import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserProfile, UserRole } from '@/types/user';

export type AuthRole = 'company' | 'candidate';

interface AuthState {
  user: UserProfile | null;
  role: AuthRole | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: UserProfile | null, role?: AuthRole | UserRole | null, token?: string | null) => void;
  clearUser: () => void;
  setLoading: (isLoading: boolean) => void;
}

/**
 * Maps internal user roles to the simplified store roles.
 */
const mapRole = (role: string | null | undefined): AuthRole | null => {
  if (!role) return null;
  if (role === 'candidate') return 'candidate';
  if (['recruiter', 'admin', 'super_admin', 'company'].includes(role)) return 'company';
  return null;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: null,
      sessionToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user, role, token) => {
        const mappedRole = role ? mapRole(role) : (user?.role ? mapRole(user.role) : null);
        set({
          user,
          role: mappedRole,
          sessionToken: token ?? null,
          isAuthenticated: !!user,
          isLoading: false,
        });
      },

      clearUser: () => {
        set({
          user: null,
          role: null,
          sessionToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    {
      name: 'tm-auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist essential auth data
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        sessionToken: state.sessionToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
