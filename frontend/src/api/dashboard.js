import { api } from '../lib/api'

// Cache keys: TanStack Query uses them to store and refetch each dashboard
export const dashboardKeys = {
  manager: ['dashboard', 'manager'],
  employee: ['dashboard', 'employee'],
  project: (id) => ['dashboard', 'project', id],
}

export const dashboardApi = {
  manager: () => api.get('/dashboard/manager').then((res) => res.data),
  employee: () => api.get('/dashboard/employee').then((res) => res.data),
  project: (id) => api.get(`/dashboard/projects/${id}`).then((res) => res.data),
}