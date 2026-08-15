import { activity } from '@/lib/wallet-data'

export function ActivityHighlights() {
  return (
    <section className="bg-panel border-hairline rounded-2xl border p-5">
      <p className="text-dim text-xs">Today</p>
      <h2 className="text-lg font-bold tracking-tight text-white">Activity highlights</h2>

      <dl className="mt-4 space-y-3.5">
        {activity.map(({ label, value }) => (
          <div key={label} className="flex items-baseline justify-between">
            <dt className="text-dim text-sm">{label}</dt>
            <dd className="text-bright text-sm">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
