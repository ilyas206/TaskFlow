import { api } from '../lib/api'
import { queryClient } from '../lib/queryClient'

export const userKeys = {
  list: ['users', 'list'],
}

export const usersApi = {
  list: () => api.get('/users').then((res) => res.data),
  create: (data) => api.post('/users', data).then((res) => res.data),
  update: (id, data) => api.put(`/users/${id}`, data).then((res) => res.data),
  remove: (id) => api.delete(`/users/${id}`).then((res) => res.data),
}

// A user change can affect project members, task assignees, and dashboards
export function invalidateUserData() {
  queryClient.invalidateQueries({ queryKey: userKeys.list })
  queryClient.invalidateQueries({ queryKey: ['projects'] })
  queryClient.invalidateQueries({ queryKey: ['tasks'] })
  queryClient.invalidateQueries({ queryKey: ['dashboard'] })
}