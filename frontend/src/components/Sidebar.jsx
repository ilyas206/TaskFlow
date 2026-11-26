import { NavLink, useNavigate } from 'react-router-dom'
import { FolderKanban, LayoutDashboard, ListChecks, LogOut, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logo from "../assets/logo.png"
import UserBadge from './UserBadge'
import TasksAccordion from './TasksAccordion'

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/projets', label: 'Projets', icon: FolderKanban },
  { to: '/taches', label: 'Tâches', icon: ListChecks, accordion: true },
  { to: '/utilisateurs', label: 'Utilisateurs', icon: Users, managerOnly: true },
]

export default function Sidebar() {
  const { user, isManager, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  // Managers see all items. Employees do not see the manager-only link.
  const visibleItems = navItems.filter((item) => !item.managerOnly || isManager)

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between rounded-3xl bg-card p-5 shadow-sm">
      <div>
        <img src={logo} alt="Logo" className="pb-5 mx-auto w-8/10"/>

        <nav className="flex flex-col gap-1">
          {visibleItems.map(({ to, label, icon: Icon, end, accordion }) => accordion ? (
            <TasksAccordion key={to} />
          ) : (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-muted hover:bg-surface hover:text-ink'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div>
        <div className="flex items-center gap-3 border-y border-surface px-1 py-2 mb-2">
          <UserBadge user={user}/>
          <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-red-100 hover:text-red-600"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}