import axios from 'axios'

const TOKEN_KEY = 'taskflow_token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

// One Axios instance for the whole app. Requests go to /api, through the Vite proxy.
export const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})

// Attach the Sanctum token to every request
api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// If the token expired or was revoked, clear it and send the user back to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      tokenStore.clear()
      window.location.assign('/login')
    }
    return Promise.reject(error)
  }
)