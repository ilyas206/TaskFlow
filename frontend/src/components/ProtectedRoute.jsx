import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import serverDownImg from "../assets/server_down.png"
import Loader from './Loader'

// Guards a group of pages. Pass role="manager" to restrict them to managers.
export default function ProtectedRoute({ role }) {
  const { user, loading, serverError, retryAuth } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted">
        <Loader/>
      </div>
    )
  }

  // The token is still saved, but the backend did not answer: keep the session and offer a retry
  if (serverError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-6">
        <div className="flex flex-col items-center justify-center rounded-3xl bg-card p-10 shadow-sm">
          <img src={serverDownImg} className="w-72 mb-5" />
          <p className="text-muted">Impossible de se connecter au serveur.</p>
          <button
            onClick={() => retryAuth()}
            className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}