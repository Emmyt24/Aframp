import { ArrowDown, ArrowLeftRight, ArrowUpRight, Banknote, CreditCard, Zap } from 'lucide-react'

// Tints read off the design rather than mapped to theme tokens — each
// action is colour-coded so the row stays scannable at a glance.
const actions = [
  { label: 'Swap', icon: ArrowLeftRight, tint: '#1e40af' },
  { label: 'Send', icon: ArrowUpRight, tint: '#166534' },
  { label: 'Receive', icon: ArrowDown, tint: '#b1cd00' },
  { label: 'Instant', icon: Zap, tint: '#854d0e' },
  { label: 'Card', icon: CreditCard, tint: '#b12a2a' },
  { label: 'Cash out', icon: Banknote, tint: '#10b981' },
]

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map(({ label, icon: Icon, tint }) => (
        <button
          key={label}
          type="button"
          title={label}
          aria-label={label}
          style={{ backgroundColor: tint }}
          className="flex size-11 items-center justify-center rounded-full text-white transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
        >
          <Icon className="size-5" strokeWidth={2.25} />
        </button>
      ))}
    </div>
  )
}
