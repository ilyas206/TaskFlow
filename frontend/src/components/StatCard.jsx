// One number with an icon. danger=true highlights warnings such as overdue tasks.
export default function StatCard({ label, value, icon: Icon, danger = false }) {
  return (
    <div className="rounded-3xl bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            danger ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'
          }`}
        >
          <Icon size={20} />
        </div>
      </div>
      <p className={`mt-4 text-3xl font-bold ${danger ? 'text-red-600' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}