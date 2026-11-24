import { useDroppable } from '@dnd-kit/core'
import { CheckCircle2, Flag, Pencil, Trash2 } from 'lucide-react'
import TaskCard from './TaskCard'

// One column. It accepts dropped cards and, for managers, shows the column controls.
export default function KanbanColumn({
  column,
  tasks,
  isManager,
  canMoveTask,
  onEditTask,
  onDeleteTask,
  onRename,
  onToggleDone,
  onDelete,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const hasTasks = tasks.length > 0

  return (
    <section
      className={`flex w-72 shrink-0 flex-col rounded-3xl p-4 transition ${
        isOver ? 'bg-brand-50' : 'bg-surface'
      }`}
    >
      <header className="mb-4 flex items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          {column.is_done && <CheckCircle2 size={16} className="shrink-0 text-green-600" />}
          <h3 className="truncate font-semibold text-ink">{column.name}</h3>
          <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-muted">
            {tasks.length}
          </span>
        </div>

        {isManager && (
          <div className="flex shrink-0 gap-1">
            <button 
              title="Renommer" 
              onClick={() => onRename(column)} 
              className="rounded-lg p-1.5 text-muted hover:bg-card hover:text-ink disabled:opacity-40">
              <Pencil size={14} />
            </button>
            <button
              title={column.is_done ? 'Ne plus marquer comme terminée' : 'Marquer comme terminée'}
              onClick={() => onToggleDone(column)}
              className={`rounded-lg p-1.5 text-muted ${column.is_done ? 'hover:bg-card' : 'hover:bg-green-100'} ${column.is_done ? 'hover:text-ink' : 'hover:text-green-600'} disabled:opacity-40`}
            >
              <Flag size={14} />
            </button>
            <button
              title={hasTasks ? 'Videz la colonne avant de la supprimer' : 'Supprimer la colonne'}
              disabled={hasTasks}
              onClick={() => onDelete(column)}
              className="rounded-lg p-1.5 text-muted hover:bg-red-100 hover:text-red-600 disabled:opacity-40"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </header>

      <div ref={setNodeRef} className="flex min-h-24 flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            draggable={canMoveTask(task)}
            canManage={isManager}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}

        {!hasTasks && (
          <p className="rounded-2xl border border-dashed border-gray-300 p-4 text-center text-xs text-muted">
            Aucune tâche
          </p>
        )}
      </div>
    </section>
  )
}