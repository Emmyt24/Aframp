import Link from 'next/link'
import { ArrowDown, ArrowLeftRight, ArrowUpRight, Banknote, CreditCard, Zap } from 'lucide-react'

const actions = [
  { label: 'Swap',     icon: ArrowLeftRight, tint: '#1e40af', href: '/charge'       },
  { label: 'Send',     icon: ArrowUpRight,   tint: '#166534', href: '/charge'       },
  { label: 'Receive',  icon: ArrowDown,      tint: '#b1cd00', href: '/wallet'       },
  { label: 'Instant',  icon: Zap,            tint: '#854d0e', href: '/charge'       },
  { label: 'Card',     icon: CreditCard,     tint: '#b12a2a', href: '/charge'       },
  { label: 'Cash out', icon: Banknote,       tint: '#10b981', href: '/withdraw'     },
]

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map(({ label, icon: Icon, tint, href }) => (
        <Link
          key={label}
          href={href}
          title={label}
          aria-label={label}
          style={{ backgroundColor: tint }}
          className="flex size-11 items-center justify-center rounded-full text-white transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
        >
          <Icon className="size-5" strokeWidth={2.25} />
        </Link>
      ))}
    </div>
  )
}
