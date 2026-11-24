import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, CircleDot, Dot, Folder } from 'lucide-react'
import { taskKeys, tasksApi } from '../api/tasks'
import { useAuth } from '../context/AuthContext'
import tasksImg from '../assets/tasks_not_loaded.png'
import { formatDate } from '../lib/format'
import Loader from '../components/Loader'

export default function TasksPage() {
  const { isManager } = useAuth()

  if (isManager) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-ink">Tâches</h1>
        <p className="text-muted">Les tâches se gèrent depuis le tableau de chaque projet.</p>
        <Link to="/projets" className="w-fit font-semibold text-brand-600">
          Voir mes projets
        </Link>
      </div>
    )
  }

  return <MyTasks />
}

function MyTasks() {
  const { data: tasks, isPending, isError, refetch } = useQuery({
    queryKey: taskKeys.mine,
    queryFn: tasksApi.listMine,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Mes tâches</h1>
        <p className="mt-2 text-muted">Les tâches qui vous sont assignées, tous projets confondus.</p>
      </div>

      <section className="rounded-3xl bg-card p-6 shadow-sm">
        {isPending && <div className="flex h-72 items-center justify-center">
          <Loader />
        </div>}

        {isError && (
          <div className='flex flex-col items-center justify-center'>
            <img src={tasksImg} className="w-72 mb-5" />
            <p className="text-muted">Impossible de charger vos tâches.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Réessayer
            </button>
          </div>
        )}

        {tasks?.length === 0 && <p className="text-muted">Aucune tâche assignée.</p>}

        {tasks?.length > 0 && (
          <ul className="flex flex-col gap-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-col gap-3 rounded-2xl border border-surface p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{task.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {task.project?.name && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1 text-xs font-medium text-muted">
                        <Folder size={13} aria-hidden="true" />
                        {task.project.name}
                      </span>
                    )}
                    {task.board_column?.name && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                        <CircleDot size={13} aria-hidden="true" />
                        {task.board_column.name}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ${
                        task.is_overdue
                          ? 'bg-red-50 text-red-700'
                          : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      <CalendarDays size={13} aria-hidden="true" />
                      <span>Échéance</span>
                      <span className="font-semibold">{formatDate(task.due_date)}</span>
                      {task.is_overdue && (
                        <>
                          <Dot/>
                          <span className="font-semibold">
                            En retard
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/projets/${task.project.id}`}
                    className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-100"
                  >
                    Ouvrir le tableau
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}