'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

const tabs = ['Spend', 'Buy'] as const

export function AmountWidget() {
  const [tab, setTab] = useState<(typeof tabs)[number]>('Spend')
  const [amount, setAmount] = useState('')

  return (
    <div className="w-full max-w-[420px] overflow-hidden rounded-xl bg-white shadow-lg">
      <div role="tablist" aria-label="Payment direction" className="grid grid-cols-2">
        {tabs.map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'py-3 text-sm transition-colors',
              tab === t ? 'text-charcoal bg-white font-medium' : 'text-charcoal/70 bg-mint'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 border-t border-black/5 px-4 py-3">
        <span className="text-charcoal text-lg">₦</span>
        <label htmlFor="amount" className="sr-only">
          Amount in naira
        </label>
        <input
          id="amount"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-charcoal placeholder:text-charcoal/40 min-w-0 flex-1 bg-transparent text-lg outline-none"
        />

        <span className="bg-mint text-charcoal flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm">
          <span aria-hidden="true">🇳🇬</span>
          NGN
        </span>

        <button
          type="button"
          aria-label={`Continue to ${tab.toLowerCase()}`}
          className="bg-brand-deep flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
