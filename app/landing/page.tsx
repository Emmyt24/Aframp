import { Faq } from '@/components/landing-light/faq'
import { FinalCta } from '@/components/landing-light/final-cta'
import { Hero } from '@/components/landing-light/hero'
import { HowItWorks } from '@/components/landing-light/how-it-works'
import { SiteFooter } from '@/components/landing-light/site-footer'
import { UseCases } from '@/components/landing-light/use-cases'
import { WhyUs } from '@/components/landing-light/why-us'

export const metadata = {
  title: "Aframp — Africa's gateway to global decentralized finance",
  description:
    'Fast, secure, and effortless for everyday spending. Send money to anyone in Africa instantly.',
}

export default function LandingPage() {
  // The design is light-only, so this tree opts out of the app's dark
  // theme rather than inheriting it.
  return (
    <div className="font-brand bg-white">
      <Hero />
      <main>
        <UseCases />
        <HowItWorks />
        <Faq />
        <WhyUs />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  )
}
