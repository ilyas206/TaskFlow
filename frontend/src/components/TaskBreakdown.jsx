import ProgressBar from './ProgressBar'

// Counts tasks as not started, in progress, and done, with each share of the total
export default function TaskBreakdown({ tasks }) {
  const rows = [
    { key: 'not_started', label: 'Non commencées', count: tasks.not_started, className: 'bg-muted' },
    { key: 'in_progress', label: 'En cours', count: tasks.in_progress, className: 'bg-brand-500' },
    { key: 'done', label: 'Terminées', count: tasks.done, className: 'bg-green-500' },
  ]

  return (
    <div className="flex flex-col gap-5">
      {rows.map(({ key, label, count, className }) => {
        const percent = tasks.total === 0 ? 0 : Math.round((count / tasks.total) * 100)

        return (
          <div key={key}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-medium text-ink">{label}</span>
              <span className="text-ink">
                {count} · {percent}%
              </span>
            </div>
            <ProgressBar value={percent} className={className} />
          </div>
        )
      })}
    </div>
  )
}