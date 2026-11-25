import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Pencil, Plus, UserShield, Trash2, User, UserStar, X } from 'lucide-react'
import { invalidateUserData, userKeys, usersApi } from '../api/users'
import UserForm from '../components/UserForm'
import { useAuth } from '../context/AuthContext'
import UsersImg from '../assets/users_not_loaded.png'
import { getErrorMessage } from '../lib/errors'
import { roleLabels } from '../lib/labels'
import Loader from '../components/Loader'
import UserBadge from '../components/UserBadge'

// The backend returns 409 when a user still manages projects. Show a clear French message for it.
function getUserErrorMessage(error) {
  if (error?.response?.status === 409) {
    return "Cet utilisateur gère encore des projets. Réassignez-les ou supprimez-les d'abord."
  }
  return getErrorMessage(error)
}

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth()
  // null (closed), 'new' (create form), or the user being edited
  const [editor, setEditor] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)

  // Same rules as the backend, so the UI only shows what the user is allowed to do
  const canEdit = (target) =>
    target.id === currentUser?.id ||
    (!target.is_admin && (target.role === 'employee' || isAdmin))

  const canDelete = (target) =>
    target.id !== currentUser?.id &&
    !target.is_admin &&
    (target.role === 'employee' || isAdmin)

  const { data: users, isPending, isError, refetch } = useQuery({
    queryKey: userKeys.list,
    queryFn: usersApi.list,
  })

  const createMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      invalidateUserData()
      setEditor(null)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersApi.update(id, data),
    onSuccess: () => {
      invalidateUserData()
      setEditor(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: usersApi.remove,
    onSuccess: invalidateUserData,
  })

  const isSaving = createMutation.isPending || updateMutation.isPending
  const saveError = createMutation.error ?? updateMutation.error

  function handleSubmit(data) {
    if (editor === 'new') {
      createMutation.mutate(data)
    } else {
      updateMutation.mutate({ id: editor.id, data })
    }
  }

  function handleDelete(user) {
    deleteMutation.reset()
    setUserToDelete(user)
  }

  function closeDeleteDialog() {
    if (deleteMutation.isPending) return

    setUserToDelete(null)
    deleteMutation.reset()
  }

  function confirmDeleteUser() {
    if (!userToDelete) return

    deleteMutation.mutate(userToDelete.id, {
      onSuccess: () => setUserToDelete(null),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink">Utilisateurs</h1>
          <p className="mt-2 text-muted">
            {isAdmin
              ? 'Gérez les comptes des managers et des employés.'
              : 'Gérez les comptes des employés. Seul l\'administrateur gère les managers.'}
          </p>
        </div>

        {!editor && (
          <button
            onClick={() => setEditor('new')}
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus size={18} />
            Nouvel utilisateur
          </button>
        )}
      </div>

      {editor && (
        <section className="rounded-3xl bg-card p-8 shadow-sm">
          <div className='flex items-center justify-between mb-6'>
            <h2 className="text-lg font-semibold text-ink">
                {editor === 'new' ? 'Nouvel utilisateur' : `Modifier ${editor.name}`}
            </h2>
            {
                editor !== 'new' && <span
                title={editor.is_admin ? 'Administrateur' : roleLabels[editor.role]}
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                editor.is_admin
                    ? 'bg-amber-100 text-amber-700'
                    : editor.role === 'manager'
                    ? 'bg-brand-50 text-brand-600'
                    : 'bg-gray-100 text-ink'
                }`}
            >
                {editor.is_admin ? (
                <UserShield size={18} aria-hidden="true" />
                ) : editor.role === 'manager' ? (
                <UserStar size={18} aria-hidden="true" />
                ) : (
                <User size={18} aria-hidden="true" />
                )}
            </span>
            }
          </div>
          <UserForm
            key={editor === 'new' ? 'new' : editor.id}
            user={editor === 'new' ? null : editor}
            isSelf={editor !== 'new' && editor.id === currentUser?.id}
            canAssignManager={isAdmin}
            onSubmit={handleSubmit}
            onCancel={() => setEditor(null)}
            isSubmitting={isSaving}
            error={saveError ? getUserErrorMessage(saveError) : ''}
          />
        </section>
      )}

      <section className="rounded-3xl bg-card p-6 shadow-sm">
        {isPending && <div className="flex h-72 items-center justify-center">
            <Loader />
        </div>}

        {isError && (
          <div className="flex flex-col items-center justify-center mt-10">
            <img src={UsersImg} className="w-72 mb-5" />
            <p className="text-muted">Impossible de charger les utilisateurs.</p>
            <button
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Réessayer
            </button>
          </div>
        )}

        {users?.length > 0 && (
          <ul className="divide-y divide-surface">
            {users.map((user) => {
              const isSelf = user.id === currentUser?.id

              return (
                <li key={user.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div className="flex items-center gap-5">
                    <UserBadge user={user}/>
                    <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                        {user.name}
                        {isSelf && (
                            <span className="ml-2 inline-flex align-middle rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                            Vous
                            </span>
                        )}
                        </p>
                        <p className="truncate text-sm text-muted">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {canEdit(user) && (
                        <button
                        onClick={() => setEditor(user)}
                        title="Modifier"
                        className="rounded-lg p-2 text-muted hover:bg-surface hover:text-ink"
                        >
                        <Pencil size={16} />
                        </button>
                    )}

                    {canDelete(user) && (
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={deleteMutation.isPending}
                        title="Supprimer"
                        className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {userToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeDeleteDialog()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') closeDeleteDialog()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="w-full max-w-md rounded-3xl bg-card p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <AlertTriangle size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 id="delete-user-title" className="text-lg font-semibold text-ink">
                  Supprimer ce compte ?
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Le compte de <span className="font-semibold text-ink">{userToDelete.name}</span> sera
                  supprimé définitivement. Cette action est irréversible.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={deleteMutation.isPending}
                aria-label="Fermer"
                className="rounded-lg p-1.5 text-muted transition hover:bg-surface hover:text-ink disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {deleteMutation.isError && (
              <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {getUserErrorMessage(deleteMutation.error)}
              </p>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                autoFocus
                onClick={closeDeleteDialog}
                disabled={deleteMutation.isPending}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-surface disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={15} />
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer le compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}