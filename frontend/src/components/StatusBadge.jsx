import { projectStatusLabels } from '../lib/labels'

const styles = {
  planned: 'bg-surface text-muted',
  active: 'bg-brand-50 text-brand-600',
  completed: 'bg-green-50 text-green-600',
  archived: 'bg-surface text-ink',
}

// A small colored label for the project status
export default function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] ?? styles.planned}`}>
      {projectStatusLabels[status] ?? status}
    </span>
  )
}