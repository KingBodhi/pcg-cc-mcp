import type { TaskWithAttemptStatus } from 'shared/types';
import type { FilterGroup, FilterCondition } from '@/types/filters';

/**
 * Evaluates a single filter condition against a task
 */
function evaluateCondition(
  task: TaskWithAttemptStatus,
  condition: FilterCondition
): boolean {
  const { field, operator, value } = condition;
  const taskValue = task[field as keyof TaskWithAttemptStatus];

  switch (operator) {
    case 'equals':
      return taskValue === value;

    case 'not_equals':
      return taskValue !== value;

    case 'contains':
      if (typeof taskValue === 'string' && typeof value === 'string') {
        return taskValue.toLowerCase().includes(value.toLowerCase());
      }
      return false;

    case 'not_contains':
      if (typeof taskValue === 'string' && typeof value === 'string') {
        return !taskValue.toLowerCase().includes(value.toLowerCase());
      }
      return true;

    case 'in':
      if (Array.isArray(value)) {
        return value.includes(taskValue);
      }
      return false;

    case 'not_in':
      if (Array.isArray(value)) {
        return !value.includes(taskValue);
      }
      return true;

    case 'before':
      if (taskValue && value) {
        return new Date(taskValue as string) < new Date(value);
      }
      return false;

    case 'after':
      if (taskValue && value) {
        return new Date(taskValue as string) > new Date(value);
      }
      return false;

    case 'between':
      if (taskValue && Array.isArray(value) && value.length === 2) {
        const date = new Date(taskValue as string);
        return date >= new Date(value[0]) && date <= new Date(value[1]);
      }
      return false;

    case 'greater_than':
      if (typeof taskValue === 'number' && typeof value === 'number') {
        return taskValue > value;
      }
      return false;

    case 'less_than':
      if (typeof taskValue === 'number' && typeof value === 'number') {
        return taskValue < value;
      }
      return false;

    default:
      return false;
  }
}

/**
 * Evaluates a filter group against a task
 */
function evaluateGroup(
  task: TaskWithAttemptStatus,
  group: FilterGroup
): boolean {
  if (group.conditions.length === 0) {
    return true;
  }

  const results = group.conditions.map((condition) =>
    evaluateCondition(task, condition)
  );

  if (group.logic === 'AND') {
    return results.every((result) => result);
  } else {
    // OR logic
    return results.some((result) => result);
  }
}

/**
 * Filters an array of tasks based on filter groups
 * Groups are combined with AND logic
 */
export function applyFilters(
  tasks: TaskWithAttemptStatus[],
  filterGroups: FilterGroup[]
): TaskWithAttemptStatus[] {
  if (filterGroups.length === 0) {
    return tasks;
  }

  // Filter out empty groups
  const validGroups = filterGroups.filter((g) => g.conditions.length > 0);

  if (validGroups.length === 0) {
    return tasks;
  }

  return tasks.filter((task) => {
    // All groups must pass (AND between groups)
    return validGroups.every((group) => evaluateGroup(task, group));
  });
}

/**
 * Gets the count of active filter conditions
 */
export function getActiveFilterCount(filterGroups: FilterGroup[]): number {
  return filterGroups.reduce(
    (count, group) => count + group.conditions.length,
    0
  );
}

/**
 * Checks if any filters are active
 */
export function hasActiveFilters(filterGroups: FilterGroup[]): boolean {
  return getActiveFilterCount(filterGroups) > 0;
}