import { create } from 'zustand';

interface BulkSelectionStore {
  // State
  selectedTaskIds: Set<string>;
  selectionMode: boolean;

  // Actions
  toggleSelectionMode: () => void;
  enableSelectionMode: () => void;
  disableSelectionMode: () => void;
  selectTask: (taskId: string) => void;
  deselectTask: (taskId: string) => void;
  selectAll: (taskIds: string[]) => void;
  clearSelection: () => void;
  toggleTask: (taskId: string) => void;

  // Getters
  isSelected: (taskId: string) => boolean;
  getSelectedCount: () => number;
  getSelectedIds: () => string[];
}

export const useBulkSelectionStore = create<BulkSelectionStore>(
  (set, get) => ({
    selectedTaskIds: new Set(),
    selectionMode: false,

    toggleSelectionMode: () =>
      set((state) => {
        // When disabling, clear selection
        if (state.selectionMode) {
          return {
            selectionMode: false,
            selectedTaskIds: new Set(),
          };
        }
        return { selectionMode: true };
      }),

    enableSelectionMode: () => set({ selectionMode: true }),

    disableSelectionMode: () =>
      set({
        selectionMode: false,
        selectedTaskIds: new Set(),
      }),

    selectTask: (taskId) =>
      set((state) => {
        const newSelected = new Set(state.selectedTaskIds);
        newSelected.add(taskId);
        return { selectedTaskIds: newSelected };
      }),

    deselectTask: (taskId) =>
      set((state) => {
        const newSelected = new Set(state.selectedTaskIds);
        newSelected.delete(taskId);
        return { selectedTaskIds: newSelected };
      }),

    selectAll: (taskIds) =>
      set({
        selectedTaskIds: new Set(taskIds),
      }),

    clearSelection: () =>
      set({
        selectedTaskIds: new Set(),
      }),

    toggleTask: (taskId) => {
      const state = get();
      if (state.selectedTaskIds.has(taskId)) {
        state.deselectTask(taskId);
      } else {
        state.selectTask(taskId);
      }
    },

    isSelected: (taskId) => get().selectedTaskIds.has(taskId),

    getSelectedCount: () => get().selectedTaskIds.size,

    getSelectedIds: () => Array.from(get().selectedTaskIds),
  })
);