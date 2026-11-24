import { api } from '../lib/api'
import { queryClient } from '../lib/queryClient'

export const taskKeys = {
  all: ['tasks'],
  project: (projectId) => ['tasks', 'project', projectId],
  mine: ['tasks', 'mine'],
}

export const tasksApi = {
  listByProject: (projectId) =>
    api.get(`/projects/${projectId}/tasks`).then((res) => res.data),
  listMine: () => api.get('/tasks/my-tasks').then((res) => res.data),
  create: (projectId, data) =>
    api.post(`/projects/${projectId}/tasks`, data).then((res) => res.data),
  update: (taskId, data) => api.put(`/tasks/${taskId}`, data).then((res) => res.data),
  move: (taskId, boardColumnId) =>
    api.patch(`/tasks/${taskId}/move`, { board_column_id: boardColumnId }).then((res) => res.data),
  remove: (taskId) => api.delete(`/tasks/${taskId}`).then((res) => res.data),
}

// Task changes also change the dashboard numbers
export function invalidateTaskData() {
  queryClient.invalidateQueries({ queryKey: taskKeys.all })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}