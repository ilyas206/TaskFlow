import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Pencil, Plus, Trash2, X } from 'lucide-react'
import { columnKeys, columnsApi } from '../api/columns'
import { taskKeys, tasksApi } from '../api/tasks'
import { useAuth } from '../context/AuthContext'
import { useColumnMutations } from '../hooks/useColumnMutations'
import { useTaskMutations } from '../hooks/useTaskMutations'
import BoardImg from '../assets/kanban_board.png'
import { getErrorMessage } from '../lib/errors'
import { priorityLabels } from '../lib/labels'
import KanbanBoard from './KanbanBoard'
import TaskForm from './TaskForm'
import Loader from './Loader'

const SELECT = 'rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500'

// The task section of a project page: filters, the task form, and the Kanban board.
// editor is null (closed), 'new' (create form), or the task being edited.
export default function ProjectBoard({ project }) {
  const { user, isManager } = useAuth()
  const [editor, setEditor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [columnToRename, setColumnToRename] = useState(null)
  const [columnName, setColumnName] = useState('')
  const [renameError, setRenameError] = useState('')
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const taskMutations = useTaskMutations(project.id)
  const columnMutations = useColumnMutations(project.id)

  const columnsQuery = useQuery({
    queryKey: columnKeys.list(project.id),
    queryFn: () => columnsApi.list(project.id),
  })

  const tasksQuery = useQuery({
    queryKey: taskKeys.project(project.id),
    queryFn: () => tasksApi.listByProject(project.id),
  })

  const columns = columnsQuery.data ?? []
  const allTasks = tasksQuery.data ?? []

  // Filters run in the browser, on the tasks already loaded
  const tasks = allTasks.filter((task) => {
    const matchesAssignee =
      !filterAssignee || task.assignees.some((a) => a.id === Number(filterAssignee))
    const matchesPriority = !filterPriority || task.priority === filterPriority
    return matchesAssignee && matchesPriority
  })

  const isSaving = taskMutations.create.isPending || taskMutations.update.isPending
  const saveError = taskMutations.create.error ?? taskMutations.update.error

  function handleSubmit(data) {
    const close = { onSuccess: () => setEditor(null) }

    if (editor === 'new') {
      taskMutations.create.mutate(data, close)
    } else {
      taskMutations.update.mutate({ id: editor.id, data }, close)
    }
  }

  function handleDeleteTask(task) {
    requestDelete('task', task)
  }

  function getDeleteMutation(type) {
    return type === 'task' ? taskMutations.remove : columnMutations.remove
  }

  function requestDelete(type, item) {
    getDeleteMutation(type).reset()
    setDeleteTarget({ type, item })
  }

  function closeDeleteDialog() {
    if (!deleteTarget) return

    const mutation = getDeleteMutation(deleteTarget.type)
    if (mutation.isPending) return

    setDeleteTarget(null)
    mutation.reset()
  }

  function confirmDelete() {
    if (!deleteTarget) return

    getDeleteMutation(deleteTarget.type).mutate(deleteTarget.item.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  function handleRenameColumn(column) {
    if (!columnMutations.update.isPending) columnMutations.update.reset()
    setColumnToRename(column)
    setColumnName(column.name)
    setRenameError('')
  }

  function closeRenameDialog() {
    if (columnMutations.update.isPending) return

    setColumnToRename(null)
    setRenameError('')
    columnMutations.update.reset()
  }

  function handleRenameSubmit(event) {
    event.preventDefault()
    const name = columnName.trim()
    if (!columnToRename || !name || name === columnToRename.name) return

    setRenameError('')
    columnMutations.update.mutate(
      { id: columnToRename.id, data: { name } },
      {
        onSuccess: () => setColumnToRename(null),
        onError: (error) => setRenameError(getErrorMessage(error)),
      },
    )
  }

  function handleToggleDoneColumn(column) {
    columnMutations.update.mutate({ id: column.id, data: { is_done: !column.is_done } })
  }

  function handleDeleteColumn(column) {
    requestDelete('column', column)
  }

  const errors = [
    taskMutations.move.error,
    !columnToRename && columnMutations.update.error,
  ].filter(Boolean)

  const loadFailed = columnsQuery.isError || tasksQuery.isError
  const deleteMutation = deleteTarget ? getDeleteMutation(deleteTarget.type) : null
  const deleteItemLabel = deleteTarget?.type === 'task' ? 'tâche' : 'colonne'
  const deleteItemName = deleteTarget?.type === 'task'
    ? deleteTarget.item.title
    : deleteTarget?.item.name

  return (
    <section className="rounded-3xl bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-ink">Tâches ({allTasks.length})</h2>

        <div className="flex flex-wrap gap-3">
          {
            !editor && <>
              <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className={SELECT}>
                <option value="">Tous les employés</option>
                {project.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>

              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className={SELECT}>
                <option value="">Toutes les priorités</option>
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </>
          }

          {isManager && !editor && (
            <button
              onClick={() => setEditor('new')}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <Plus size={16} />
              Nouvelle tâche
            </button>
          )}
        </div>
      </div>

      {editor && (
        <div className="mt-6 rounded-2xl bg-surface p-6">
          <h3 className="mb-6 font-semibold text-ink">
            {editor === 'new' ? 'Nouvelle tâche' : 'Modifier la tâche'}
          </h3>
          <TaskForm
            key={editor === 'new' ? 'new' : editor.id}
            task={editor === 'new' ? null : editor}
            columns={columns}
            members={project.members}
            onSubmit={handleSubmit}
            onCancel={() => {setEditor(null); taskMutations.create.reset()}}
            isSubmitting={isSaving}
            error={saveError ? getErrorMessage(saveError) : ''}
          />
        </div>
      )}

      {(columnsQuery.isPending) && (
        <div className="flex h-72 items-center justify-center">
          <Loader />
        </div>
      )}

      {loadFailed && (
        <div className="flex flex-col items-center justify-center mt-10">
          <img src={BoardImg} className="w-72 mb-5" />
          <p className="text-muted">Impossible de charger le tableau.</p>
          <button
            onClick={() => {
              columnsQuery.refetch()
              tasksQuery.refetch()
            }}
            className="mt-3 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Réessayer
          </button>
        </div>
      )}

      {columns.length > 0 && (
        <div className="mt-6">
          <KanbanBoard
            columns={columns}
            tasks={tasks}
            isManager={isManager}
            currentUserId={user?.id}
            onMove={(taskId, boardColumnId) =>
              taskMutations.move.mutate({ id: taskId, boardColumnId })
            }
            onEditTask={(task) => setEditor(task)}
            onDeleteTask={handleDeleteTask}
            onRenameColumn={handleRenameColumn}
            onToggleDoneColumn={handleToggleDoneColumn}
            onDeleteColumn={handleDeleteColumn}
            onAddColumn={columnMutations.create.mutate}
            isAddingColumn={columnMutations.create.isPending}
            addColumnError={columnMutations.create.error ? getErrorMessage(columnMutations.create.error) : ''}
          />
        </div>
      )}

      {errors.map((error, index) => (
        <p key={index} className="mt-4 text-sm text-red-600">
          {getErrorMessage(error)}
        </p>
      ))}

      {columnToRename && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeRenameDialog()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeRenameDialog()
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="rename-column-title"
            onSubmit={handleRenameSubmit}
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Pencil size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="rename-column-title" className="text-lg font-semibold text-ink">
                  Renommer la colonne
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Choisissez un nom clair pour cette étape du tableau.
                </p>
              </div>
              <button
                type="button"
                onClick={closeRenameDialog}
                disabled={columnMutations.update.isPending}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <label htmlFor="rename-column-name" className="mt-6 block text-sm font-medium text-ink">
              Nom de la colonne
            </label>
            <input
              id="rename-column-name"
              autoFocus
              value={columnName}
              onChange={(event) => setColumnName(event.target.value)}
              disabled={columnMutations.update.isPending}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-50 disabled:opacity-60"
            />

            {renameError && (
              <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {renameError}
              </p>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRenameDialog}
                disabled={columnMutations.update.isPending}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={
                  columnMutations.update.isPending ||
                  !columnName.trim() ||
                  columnName.trim() === columnToRename.name
                }
                className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {columnMutations.update.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDeleteDialog()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeDeleteDialog()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-item-title"
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="delete-item-title" className="text-lg font-semibold text-ink">
                  Supprimer cette {deleteItemLabel} ?
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  <span className="font-semibold text-ink">{deleteItemName}</span> sera supprimée
                  définitivement. Cette action est irréversible.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleteMutation.isPending}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {deleteMutation.error && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {getErrorMessage(deleteMutation.error)}
              </p>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                onClick={closeDeleteDialog}
                disabled={deleteMutation.isPending}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={15} />
                {deleteMutation.isPending ? 'Suppression...' : `Supprimer la ${deleteItemLabel}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}