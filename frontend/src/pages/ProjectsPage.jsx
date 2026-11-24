import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { invalidateProjectData, projectKeys, projectsApi } from '../api/projects'
import ProjectForm from '../components/ProjectForm'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../lib/errors'
import { formatDate } from '../lib/format'
import Loader from '../components/Loader'
import projectsImg from '../assets/projects_not_loaded.png'

export default function ProjectsPage() {
  const { isManager } = useAuth()
  const [showForm, setShowForm] = useState(false)

  const { data: projects, isPending, isError, refetch } = useQuery({
    queryKey: projectKeys.list,
    queryFn: projectsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      invalidateProjectData()
      setShowForm(false)
    },
  })

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Projets</h1>
          <p className="mt-2 text-muted">
            {isManager ? 'Les projets que vous gérez' : 'Les projets auxquels vous participez'}
          </p>
        </div>

        {/* Only managers can create projects. The backend also rejects employees. */}
        {isManager && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold shadow-sm text-white hover:bg-brand-600"
          >
            <Plus size={18} />
            Nouveau projet
          </button>
        )}
      </div>

      {isManager && showForm && (
        <section className="rounded-3xl bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-ink">Nouveau projet</h2>
          <ProjectForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
            isSubmitting={createMutation.isPending}
            error={createMutation.isError ? getErrorMessage(createMutation.error) : ''}
          />
        </section>
      )}

      {isPending && (
        <div className="flex flex-1 items-center justify-center">
          <Loader />
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-card p-10 shadow-sm">
          <img src={projectsImg} className="w-72 mb-5" />
          <p className="text-muted">Impossible de charger les projets.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Réessayer
          </button>
        </div>
      )}

      {projects?.length === 0 && (
        <p className="text-muted">Aucun projet pour le moment.</p>
      )}

      {projects?.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project }) {
  const { isManager } = useAuth()
  return (
    <Link
      to={`/projets/${project.id}`}
      className="flex flex-col gap-4 rounded-3xl bg-card p-6 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="truncate text-lg font-semibold text-ink">{project.name}</h2>
        <StatusBadge status={project.status} />
      </div>

      <p className="line-clamp-2 text-sm text-muted">
        {project.description || 'Aucune description.'}
      </p>

      <div className="mt-auto flex gap-1 text-sm text-center text-muted">
        <span className="w-1/2 bg-brand-500 text-brand-50 font-semibold p-2 rounded-md">
          {formatDate(project.start_date)}
        </span>
        
        <span className="w-1/2 bg-brand-700 text-brand-50 font-semibold p-2 rounded-md">
          {formatDate(project.end_date)}
        </span>
      </div>
      {
        !isManager && <span className="bg-brand-50 text-brand-600 text-sm text-center p-2 rounded-md">Manager : {project.manager?.name}</span>
      }
    </Link>
  )
}