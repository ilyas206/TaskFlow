import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ListChecks } from 'lucide-react'
import { projectKeys, projectsApi } from '../api/projects'

// Sidebar item "Tâches": expands to show the projects the user manages or belongs to
export default function TasksAccordion() {
  const location = useLocation()
  // Open automatically when the user is already on a board page
  const [open, setOpen] = useState(location.pathname.startsWith('/taches'))

  // Same cache key as the projects page, so no extra request is made
  const { data: projects, isPending, isError } = useQuery({
    queryKey: projectKeys.list,
    queryFn: projectsApi.list,
  })

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface hover:text-ink"
      >
        <span className="flex items-center gap-3">
          <ListChecks size={18} />
          Tâches
        </span>
        <ChevronDown size={16} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="flex flex-col gap-1 pl-3">
          {isPending && <p className="px-2 py-1.5 text-xs text-muted">Chargement...</p>}
          {isError && <p className="px-2 py-1.5 text-xs text-red-600">Impossible de charger.</p>}
          {projects?.length === 0 && <p className="px-2 py-1.5 text-xs text-muted">Aucun projet.</p>}

          {projects?.map((project) => (
            <NavLink
              key={project.id}
              to={`/taches/${project.id}`}
              title={project.name}
              className={({ isActive }) =>
                `truncate rounded-lg px-2.5 py-2 text-xs transition ${
                  isActive
                    ? 'bg-brand-50 font-medium text-brand-600'
                    : 'text-muted hover:bg-surface hover:text-ink'
                }`
              }
            >
              {project.name}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}