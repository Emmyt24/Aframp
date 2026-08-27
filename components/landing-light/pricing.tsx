import { pricingIntro } from '@/lib/landing-light-data'

const defaultRates = [
  { method: 'Bank Transfer', fee: '0%' },
  { method: 'Card', fee: '1.5%' },
  { method: 'Mobile Money', fee: '0.5%' },
]

export function Pricing() {
  return (
    <section id="pricing" className="bg-mint dark:bg-band px-6 py-24">
      <div className="mx-auto max-w-2xl">
        <span className="bg-brand/15 text-brand-deep dark:text-brand inline-block rounded-full px-3 py-1 text-xs">
          {pricingIntro.eyebrow}
        </span>
        <h2 className="text-charcoal dark:text-white mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          {pricingIntro.title}
        </h2>
        <p className="text-charcoal/70 dark:text-white/70 mt-3 text-sm leading-relaxed">
          {pricingIntro.blurb}
        </p>

        <div className="border-black/5 dark:border-edge bg-white dark:bg-surface mt-10 overflow-hidden rounded-2xl border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-black/5 dark:border-edge border-b">
                <th className="text-charcoal/60 dark:text-dim px-5 py-3 font-medium">
                  Payment method
                </th>
                <th className="text-charcoal/60 dark:text-dim px-5 py-3 font-medium">Fee</th>
              </tr>
            </thead>
            <tbody>
              {defaultRates.map(({ method, fee }) => (
                <tr key={method} className="border-black/5 dark:border-edge border-b last:border-0">
                  <td className="text-charcoal dark:text-white px-5 py-3.5">{method}</td>
                  <td className="text-brand-deep dark:text-brand px-5 py-3.5 font-bold">{fee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
