import { api } from '../lib/api'
import { queryClient } from '../lib/queryClient'

// Cache keys. Keys that start with 'projects' are refreshed together.
export const projectKeys = {
  all: ['projects'],
  list: ['projects', 'list'],
  detail: (id) => ['projects', 'detail', id],
}

export const projectsApi = {
  list: () => api.get('/projects').then((res) => res.data),
  get: (id) => api.get(`/projects/${id}`).then((res) => res.data),
  create: (data) => api.post('/projects', data).then((res) => res.data),
  update: (id, data) => api.put(`/projects/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/projects/${id}`).then((res) => res.data),
  addMember: (id, userId) =>
    api.post(`/projects/${id}/members`, { user_id: userId }).then((res) => res.data),
  removeMember: (id, userId) =>
    api.delete(`/projects/${id}/members/${userId}`).then((res) => res.data),
}

// Project changes also affect tasks (removing a member unassigns their tasks) and dashboards
export function invalidateProjectData() {
  queryClient.invalidateQueries({ queryKey: projectKeys.all })
  queryClient.invalidateQueries({ queryKey: ['tasks'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}