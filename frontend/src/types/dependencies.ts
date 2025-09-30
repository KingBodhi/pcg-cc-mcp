export type DependencyType = 'blocks' | 'blocked_by' | 'relates_to';

export interface TaskDependency {
  id: string;
  sourceTaskId: string; // The task that has the dependency
  targetTaskId: string; // The task it depends on
  type: DependencyType;
  createdAt: Date;
}

export interface DependencyGraph {
  [taskId: string]: {
    blocks: string[]; // Tasks this task blocks
    blockedBy: string[]; // Tasks blocking this task
    relatesTo: string[]; // Related tasks
  };
}
