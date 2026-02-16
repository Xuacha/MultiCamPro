import { useProjectStore } from '@/context/projectStore';
import { Project } from '@/types';

export const useProjects = () => {
  const projects = useProjectStore((state) => state.projects);
  const currentProject = useProjectStore((state) => state.currentProject);
  const isLoading = useProjectStore((state) => state.isLoading);
  const error = useProjectStore((state) => state.error);
  const setProjects = useProjectStore((state) => state.setProjects);
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);
  const setLoading = useProjectStore((state) => state.setLoading);
  const setError = useProjectStore((state) => state.setError);
  const addProject = useProjectStore((state) => state.addProject);
  const removeProject = useProjectStore((state) => state.removeProject);
  const updateProject = useProjectStore((state) => state.updateProject);

  return {
    projects,
    currentProject,
    isLoading,
    error,
    setProjects,
    setCurrentProject,
    setLoading,
    setError,
    addProject,
    removeProject,
    updateProject,
  };
};
