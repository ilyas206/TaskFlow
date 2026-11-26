import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { projectKeys, projectsApi } from '../api/projects'
import ProjectBoard from '../components/ProjectBoard'
import Loader from '../components/Loader'
import projectImg from '../assets/projects_not_available.png'

// The board for one project, opened from the sidebar's Tâches accordion
export default function ProjectBoardPage() {
  const { projectId } = useParams()

  const { data: project, isPending, isError, refetch } = useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => projectsApi.get(projectId),
    retry: false,
  })

  if (isPending) {
    return <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <Loader />
    </div>
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl bg-card p-10 shadow-sm">
        <img src={projectImg} className="w-72 mb-5" />
        <p className="text-muted">Projet introuvable ou accès refusé.</p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          to={`/projets/${project.id}`}
          className="flex w-fit items-center gap-2 text-sm font-medium text-muted hover:text-ink"
        >
          <ArrowLeft size={16} />
          Retour au projet
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-ink">{project.name}</h1>
        <p className="mt-2 text-muted">Tableau des tâches</p>
      </div>

      <ProjectBoard project={project} />
    </div>
  )
}