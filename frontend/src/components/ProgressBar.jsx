// A horizontal bar. The color is passed in, so it can change by context.
export default function ProgressBar({ value, className = 'bg-brand-500' }) {
  // Keeps the width between 0 and 100, even if the backend sends something odd
  const safeValue = Math.min(100, Math.max(0, value))

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
      <div
        className={`h-full rounded-full transition-all duration-500 ${className}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  )
}