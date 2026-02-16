import { create } from 'zustand';
import { Project } from '@/types';
import { logger } from '@/utils/logger';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addProject: (project: Project) => void;
  removeProject: (projectId: string) => void;
  updateProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  setProjects: (projects) => {
    logger.log('Projects state updated', projects.length);
    set({ projects });
  },

  setCurrentProject: (currentProject) => {
    logger.log('Current project updated', currentProject?.id);
    set({ currentProject });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    if (error) {
      logger.error('Project error', error);
    }
    set({ error });
  },

  addProject: (project) => {
    set((state) => ({
      projects: [...state.projects, project],
    }));
  },

  removeProject: (projectId) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
    }));
  },

  updateProject: (project) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    }));
  },
}));
