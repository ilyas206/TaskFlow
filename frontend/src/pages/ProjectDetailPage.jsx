import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Trash2, User, UserMinus } from 'lucide-react'
import { dashboardApi, dashboardKeys } from '../api/dashboard'
import { invalidateProjectData, projectKeys, projectsApi } from '../api/projects'
import { userKeys, usersApi } from '../api/users'
import ProgressBar from '../components/ProgressBar'
import ProjectForm from '../components/ProjectForm'
import StatusBadge from '../components/StatusBadge'
import TaskBreakdown from '../components/TaskBreakdown'
import ProjectTaskList from '../components/ProjectTaskList'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../lib/errors'
import { formatDate } from '../lib/format'
import Loader from '../components/Loader'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isManager } = useAuth()
  const [editing, setEditing] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')

  // All hooks run before any early return, as React requires
  const projectQuery = useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectsApi.get(id),
    retry: false,
  })

  // Task statistics for this project. Members and managers can read them.
  const statsQuery = useQuery({
    queryKey: dashboardKeys.project(id),
    queryFn: () => dashboardApi.project(id),
    retry: false,
  })

  // Only managers can list all users, so the query runs only for them
  const usersQuery = useQuery({
    queryKey: userKeys.list,
    queryFn: usersApi.list,
    enabled: isManager,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => projectsApi.update(id, data),
    onSuccess: () => {
      invalidateProjectData()
      setEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.remove(id),
    onSuccess: () => {
      invalidateProjectData()
      navigate('/projets', { replace: true })
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: (userId) => projectsApi.addMember(id, userId),
    onSuccess: () => {
      invalidateProjectData()
      setSelectedUserId('')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => projectsApi.removeMember(id, userId),
    onSuccess: () => invalidateProjectData(),
  })

  if (projectQuery.isPending) {
    return <Loader/>
  }

  // A 403 or 404 both end up here: the project is missing or not visible to this user
  if (projectQuery.isError) {
    return (
      <div className="rounded-3xl bg-card p-10 shadow-sm">
        <p className="text-muted">Projet introuvable ou accès refusé.</p>
        <Link to="/projets" className="mt-4 inline-block font-semibold text-brand-600">
          Retour aux projets
        </Link>
      </div>
    )
  }

  const project = projectQuery.data
  const stats = statsQuery.data?.tasks

  // Employees that are not yet in this project
  const memberIds = project.members.map((member) => member.id)
  const candidates = (usersQuery.data ?? []).filter(
    (user) => user.role === 'employee' && !memberIds.includes(user.id)
  )

  function handleDelete() {
    if (window.confirm('Supprimer ce projet et toutes ses tâches ?')) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/projets" className="flex w-fit items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} />
        Retour aux projets
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className={isManager ? 'w-2/3' : 'w-full'}>
          <StatusBadge status={project.status} />
          <h1 className="text-3xl font-bold text-ink mt-2">{project.name}</h1>
          <div className='mt-3 flex items-center text-center gap-1'>
            <span className="w-1/2 bg-brand-500 text-brand-50 font-semibold p-2 rounded-md">
              Début : {formatDate(project.start_date)}
            </span>
            
            <span className="w-1/2 bg-brand-700 text-brand-50 font-semibold p-2 rounded-md">
              Fin : {formatDate(project.end_date)}
            </span>  
          </div>
          {
            !isManager && <p className="mt-1 text-center bg-brand-400 text-brand-50 font-semibold p-2 rounded-md">
              Manager : {project.manager?.name}
            </p>
          }
          {project.description && <p className="mt-3 max-w-2xl text-ink">{project.description}</p>}
        </div>

        {isManager && !editing && (
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-100"
            >
              <Pencil size={16} />
              Modifier
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        )}
      </div>

      {deleteMutation.isError && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {getErrorMessage(deleteMutation.error)}
        </p>
      )}

      {isManager && editing && (
        <section className="rounded-3xl bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-ink">Modifier le projet</h2>
          <ProjectForm
            key={project.id}
            project={project}
            onSubmit={(data) => updateMutation.mutate(data)}
            onCancel={() => setEditing(false)}
            isSubmitting={updateMutation.isPending}
            error={updateMutation.isError ? getErrorMessage(updateMutation.error) : ''}
          />
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Progress and task counts come from the Step 7 endpoint */}
        <section className="rounded-3xl bg-card p-6 shadow-sm xl:col-span-2">
          <h2 className="text-lg font-semibold text-ink">Avancement</h2>

          {stats ? (
            <>
              <p className="mt-4 text-4xl font-bold text-ink">{stats.progress}%</p>
              <p className="mt-1 text-sm text-muted">des tâches sont terminées</p>
              <div className="mt-6">
                <ProgressBar value={stats.progress} />
              </div>
              <div className="mt-8">
                <TaskBreakdown tasks={stats} />
              </div>
              {stats.overdue > 0 && (
                <p className="mt-6 text-sm font-medium text-red-600">
                  {stats.overdue} tâche(s) en retard
                </p>
              )}
            </>
          ) : (
            <p className="mt-4 text-muted">Statistiques indisponibles.</p>
          )}
        </section>

        <section className="rounded-3xl bg-card p-6 shadow-sm">
          <div className='flex items-center justify-between'>
            <h2 className="text-lg font-semibold text-ink">Membres</h2>
            <span className='flex items-center gap-1 rounded-lg font-semibold py-2 px-3 bg-brand-50 text-brand-600'>
              <User size={18}/>
              {project.members.length}
            </span>
          </div>

          {project.members.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aucun membre pour le moment.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {project.members.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{member.name}</p>
                    <p className="truncate text-xs text-muted">{member.email}</p>
                  </div>
                  {isManager && (
                    <button
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      className="flex items-center gap-2 rounded-lg p-2 text-sm text-muted hover:bg-red-50 hover:text-red-600"
                    >
                      <UserMinus size={16} />
                      Retirer du projet
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isManager && (
            <div className="mt-6 flex flex-col gap-3 border-t border-surface pt-6">
              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                <option value="">Choisir un employé</option>
                {candidates.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => addMemberMutation.mutate(Number(selectedUserId))}
                disabled={!selectedUserId || addMemberMutation.isPending}
                className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {addMemberMutation.isPending ? 'Ajout en cours...' : 'Ajouter au projet'}
              </button>

              {(addMemberMutation.isError || removeMemberMutation.isError) && (
                <p className="text-sm text-red-600">
                  {getErrorMessage(addMemberMutation.error ?? removeMemberMutation.error)}
                </p>
              )}
            </div>
          )}
        </section>
      </div>

      <ProjectTaskList project={project} />
    </div>
  )
}