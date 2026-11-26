import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Clock, FolderKanban, ListChecks } from 'lucide-react'
import { dashboardApi, dashboardKeys } from '../api/dashboard'
import ProgressBar from '../components/ProgressBar'
import StatCard from '../components/StatCard'
import TaskBreakdown from '../components/TaskBreakdown'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import StatusBadge from '../components/StatusBadge'
import dashboardImg from '../assets/dashboard_not_loaded.png'

export default function DashboardPage() {
  const { user, isManager } = useAuth()

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-1 flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">Bonjour, {user?.name}</h1>
        <p className="mt-2 text-muted">
          {isManager ? "Vue d'ensemble de vos projets" : 'Vos tâches et votre progression'}
        </p>
      </div>

      {/* The role decides which endpoint is called. The backend enforces the same rule. */}
      {isManager ? <ManagerDashboard /> : <EmployeeDashboard />}
    </div>
  )
}

// Shown while loading, or when the request fails
function QueryState({ isError, onRetry }) {
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl bg-card p-10 shadow-sm">
        <img src={dashboardImg} className="w-72 mb-5" />
        <p className="text-muted">Impossible de charger le tableau de bord.</p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return <div className="flex flex-1 items-center justify-center">
    <Loader />
  </div>
}

function ManagerDashboard() {
  const query = useQuery({
    queryKey: dashboardKeys.manager,
    queryFn: dashboardApi.manager,
  })

  // No data yet: show loading or the error state
  if (!query.data) {
    return <QueryState isError={query.isError} onRetry={query.refetch} />
  }

  const { projects, tasks } = query.data

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Projets" value={projects.total} icon={FolderKanban} />
        <StatCard label="Projets actifs" value={projects.active} icon={CheckCircle2} />
        <StatCard label="Tâches" value={tasks.total} icon={ListChecks} />
        <StatCard label="Tâches en retard" value={tasks.overdue} icon={AlertTriangle} danger />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-3xl bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-ink">Avancement global</h2>
          <p className="mt-4 text-4xl font-bold text-ink">{tasks.progress}%</p>
          <p className="mt-1 text-sm text-muted">des tâches sont terminées</p>
          <div className="mt-6">
            <ProgressBar value={tasks.progress} />
          </div>
          <div className="mt-8">
            <TaskBreakdown tasks={tasks} />
          </div>
        </section>

        <section className="rounded-3xl bg-card p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-ink">Mes projets</h2>

          {projects.list.length === 0 ? (
            <p className="mt-6 text-muted">Aucun projet pour le moment.</p>
          ) : (
            <ul className="mt-6 flex flex-col gap-6">
              {projects.list.map((project) => (
                <li key={project.id}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className='flex items-center gap-2'>
                        <p className="truncate font-medium text-ink">{project.name}</p>
                        <StatusBadge status={project.status} />
                      </div>
                    </div>
                    {/* <span className="text-sm font-semibold text-brand-600">{project.progress}%</span> */}
                    <span className={`text-sm font-semibold ${project.progress === 100 ? 'text-green-600' : 'text-brand-600'}`}>{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} className={project.progress === 100 ? 'bg-green-500' : 'bg-brand-500'} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

function EmployeeDashboard() {
  const query = useQuery({
    queryKey: dashboardKeys.employee,
    queryFn: dashboardApi.employee,
  })

  if (!query.data) {
    return <QueryState isError={query.isError} onRetry={query.refetch} />
  }

  const { projects, tasks } = query.data

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mes projets" value={projects} icon={FolderKanban} />
        <StatCard label="Mes tâches" value={tasks.total} icon={ListChecks} />
        <StatCard label="En cours" value={tasks.in_progress} icon={Clock} />
        <StatCard label="En retard" value={tasks.overdue} icon={AlertTriangle} danger />
      </div>

      <section className="rounded-3xl bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink">Ma progression</h2>
        <p className="mt-4 text-4xl font-bold text-ink">{tasks.progress}%</p>
        <p className="mt-1 text-sm text-muted">de mes tâches sont terminées</p>
        <div className="mt-6">
          <ProgressBar value={tasks.progress} />
        </div>
        <div className="mt-8">
          <TaskBreakdown tasks={tasks} />
        </div>
      </section>
    </>
  )
}