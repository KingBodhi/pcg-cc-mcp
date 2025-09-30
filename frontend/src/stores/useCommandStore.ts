import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CommandHistoryItem {
  id: string;
  commandType: 'project' | 'task' | 'command' | 'search';
  resourceId?: string;
  resourceType?: 'project' | 'task' | 'view';
  resourceName: string;
  accessedAt: Date;
}

export interface Favorite {
  id: string;
  projectId: string;
  projectName: string;
  position: number;
  createdAt: Date;
}

interface CommandStore {
  // Command palette state
  isOpen: boolean;
  searchQuery: string;

  // Command history (recent items)
  history: CommandHistoryItem[];
  maxHistoryItems: number;

  // Favorites
  favorites: Favorite[];

  // Actions
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  setSearchQuery: (query: string) => void;

  addToHistory: (item: Omit<CommandHistoryItem, 'id' | 'accessedAt'>) => void;
  clearHistory: () => void;
  getRecentItems: (limit?: number) => CommandHistoryItem[];

  addFavorite: (projectId: string, projectName: string) => void;
  removeFavorite: (projectId: string) => void;
  reorderFavorites: (favorites: Favorite[]) => void;
  isFavorite: (projectId: string) => boolean;
}

export const useCommandStore = create<CommandStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      searchQuery: '',
      history: [],
      maxHistoryItems: 20,
      favorites: [],

      openCommandPalette: () => set({ isOpen: true, searchQuery: '' }),
      closeCommandPalette: () => set({ isOpen: false, searchQuery: '' }),
      toggleCommandPalette: () => set((state) => ({ isOpen: !state.isOpen })),
      setSearchQuery: (query) => set({ searchQuery: query }),

      addToHistory: (item) => {
        const { history, maxHistoryItems } = get();

        // Don't add duplicates to recent history
        const filtered = history.filter(
          (h) => !(h.resourceType === item.resourceType && h.resourceId === item.resourceId)
        );

        const newItem: CommandHistoryItem = {
          ...item,
          id: `history-${Date.now()}-${Math.random()}`,
          accessedAt: new Date(),
        };

        const newHistory = [newItem, ...filtered].slice(0, maxHistoryItems);

        set({ history: newHistory });
      },

      clearHistory: () => set({ history: [] }),

      getRecentItems: (limit = 10) => {
        return get().history.slice(0, limit);
      },

      addFavorite: (projectId, projectName) => {
        const { favorites } = get();

        // Don't add if already favorite
        if (favorites.some((f) => f.projectId === projectId)) {
          return;
        }

        const newFavorite: Favorite = {
          id: `fav-${Date.now()}-${Math.random()}`,
          projectId,
          projectName,
          position: favorites.length,
          createdAt: new Date(),
        };

        set({ favorites: [...favorites, newFavorite] });
      },

      removeFavorite: (projectId) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.projectId !== projectId),
        }));
      },

      reorderFavorites: (newFavorites) => {
        set({ favorites: newFavorites });
      },

      isFavorite: (projectId) => {
        return get().favorites.some((f) => f.projectId === projectId);
      },
    }),
    {
      name: 'pcg-command-storage',
      // Only persist history and favorites, not UI state
      partialize: (state) => ({
        history: state.history,
        favorites: state.favorites,
      }),
    }
  )
);