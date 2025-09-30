export interface TimeEntry {
  id: string;
  taskId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  description?: string;
  createdAt: Date;
}

export interface TimeStats {
  totalTime: number; // in seconds
  todayTime: number;
  weekTime: number;
  entryCount: number;
}

export interface ActiveTimer {
  taskId: string;
  startTime: Date;
  description?: string;
}
