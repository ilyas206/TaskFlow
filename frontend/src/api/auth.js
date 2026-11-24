import { api } from '../lib/api'

// Plain functions that call the backend and return only the data.
// TanStack Query calls them, so pages never call Axios directly.
export const authApi = {
  login: (credentials) => api.post('/login', credentials).then((res) => res.data),
  logout: () => api.post('/logout').then((res) => res.data),
  me: () => api.get('/user').then((res) => res.data),
}