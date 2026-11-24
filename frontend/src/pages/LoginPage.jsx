import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { user, login, isLoggingIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  // Already logged in: skip the login form
  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      // Axios puts the HTTP status in err.response. 422 means wrong credentials.
      if (err.response?.status === 422) {
        setError('Adresse e-mail ou mot de passe incorrect.')
      } else {
        setError('Impossible de se connecter. Vérifiez que le serveur fonctionne.')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md rounded-3xl bg-card p-10 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">Bienvenue sur Task<span className='text-brand-500'>Flow</span></h1>
        <p className="mt-2 text-sm text-muted">Connectez-vous pour gérer vos projets.</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-ink">
            Adresse e-mail
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-surface px-4 py-2.5 outline-none focus:border-brand-500"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-ink">
            Mot de passe
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-surface px-4 py-2.5 outline-none focus:border-brand-500"
            />
          </label>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            {isLoggingIn ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}