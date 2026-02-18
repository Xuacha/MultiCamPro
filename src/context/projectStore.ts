import { create } from 'zustand';
import { Project } from '@/types';
import { logger } from '@/utils/logger';

export interface ProjectState {
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

export const useProjectStore = create<ProjectState>(
  (set: (updater: Partial<ProjectState> | ((state: ProjectState) => Partial<ProjectState>)) => void) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  setProjects: (projects: Project[]) => {
    logger.log('Projects state updated', projects.length);
    set({ projects });
  },

  setCurrentProject: (currentProject: Project | null) => {
    logger.log('Current project updated', currentProject?.id);
    set({ currentProject });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    if (error) {
      logger.error('Project error', error);
    }
    set({ error });
  },

  addProject: (project: Project) => {
    set((state: ProjectState) => ({
      projects: [...state.projects, project],
    }));
  },

  removeProject: (projectId: string) => {
    set((state: ProjectState) => ({
      projects: state.projects.filter((p: Project) => p.id !== projectId),
    }));
  },

  updateProject: (project: Project) => {
    set((state: ProjectState) => ({
      projects: state.projects.map((p: Project) => (p.id === project.id ? project : p)),
    }));
  },
  }),
);
