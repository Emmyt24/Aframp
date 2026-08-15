import { trend } from '@/lib/wallet-data'

const W = 300
const H = 140
/** Which point carries the marker dot. */
const MARKER = 4

function points(series: number[]) {
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  // Inset vertically so the line never clips against the card edge.
  return series.map((v, i) => ({
    x: (i / (series.length - 1)) * W,
    y: H - 12 - ((v - min) / span) * (H - 28),
  }))
}

export function BalanceTrend() {
  const pts = points(trend)
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ')
  const area = `${line} L${W} ${H} L0 ${H} Z`
  const marker = pts[MARKER]

  return (
    <div className="relative h-[140px] w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        role="img"
        aria-label="Balance trend over the last 7 days"
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#33cc33" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#33cc33" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#trend-fill)" />
        <path
          d={line}
          fill="none"
          stroke="#4ade80"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-4 ring-white/10"
        style={{ left: `${(marker.x / W) * 100}%`, top: `${(marker.y / H) * 100}%` }}
      />
    </div>
  )
}
