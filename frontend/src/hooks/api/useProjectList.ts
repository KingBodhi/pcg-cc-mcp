import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';

export function useProjectList() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}