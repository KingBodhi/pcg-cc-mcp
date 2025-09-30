import { create } from 'zustand';

export interface Tag {
  id: string;
  projectId: string;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskTag {
  id: string;
  taskId: string;
  tagId: string;
  createdAt: Date;
}

interface TagStore {
  // Tags by project
  tagsByProject: Record<string, Tag[]>; // projectId -> tags[]

  // Task-tag associations
  taskTags: Record<string, string[]>; // taskId -> tagIds[]

  // Actions
  setTags: (projectId: string, tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  deleteTag: (projectId: string, tagId: string) => void;

  setTaskTags: (taskId: string, tagIds: string[]) => void;
  addTaskTag: (taskId: string, tagId: string) => void;
  removeTaskTag: (taskId: string, tagId: string) => void;

  getTagsForProject: (projectId: string) => Tag[];
  getTagsForTask: (projectId: string, taskId: string) => Tag[];
}

export const useTagStore = create<TagStore>((set, get) => ({
  tagsByProject: {},
  taskTags: {},

  setTags: (projectId, tags) =>
    set((state) => ({
      tagsByProject: {
        ...state.tagsByProject,
        [projectId]: tags,
      },
    })),

  addTag: (tag) =>
    set((state) => {
      const projectTags = state.tagsByProject[tag.projectId] || [];
      return {
        tagsByProject: {
          ...state.tagsByProject,
          [tag.projectId]: [...projectTags, tag],
        },
      };
    }),

  updateTag: (tagId, updates) =>
    set((state) => {
      const newTagsByProject = { ...state.tagsByProject };

      Object.keys(newTagsByProject).forEach((projectId) => {
        newTagsByProject[projectId] = newTagsByProject[projectId].map((tag) =>
          tag.id === tagId ? { ...tag, ...updates, updatedAt: new Date() } : tag
        );
      });

      return { tagsByProject: newTagsByProject };
    }),

  deleteTag: (projectId, tagId) =>
    set((state) => ({
      tagsByProject: {
        ...state.tagsByProject,
        [projectId]: (state.tagsByProject[projectId] || []).filter(
          (tag) => tag.id !== tagId
        ),
      },
    })),

  setTaskTags: (taskId, tagIds) =>
    set((state) => ({
      taskTags: {
        ...state.taskTags,
        [taskId]: tagIds,
      },
    })),

  addTaskTag: (taskId, tagId) =>
    set((state) => {
      const currentTags = state.taskTags[taskId] || [];
      if (currentTags.includes(tagId)) return state;

      return {
        taskTags: {
          ...state.taskTags,
          [taskId]: [...currentTags, tagId],
        },
      };
    }),

  removeTaskTag: (taskId, tagId) =>
    set((state) => ({
      taskTags: {
        ...state.taskTags,
        [taskId]: (state.taskTags[taskId] || []).filter((id) => id !== tagId),
      },
    })),

  getTagsForProject: (projectId) => {
    return get().tagsByProject[projectId] || [];
  },

  getTagsForTask: (projectId, taskId) => {
    const state = get();
    const tagIds = state.taskTags[taskId] || [];
    const projectTags = state.tagsByProject[projectId] || [];
    return projectTags.filter((tag) => tagIds.includes(tag.id));
  },
}));