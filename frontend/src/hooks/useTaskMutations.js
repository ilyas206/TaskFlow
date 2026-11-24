import { useMutation, useQueryClient } from '@tanstack/react-query'
import { columnKeys } from '../api/columns'
import { invalidateTaskData, taskKeys, tasksApi } from '../api/tasks'

export function useTaskMutations(projectId) {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (data) => tasksApi.create(projectId, data),
    onSuccess: invalidateTaskData,
  })

  const update = useMutation({
    mutationFn: ({ id, data }) => tasksApi.update(id, data),
    onSuccess: invalidateTaskData,
  })

  // The card moves right away. If the server refuses, the old position comes back.
  // onMutate runs before mutationFn
  const move = useMutation({
    // 3 - Send the move request to the server.
    mutationFn: ({ id, boardColumnId }) => tasksApi.move(id, boardColumnId),
    onMutate: async ({ id, boardColumnId }) => {
      const key = taskKeys.project(projectId)
      await queryClient.cancelQueries({ queryKey: key })

      // 1 - Save the current task list.
      const previous = queryClient.getQueryData(key)
      const columns = queryClient.getQueryData(columnKeys.list(projectId)) ?? []
      const column = columns.find((c) => c.id === boardColumnId)

      // 2 - Immediately move the task in the cache.
      queryClient.setQueryData(key, (old) =>
        old?.map((task) => (task.id === id && column ? { ...task, board_column: column } : task))
      )

      return { previous }
    },
    onError: (_error, _variables, context) => {
      // 4 - If failed, restore the saved task list.
      queryClient.setQueryData(taskKeys.project(projectId), context?.previous)
    },
    // 5 - Refetch afterward in both cases.
    onSettled: invalidateTaskData,
  })

  const remove = useMutation({
    mutationFn: (id) => tasksApi.remove(id),
    onSuccess: invalidateTaskData,
  })

  return { create, update, move, remove }
}