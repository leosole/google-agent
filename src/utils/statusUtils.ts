import { getTaskStatus } from './barMetrics'

export type TaskStatus = 'normal' | 'ahead' | 'warning' | 'overdue'

export const getTaskStatusLegacy = (task: any): TaskStatus => {
  return 'normal'
}
