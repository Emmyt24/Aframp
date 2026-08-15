import { cn } from '@/lib/utils'

/**
 * The Aframp mark — an "A" whose crossbar runs on as an arrow, the
 * "flow of value" idea from the brand sheet.
 *
 * Traced from the design PNGs. Swap for the official SVG when the brand
 * kit ships one; this is an approximation and loses detail below ~24px.
 */
export function AframpMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'bg-brand flex size-9 shrink-0 items-center justify-center rounded-[24%]',
        className
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-[70%]"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 20.5 12 4l4 9.4" />
        <path d="M9 14.6h8.6" />
        <path d="M15.2 11.9l2.8 2.7-2.8 2.7" />
      </svg>
    </span>
  )
}

export function AframpWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <AframpMark />
      <span className="text-xl font-bold tracking-tight text-white">Aframp</span>
    </span>
  )
}
