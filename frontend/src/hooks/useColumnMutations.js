import { useMutation, useQueryClient } from '@tanstack/react-query'
import { columnKeys, columnsApi } from '../api/columns'
import { taskKeys } from '../api/tasks'

export function useColumnMutations(projectId) {
  const queryClient = useQueryClient()

  // Column changes affect the board, the task positions, and the dashboards
  function refresh() {
    queryClient.invalidateQueries({ queryKey: columnKeys.list(projectId) })
    queryClient.invalidateQueries({ queryKey: taskKeys.all })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const create = useMutation({
    mutationFn: (data) => columnsApi.create(projectId, data),
    onSuccess: refresh,
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => columnsApi.update(id, data),
    onSuccess: refresh,
  })

  const remove = useMutation({
    mutationFn: (id) => columnsApi.remove(id),
    onSuccess: refresh,
  })

  return { create, update, remove }
}