import { QueryClient } from '@tanstack/react-query'

// One shared client, so the app and the helpers use the same cache
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})