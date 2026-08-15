import { Mail, Send, Twitter } from 'lucide-react'

import { AframpMark } from '@/components/brand/aframp-mark'
import { footer } from '@/lib/landing-light-data'

const socials = [
  { label: 'Telegram', icon: Send },
  { label: 'Twitter', icon: Twitter },
  { label: 'Email', icon: Mail },
]

export function SiteFooter() {
  return (
    <footer id="contact" className="bg-lavender px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <span className="flex items-center gap-2">
              <AframpMark className="size-7" />
              <span className="text-charcoal text-lg font-bold tracking-tight">Aframp</span>
            </span>
            <p className="text-charcoal/80 mt-3 text-xs">{footer.tagline}</p>

            <ul className="mt-4 flex gap-4">
              {socials.map(({ label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href="#"
                    aria-label={label}
                    className="text-charcoal/70 hover:text-brand block"
                  >
                    <Icon className="size-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-brand-deep text-sm font-bold">Links</p>
            <ul className="mt-3 space-y-2">
              {footer.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-charcoal/80 hover:text-brand text-xs underline">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-brand-deep text-sm font-bold">Contact</p>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <span className="text-charcoal/80">Support: </span>
                <a href={`mailto:${footer.support}`} className="text-charcoal underline">
                  {footer.support}
                </a>
              </li>
              <li>
                <span className="text-charcoal/80">Business: </span>
                <a href={`mailto:${footer.business}`} className="text-charcoal underline">
                  {footer.business}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <p className="text-charcoal/60 mt-12 border-t border-black/5 pt-6 text-center text-xs">
          {footer.copyright}
        </p>
      </div>
    </footer>
  )
}
