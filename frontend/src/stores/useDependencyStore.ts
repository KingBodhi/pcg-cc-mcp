import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { TaskDependency, DependencyType, DependencyGraph } from '@/types/dependencies';

interface DependencyStore {
  // State
  dependencies: TaskDependency[];

  // Actions
  addDependency: (sourceTaskId: string, targetTaskId: string, type: DependencyType) => void;
  removeDependency: (id: string) => void;
  getDependenciesForTask: (taskId: string) => {
    blocks: TaskDependency[];
    blockedBy: TaskDependency[];
    relatesTo: TaskDependency[];
  };
  getBlockedTasks: (taskId: string) => string[];
  isBlocked: (taskId: string) => boolean;
  getDependencyGraph: (projectId?: string) => DependencyGraph;
  clearDependencies: (taskId?: string) => void;
}

export const useDependencyStore = create<DependencyStore>()(
  persist(
    (set, get) => ({
      dependencies: [],

      addDependency: (sourceTaskId, targetTaskId, type) => {
        // Prevent self-dependencies
        if (sourceTaskId === targetTaskId) {
          return;
        }

        // Check if dependency already exists
        const exists = get().dependencies.some(
          (dep) =>
            dep.sourceTaskId === sourceTaskId &&
            dep.targetTaskId === targetTaskId &&
            dep.type === type
        );

        if (exists) {
          return;
        }

        const dependency: TaskDependency = {
          id: nanoid(),
          sourceTaskId,
          targetTaskId,
          type,
          createdAt: new Date(),
        };

        set((state) => ({
          dependencies: [...state.dependencies, dependency],
        }));
      },

      removeDependency: (id) => {
        set((state) => ({
          dependencies: state.dependencies.filter((dep) => dep.id !== id),
        }));
      },

      getDependenciesForTask: (taskId) => {
        const deps = get().dependencies;

        return {
          blocks: deps.filter(
            (dep) => dep.sourceTaskId === taskId && dep.type === 'blocks'
          ),
          blockedBy: deps.filter(
            (dep) => dep.targetTaskId === taskId && dep.type === 'blocks'
          ),
          relatesTo: deps.filter(
            (dep) =>
              (dep.sourceTaskId === taskId || dep.targetTaskId === taskId) &&
              dep.type === 'relates_to'
          ),
        };
      },

      getBlockedTasks: (taskId) => {
        const deps = get().dependencies;
        return deps
          .filter((dep) => dep.sourceTaskId === taskId && dep.type === 'blocks')
          .map((dep) => dep.targetTaskId);
      },

      isBlocked: (taskId) => {
        const deps = get().dependencies;
        return deps.some(
          (dep) => dep.targetTaskId === taskId && dep.type === 'blocks'
        );
      },

      getDependencyGraph: (/* _projectId */) => {
        const deps = get().dependencies;
        const graph: DependencyGraph = {};

        deps.forEach((dep) => {
          // Initialize source
          if (!graph[dep.sourceTaskId]) {
            graph[dep.sourceTaskId] = { blocks: [], blockedBy: [], relatesTo: [] };
          }
          // Initialize target
          if (!graph[dep.targetTaskId]) {
            graph[dep.targetTaskId] = { blocks: [], blockedBy: [], relatesTo: [] };
          }

          if (dep.type === 'blocks') {
            graph[dep.sourceTaskId].blocks.push(dep.targetTaskId);
            graph[dep.targetTaskId].blockedBy.push(dep.sourceTaskId);
          } else if (dep.type === 'relates_to') {
            graph[dep.sourceTaskId].relatesTo.push(dep.targetTaskId);
            graph[dep.targetTaskId].relatesTo.push(dep.sourceTaskId);
          }
        });

        return graph;
      },

      clearDependencies: (taskId) => {
        if (taskId) {
          set((state) => ({
            dependencies: state.dependencies.filter(
              (dep) => dep.sourceTaskId !== taskId && dep.targetTaskId !== taskId
            ),
          }));
        } else {
          set({ dependencies: [] });
        }
      },
    }),
    {
      name: 'dependency-storage',
    }
  )
);
