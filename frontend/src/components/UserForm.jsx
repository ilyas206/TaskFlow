import { useState } from 'react'
import { roleLabels } from '../lib/labels'

const INPUT = 'rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand-500'

// The same form creates and edits users. isSelf disables the role field for the logged-in manager.
// canAssignManager is true only for the administrator.
// Everyone else sees only the employee role.
export default function UserForm({ user, isSelf, canAssignManager, onSubmit, onCancel, isSubmitting, error }) {
  const isEdit = Boolean(user)
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role ?? 'employee',
  })

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const roleOptions = canAssignManager
    ? Object.entries(roleLabels)
    : [['employee', roleLabels.employee]]

  function handleSubmit(event) {
    event.preventDefault()

    const data = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
    }

    // On edit, an empty password means "keep the current password"
    if (form.password) {
      data.password = form.password
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        Nom complet
        <input required value={form.name} onChange={setField('name')} className={INPUT} />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        Adresse e-mail
        <input type="email" required value={form.email} onChange={setField('email')} className={INPUT} />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        {isEdit ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe (8 caractères minimum)'}
        <input
          type="password"
          required={!isEdit}
          minLength={8}
          value={form.password}
          onChange={setField('password')}
          className={INPUT}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        Rôle
        <select
          value={form.role}
          disabled={isSelf}
          onChange={setField('role')}
          className={`${INPUT} disabled:bg-surface disabled:text-muted`}
        >
          {roleOptions.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {isSelf && (
        <p className="text-sm text-muted md:col-span-2">Vous ne pouvez pas modifier votre propre rôle.</p>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 md:col-span-2">{error}</p>
      )}

      <div className="flex justify-end gap-3 md:col-span-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-muted hover:bg-surface"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}