import { useState } from 'react'
import { projectStatusLabels } from '../lib/labels'

const INPUT = 'rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand-500'

// Dates from Laravel look like "2026-01-01T00:00:00.000000Z". The date input needs "2026-01-01".
const toDateInput = (value) => (value ? value.slice(0, 10) : '')

export default function ProjectForm({ project, onSubmit, onCancel, isSubmitting, error }) {
  const [form, setForm] = useState({
    name: project?.name ?? '',
    description: project?.description ?? '',
    start_date: toDateInput(project?.start_date),
    end_date: toDateInput(project?.end_date),
    status: project?.status ?? 'planned',
  })

  // Updates one field and keeps the others
  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  function handleSubmit(event) {
    event.preventDefault()
    // An empty description is sent as null, which the backend accepts
    onSubmit({ ...form, description: form.description.trim() || null })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm font-medium text-ink md:col-span-2">
        Nom du projet
        <input required value={form.name} onChange={setField('name')} className={INPUT} />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink md:col-span-2">
        Description
        <textarea
          rows={3}
          value={form.description}
          onChange={setField('description')}
          className={INPUT}
        />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        Date de début
        <input type="date" required value={form.start_date} onChange={setField('start_date')} className={INPUT} />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        Date de fin
        <input type="date" required value={form.end_date} onChange={setField('end_date')} className={INPUT} />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink md:col-span-2">
        Statut
        <select value={form.status} onChange={setField('status')} className={INPUT}>
          {Object.entries(projectStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

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