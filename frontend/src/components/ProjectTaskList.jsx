import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, CircleDot, Dot, LayoutGrid, Plus } from 'lucide-react'
import { taskKeys, tasksApi } from '../api/tasks'
import { formatDate } from '../lib/format'
import { columnKeys, columnsApi } from '../api/columns'
import { useAuth } from '../context/AuthContext'
import { useTaskMutations } from '../hooks/useTaskMutations'
import { getErrorMessage } from '../lib/errors'
import TaskForm from './TaskForm'

// Task cards shown on the project detail page. "Ouvrir le tableau" opens the board.
export default function ProjectTaskList({ project }) {

  const { isManager } = useAuth()
  const [creating, setCreating] = useState(false)
  const taskMutations = useTaskMutations(project.id)

  // Columns are needed only when the form is open
  const columnsQuery = useQuery({
    queryKey: columnKeys.list(project.id),
    queryFn: () => columnsApi.list(project.id),
    enabled: creating,
  })

  function handleCreate(data) {
    taskMutations.create.mutate(data, {
      onSuccess: () => setCreating(false),
    })
  }

  const { data: tasks, isPending, isError, refetch } = useQuery({
    queryKey: taskKeys.project(project.id),
    queryFn: () => tasksApi.listByProject(project.id),
  })

  return (
    <section className="rounded-3xl bg-card p-6 shadow-sm">

      <div className='flex flex-wrap items-center justify-between gap-3'>
        <h2 className="text-lg font-semibold text-ink">Tâches ({tasks?.length ?? 0})</h2>
        <div className="flex flex-wrap items-center gap-3">
          {/* Only managers can create tasks. The backend also rejects employees. */}
          {isManager && !creating && (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              <Plus size={20} />
              Nouvelle tâche
            </button>
          )}
          <Link
            to={`/taches/${project.id}`}
            className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-100"
          >
              <LayoutGrid size={20} />
              Ouvrir le tableau
          </Link>
        </div>
      </div>

      {creating && (
        <div className="mt-6 rounded-2xl bg-surface p-6">
          <h3 className="mb-6 font-semibold text-ink">Nouvelle tâche</h3>
          <TaskForm
            columns={columnsQuery.data ?? []}
            members={project.members}
            onSubmit={handleCreate}
            onCancel={() => {setCreating(false); taskMutations.create.reset()}}
            isSubmitting={taskMutations.create.isPending}
            error={taskMutations.create.error ? getErrorMessage(taskMutations.create.error) : ''}
          />
        </div>
      )}

      {isPending && <p className="mt-6 text-muted">Chargement...</p>}

      {isError && (
        <div className="mt-6">
          <p className="text-muted">Impossible de charger les tâches.</p>
          <button
            onClick={() => refetch()}
            className="mt-3 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Réessayer
          </button>
        </div>
      )}

      {tasks?.length === 0 && <p className="mt-6 text-muted">Aucune tâche pour le moment.</p>}

      {tasks?.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex min-w-0 flex-col gap-3 rounded-2xl border border-surface p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 max-w-2xl">
                <p className="truncate font-medium text-ink">{task.title}</p>
                <p className="max-w-lg py-1 text-xs font-light text-muted">
                  {task.description ? task.description : 'Aucune description.'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {task.board_column?.name && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                      <CircleDot size={13} aria-hidden="true" />
                      {task.board_column.name}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ${
                      task.is_overdue ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    <CalendarDays size={13} aria-hidden="true" />
                    <span>Échéance</span>
                    <span className="font-semibold">{formatDate(task.due_date)}</span>
                    {task.is_overdue && (
                      <>
                        <Dot size={13} aria-hidden="true" />
                        <span className="font-semibold">En retard</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* {tasks?.length > 0 && (
        <ul className="mt-6 flex flex-col gap-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-col gap-3 rounded-2xl border border-surface p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 max-w-2xl">
                <p className="truncate font-medium text-ink">{task.title}</p>
                <p className="max-w-lg py-1 text-xs font-light text-muted">
                  {task.description ? task.description : 'Aucune description.'}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {task.board_column?.name && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                      <CircleDot size={13} aria-hidden="true" />
                      {task.board_column.name}
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ${
                      task.is_overdue ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-700'
                    }`}
                  >
                    <CalendarDays size={13} aria-hidden="true" />
                    <span>Échéance</span>
                    <span className="font-semibold">{formatDate(task.due_date)}</span>
                    {task.is_overdue && (
                      <>
                        <Dot size={13} aria-hidden="true" />
                        <span className="font-semibold">En retard</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )} */}
    </section>
  )
}