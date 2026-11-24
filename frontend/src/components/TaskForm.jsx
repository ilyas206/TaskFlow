import { useState } from 'react'
import { priorityLabels } from '../lib/labels'

const INPUT = 'rounded-xl border border-gray-200 px-4 py-2.5 outline-none focus:border-brand-500'

const toDateInput = (value) => (value ? value.slice(0, 10) : '')

// The same form creates and edits tasks. columns and members come from the project.
export default function TaskForm({ task, columns, members, onSubmit, onCancel, isSubmitting, error }) {
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    board_column_id: task?.board_column?.id ? String(task.board_column.id) : '',
    assignee_ids: task?.assignees?.map((a) => a.id) ?? [],
    priority: task?.priority ?? 'medium',
    start_date: toDateInput(task?.start_date),
    due_date: toDateInput(task?.due_date),
  })

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  function toggleAssignee(userId) {
    setForm((current) => ({
      ...current,
      assignee_ids: current.assignee_ids.includes(userId)
        ? current.assignee_ids.filter((id) => id !== userId)
        : [...current.assignee_ids, userId],
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    onSubmit({
      title: form.title,
      description: form.description.trim() || null,
      // Empty on create means "first column", which the backend picks
      board_column_id: form.board_column_id ? Number(form.board_column_id) : null,
      assignee_ids: form.assignee_ids,
      priority: form.priority,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
      <label className="flex flex-col gap-2 text-sm font-medium text-ink md:col-span-2">
        Titre
        <input required value={form.title} onChange={setField('title')} className={INPUT} />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink md:col-span-2">
        Description
        <textarea rows={3} value={form.description} onChange={setField('description')} className={INPUT} />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        Colonne
        <select value={form.board_column_id} onChange={setField('board_column_id')} className={INPUT}>
          {!task && <option value="">Première colonne (par défaut)</option>}
          {columns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        Priorité
        <select value={form.priority} onChange={setField('priority')} className={INPUT}>
          {Object.entries(priorityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2 text-sm font-medium text-ink md:col-span-2">
        <legend className="mb-2">Employés assignés</legend>

        {members.length === 0 ? (
          <p className="font-normal text-muted">Ajoutez d'abord des membres au projet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members.map((member) => {
              const checked = form.assignee_ids.includes(member.id)

              return (
                <label
                  key={member.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 ${
                    checked ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200 text-ink'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAssignee(member.id)}
                    className="accent-brand-500"
                  />
                  {member.name}
                </label>
              )
            })}
          </div>
        )}
      </fieldset>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        Date de début
        <input type="date" value={form.start_date} onChange={setField('start_date')} className={INPUT} />
      </label>

      <label className="flex flex-col gap-2 text-sm font-medium text-ink">
        Date limite
        <input type="date" value={form.due_date} onChange={setField('due_date')} className={INPUT} />
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