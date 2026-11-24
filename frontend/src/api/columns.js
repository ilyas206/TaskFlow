import { api } from '../lib/api'

export const columnKeys = {
  list: (projectId) => ['columns', projectId],
}

export const columnsApi = {
  list: (projectId) => api.get(`/projects/${projectId}/columns`).then((res) => res.data),
  create: (projectId, data) =>
    api.post(`/projects/${projectId}/columns`, data).then((res) => res.data),
  update: (columnId, data) => api.put(`/columns/${columnId}`, data).then((res) => res.data),
  remove: (columnId) => api.delete(`/columns/${columnId}`).then((res) => res.data),
}