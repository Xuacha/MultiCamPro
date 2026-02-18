import { create } from 'zustand';
import { User } from '@/types';
import { logger } from '@/utils/logger';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>(
  (set: (updater: Partial<AuthState> | ((state: AuthState) => Partial<AuthState>)) => void) => ({
    user: null,
    isLoading: false,
    error: null,

    setUser: (user: User | null) => {
      logger.log('User state updated', user?.id);
      set({ user });
    },

    setLoading: (isLoading: boolean) => {
      set({ isLoading });
    },

    setError: (error: string | null) => {
      if (error) {
        logger.error('Auth error', error);
      }
      set({ error });
    },
  })
);
