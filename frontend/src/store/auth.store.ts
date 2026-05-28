/**
 * Zustand Store - Autenticação
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  checkPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login(email, password);
          const { accessToken, refreshToken, user } = response.data.data;

          Cookies.set('sleepcalm_token', accessToken, { expires: 1 });
          Cookies.set('sleepcalm_refresh_token', refreshToken, { expires: 7 });

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch {
          // Ignora erros de logout
        } finally {
          Cookies.remove('sleepcalm_token');
          Cookies.remove('sleepcalm_refresh_token');
          set({
            user: null,
            isAuthenticated: false,
          });
          window.location.href = '/login';
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      checkPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'OWNER' || user.role === 'ADMIN') return true;
        return user.permissions.includes(permission);
      },

      hasRole: (role: string | string[]) => {
        const { user } = get();
        if (!user) return false;
        if (Array.isArray(role)) return role.includes(user.role);
        return user.role === role;
      },
    }),
    {
      name: 'sleepcalm-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
