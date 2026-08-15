import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useCases } from '@/lib/landing-light-data'

export function UseCases() {
  return (
    <section id="use-cases" className="bg-white px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-brand-deep text-center text-3xl font-bold tracking-tight sm:text-4xl">
          Aframp Core Use Cases
        </h2>
        <span className="bg-brand-deep mx-auto mt-3 block h-0.5 w-56" />

        <ul className="mt-16 grid gap-x-16 gap-y-12 sm:grid-cols-2">
          {useCases.map(({ icon, title, blurb, tint }) => (
            <li key={title} className="flex gap-4">
              <span aria-hidden="true" className="text-2xl leading-none">
                {icon}
              </span>
              <div>
                <h3 className={cn('text-xl font-bold', tint)}>{title}</h3>
                <p className="text-charcoal/80 mt-2 text-sm leading-relaxed">{blurb}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-16 text-center">
          <a
            href="#how-it-works"
            className="bg-brand inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Explore Aframp
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
