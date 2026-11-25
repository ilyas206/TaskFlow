import { Outlet } from 'react-router-dom'
import NotificationBell from '../components/NotificationBell'
import Sidebar from '../components/Sidebar'

// The shared frame for all logged-in pages: sidebar on the left, page content on the right
export default function AppLayout() {
  return (
    <div className="flex min-h-screen gap-6 bg-surface p-6">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
      <NotificationBell />
    </div>
  )
}