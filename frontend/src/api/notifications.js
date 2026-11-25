import { api } from '../lib/api'

export const notificationKeys = {
  all: ['notifications'],
}

export const notificationsApi = {
  list: () => api.get('/notifications').then((res) => res.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((res) => res.data),
  markAllRead: () => api.post('/notifications/read-all').then((res) => res.data),
}