import { Features } from '@/components/landing/features'
import { FinalCta } from '@/components/landing/final-cta'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Networks } from '@/components/landing/networks'
import { Partners } from '@/components/landing/partners'
import { Pricing } from '@/components/landing/pricing'
import { SiteFooter } from '@/components/landing/site-footer'
import { SiteNav } from '@/components/landing/site-nav'

export default function Home() {
  return (
    <div className="bg-panel font-brand min-h-dvh text-white">
      <SiteNav />

      {/* Warm green wash behind the hero, as in the design. */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(51,204,51,0.10),transparent_70%)]"
        />
        <div className="relative">
          <Hero />
        </div>
      </div>

      <main>
        <Partners />
        <Networks />
        <Features />
        <HowItWorks />
        <Pricing />
        <FinalCta />
      </main>

      <SiteFooter />
    </div>
  )
}
