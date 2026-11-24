import { useState } from 'react'
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import KanbanColumn from './KanbanColumn'

export default function KanbanBoard({
  columns,
  tasks,
  isManager,
  currentUserId,
  onMove,
  onEditTask,
  onDeleteTask,
  onRenameColumn,
  onToggleDoneColumn,
  onDeleteColumn,
  onAddColumn,
  isAddingColumn,
  addColumnError,
}) {
  // The card moves only after the pointer travels 6px, so a normal click still opens things
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  // Managers can move any task. Employees can move tasks they are assigned to.
  const canMoveTask = (task) =>
    isManager || task.assignees.some((assignee) => assignee.id === currentUserId)

  function handleDragEnd({ active, over }) {
    if (!over) return

    const task = active.data.current.task
    const targetColumnId = over.id

    // Dropped in the same column: nothing to do
    if (task.board_column?.id === targetColumnId) return

    onMove(task.id, targetColumnId)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex items-start gap-4 overflow-x-auto pb-2">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((task) => task.board_column?.id === column.id)}
            isManager={isManager}
            canMoveTask={canMoveTask}
            onEditTask={onEditTask}
            onDeleteTask={onDeleteTask}
            onRename={onRenameColumn}
            onToggleDone={onToggleDoneColumn}
            onDelete={onDeleteColumn}
          />
        ))}

        {isManager && (
          <AddColumnForm onAdd={onAddColumn} isSaving={isAddingColumn} error={addColumnError} />
        )}
      </div>
    </DndContext>
  )
}

// Shows a "+" button, then a small form to name a new column
function AddColumnForm({ onAdd, isSaving, error }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isDone, setIsDone] = useState(false)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-72 shrink-0 items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-gray-300 p-4 text-sm font-semibold text-muted hover:border-brand-500 hover:text-brand-600"
      >
        <Plus size={18} />
        Ajouter une colonne
      </button>
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    onAdd(
      { name: name.trim(), is_done: isDone },
      {
        onSuccess: () => {
          setName('')
          setIsDone(false)
          setOpen(false)
        },
      }
    )
  }

  function handleClose(){
    setOpen(false)
    setName('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-72 shrink-0 flex-col gap-3 rounded-3xl bg-card p-4 shadow-sm"
    >
      <input
        required
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nom de la colonne"
        className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
      />

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={isDone}
          onChange={(event) => setIsDone(event.target.checked)}
          className="accent-brand-500"
        />
        Colonne terminée
      </label>

      {(error && name) && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-2 pt-5">
        <button
          type="button"
          onClick={handleClose}
          className="rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:bg-surface"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {isSaving ? 'Ajout en cours...' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}