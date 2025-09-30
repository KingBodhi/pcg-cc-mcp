import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { TimeEntry, ActiveTimer, TimeStats } from '@/types/time-tracking';

interface TimeTrackingStore {
  // State
  entries: TimeEntry[];
  activeTimer: ActiveTimer | null;

  // Actions
  startTimer: (taskId: string, description?: string) => void;
  stopTimer: () => TimeEntry | null;
  addEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntriesByTask: (taskId: string) => TimeEntry[];
  getTaskStats: (taskId: string) => TimeStats;
  getAllStats: () => TimeStats;
  clearEntries: (taskId?: string) => void;
}

// Helper to calculate duration
function calculateDuration(startTime: Date, endTime?: Date): number {
  const end = endTime || new Date();
  return Math.floor((end.getTime() - startTime.getTime()) / 1000);
}

// Helper to check if date is today
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// Helper to check if date is this week
function isThisWeek(date: Date): boolean {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return date >= weekStart;
}

export const useTimeTrackingStore = create<TimeTrackingStore>()(
  persist(
    (set, get) => ({
      entries: [],
      activeTimer: null,

      startTimer: (taskId, description) => {
        // Stop any existing timer first
        const existing = get().activeTimer;
        if (existing) {
          get().stopTimer();
        }

        set({
          activeTimer: {
            taskId,
            startTime: new Date(),
            description,
          },
        });
      },

      stopTimer: () => {
        const timer = get().activeTimer;
        if (!timer) return null;

        const entry: TimeEntry = {
          id: nanoid(),
          taskId: timer.taskId,
          startTime: timer.startTime,
          endTime: new Date(),
          duration: calculateDuration(timer.startTime),
          description: timer.description,
          createdAt: new Date(),
        };

        set((state) => ({
          entries: [...state.entries, entry],
          activeTimer: null,
        }));

        return entry;
      },

      addEntry: (entryData) => {
        const entry: TimeEntry = {
          ...entryData,
          id: nanoid(),
          createdAt: new Date(),
          duration: entryData.duration || calculateDuration(entryData.startTime, entryData.endTime),
        };

        set((state) => ({
          entries: [...state.entries, entry],
        }));
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  ...updates,
                  duration: updates.startTime || updates.endTime
                    ? calculateDuration(
                        updates.startTime || entry.startTime,
                        updates.endTime || entry.endTime
                      )
                    : entry.duration,
                }
              : entry
          ),
        }));
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },

      getEntriesByTask: (taskId) => {
        return get().entries.filter((entry) => entry.taskId === taskId);
      },

      getTaskStats: (taskId) => {
        const entries = get().entries.filter((entry) => entry.taskId === taskId);

        let totalTime = 0;
        let todayTime = 0;
        let weekTime = 0;

        entries.forEach((entry) => {
          const duration = entry.duration || 0;
          totalTime += duration;

          if (isToday(entry.startTime)) {
            todayTime += duration;
          }

          if (isThisWeek(entry.startTime)) {
            weekTime += duration;
          }
        });

        // Add active timer if running for this task
        const activeTimer = get().activeTimer;
        if (activeTimer && activeTimer.taskId === taskId) {
          const activeDuration = calculateDuration(activeTimer.startTime);
          totalTime += activeDuration;
          todayTime += activeDuration;
          weekTime += activeDuration;
        }

        return {
          totalTime,
          todayTime,
          weekTime,
          entryCount: entries.length + (activeTimer?.taskId === taskId ? 1 : 0),
        };
      },

      getAllStats: () => {
        const entries = get().entries;

        let totalTime = 0;
        let todayTime = 0;
        let weekTime = 0;

        entries.forEach((entry) => {
          const duration = entry.duration || 0;
          totalTime += duration;

          if (isToday(entry.startTime)) {
            todayTime += duration;
          }

          if (isThisWeek(entry.startTime)) {
            weekTime += duration;
          }
        });

        // Add active timer
        const activeTimer = get().activeTimer;
        if (activeTimer) {
          const activeDuration = calculateDuration(activeTimer.startTime);
          totalTime += activeDuration;
          todayTime += activeDuration;
          weekTime += activeDuration;
        }

        return {
          totalTime,
          todayTime,
          weekTime,
          entryCount: entries.length + (activeTimer ? 1 : 0),
        };
      },

      clearEntries: (taskId) => {
        if (taskId) {
          set((state) => ({
            entries: state.entries.filter((entry) => entry.taskId !== taskId),
            activeTimer:
              state.activeTimer?.taskId === taskId ? null : state.activeTimer,
          }));
        } else {
          set({
            entries: [],
            activeTimer: null,
          });
        }
      },
    }),
    {
      name: 'time-tracking-storage',
    }
  )
);
