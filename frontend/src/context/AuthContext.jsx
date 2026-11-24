import { createContext, useContext } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { tokenStore } from '../lib/api'

const AuthContext = createContext(null)

export const userQueryKey = ['auth', 'user']

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const hasToken = Boolean(tokenStore.get())

  // isError and error tell us why the user is missing (expired token or server down)
  const { data: user, isPending, isError, error, refetch } = useQuery({
    queryKey: userQueryKey,
    queryFn: authApi.me,
    enabled: hasToken,
    retry: false,
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      tokenStore.set(data.token)
      queryClient.setQueryData(userQueryKey, data.user)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await authApi.logout()
      } catch {
        // Even if the server call fails, the local session is still cleared
      }
    },
    onSettled: () => {
      tokenStore.clear()
      queryClient.clear()
    },
  })

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        loading: hasToken && isPending,
        // A failed user check that is not a 401 means the server is unreachable
        serverError: hasToken && isError && error?.response?.status !== 401,
        retryAuth: refetch,
        isLoggingIn: loginMutation.isPending,
        login: (email, password) => loginMutation.mutateAsync({ email, password }),
        logout: logoutMutation.mutateAsync,
        isManager: user?.role === 'manager',
        isAdmin: user?.is_admin === true,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}