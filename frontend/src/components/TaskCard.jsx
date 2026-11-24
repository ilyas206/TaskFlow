import { useDraggable } from '@dnd-kit/core'
import { CalendarDays, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '../lib/format'
import { priorityLabels } from '../lib/labels'

const priorityStyles = {
  low: 'bg-surface text-muted',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-red-50 text-red-600',
}

const assigneeColors = [
  'bg-brand-100 text-brand-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-yellow-100 text-yellow-700',
]

function getAssigneeColor(assignee) {
  const identifier = String(assignee.id ?? assignee.name)
  const hash = Array.from(identifier).reduce(
    (value, character) => (value * 31 + character.charCodeAt(0)) >>> 0,
    0,
  )

  return assigneeColors[hash % assigneeColors.length]
}

// One card on the board. The card is draggable only when the user is allowed to move it.
export default function TaskCard({ task, draggable, canManage, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
    disabled: !draggable,
  })

  // Moves the card with the pointer while dragging
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-ink">{task.title}</p>
        {canManage && (
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => onEdit(task)}
              title="Modifier"
              className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-ink"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(task)}
              title="Supprimer"
              className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span title='priorité' className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityStyles[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
        {task.is_overdue && (
          <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-600">
            En retard
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          {task.assignees.length > 0 ? (
            task.assignees.map((assignee) => (
              <span
                key={assignee.id ?? assignee.name}
                title={assignee.name}
                aria-label={assignee.name}
                className={`flex size-7 items-center justify-center rounded-md text-xs font-semibold ${getAssigneeColor(assignee)}`}
              >
                {assignee.name.charAt(0).toLocaleUpperCase()}
              </span>
            ))
          ) : (
            <span>Non assignée</span>
          )}
        </div>
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs ${
            task.is_overdue
              ? 'bg-red-50 text-red-700'
              : 'bg-brand-50 text-brand-700'
          }`}
        >
          <CalendarDays size={14} aria-hidden="true" />
          <span>Échéance</span>
          <span className="font-semibold">{formatDate(task.due_date)}</span>
        </span>
      </div>
    </article>
  )
}