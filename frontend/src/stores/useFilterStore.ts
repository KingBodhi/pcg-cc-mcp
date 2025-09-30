import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FilterGroup, FilterPreset, FilterCondition } from '@/types/filters';

interface FilterStore {
  // Active filters per project
  activeFilters: Record<string, FilterGroup[]>; // projectId -> filters

  // Saved presets per project
  filterPresets: Record<string, FilterPreset[]>; // projectId -> presets

  // Actions - Active Filters
  setActiveFilters: (projectId: string, groups: FilterGroup[]) => void;
  addFilterGroup: (projectId: string, group: FilterGroup) => void;
  removeFilterGroup: (projectId: string, groupId: string) => void;
  updateFilterCondition: (
    projectId: string,
    groupId: string,
    conditionId: string,
    updates: Partial<FilterCondition>
  ) => void;
  addConditionToGroup: (
    projectId: string,
    groupId: string,
    condition: FilterCondition
  ) => void;
  removeConditionFromGroup: (
    projectId: string,
    groupId: string,
    conditionId: string
  ) => void;
  clearActiveFilters: (projectId: string) => void;

  // Actions - Presets
  savePreset: (preset: FilterPreset) => void;
  loadPreset: (projectId: string, presetId: string) => void;
  deletePreset: (projectId: string, presetId: string) => void;
  updatePreset: (
    projectId: string,
    presetId: string,
    updates: Partial<FilterPreset>
  ) => void;

  // Getters
  getActiveFilters: (projectId: string) => FilterGroup[];
  getPresets: (projectId: string) => FilterPreset[];
  hasActiveFilters: (projectId: string) => boolean;
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      activeFilters: {},
      filterPresets: {},

      // Active Filter Actions
      setActiveFilters: (projectId, groups) =>
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [projectId]: groups,
          },
        })),

      addFilterGroup: (projectId, group) =>
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [projectId]: [...(state.activeFilters[projectId] || []), group],
          },
        })),

      removeFilterGroup: (projectId, groupId) =>
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [projectId]: (state.activeFilters[projectId] || []).filter(
              (g) => g.id !== groupId
            ),
          },
        })),

      updateFilterCondition: (projectId, groupId, conditionId, updates) =>
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [projectId]: (state.activeFilters[projectId] || []).map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    conditions: group.conditions.map((condition) =>
                      condition.id === conditionId
                        ? { ...condition, ...updates }
                        : condition
                    ),
                  }
                : group
            ),
          },
        })),

      addConditionToGroup: (projectId, groupId, condition) =>
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [projectId]: (state.activeFilters[projectId] || []).map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    conditions: [...group.conditions, condition],
                  }
                : group
            ),
          },
        })),

      removeConditionFromGroup: (projectId, groupId, conditionId) =>
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [projectId]: (state.activeFilters[projectId] || []).map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    conditions: group.conditions.filter(
                      (c) => c.id !== conditionId
                    ),
                  }
                : group
            ),
          },
        })),

      clearActiveFilters: (projectId) =>
        set((state) => ({
          activeFilters: {
            ...state.activeFilters,
            [projectId]: [],
          },
        })),

      // Preset Actions
      savePreset: (preset) =>
        set((state) => ({
          filterPresets: {
            ...state.filterPresets,
            [preset.projectId]: [
              ...(state.filterPresets[preset.projectId] || []),
              preset,
            ],
          },
        })),

      loadPreset: (projectId, presetId) => {
        const presets = get().filterPresets[projectId] || [];
        const preset = presets.find((p) => p.id === presetId);
        if (preset) {
          get().setActiveFilters(projectId, preset.groups);
        }
      },

      deletePreset: (projectId, presetId) =>
        set((state) => ({
          filterPresets: {
            ...state.filterPresets,
            [projectId]: (state.filterPresets[projectId] || []).filter(
              (p) => p.id !== presetId
            ),
          },
        })),

      updatePreset: (projectId, presetId, updates) =>
        set((state) => ({
          filterPresets: {
            ...state.filterPresets,
            [projectId]: (state.filterPresets[projectId] || []).map((preset) =>
              preset.id === presetId
                ? { ...preset, ...updates, updatedAt: new Date() }
                : preset
            ),
          },
        })),

      // Getters
      getActiveFilters: (projectId) =>
        get().activeFilters[projectId] || [],

      getPresets: (projectId) =>
        get().filterPresets[projectId] || [],

      hasActiveFilters: (projectId) => {
        const filters = get().activeFilters[projectId] || [];
        return filters.length > 0 && filters.some((g) => g.conditions.length > 0);
      },
    }),
    {
      name: 'filter-storage',
    }
  )
);