import { create } from 'zustand';
import { User } from '@/types';
import { logger } from '@/utils/logger';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  setUser: (user) => {
    logger.log('User state updated', user?.id);
    set({ user });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    if (error) {
      logger.error('Auth error', error);
    }
    set({ error });
  },
}));
