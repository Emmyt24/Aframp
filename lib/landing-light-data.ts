/**
 * Copy for the light landing page, transcribed from
 * designs/1920w light(1).png.
 *
 * Note on the FAQ: the design only renders the answer to the first
 * question — the rest are collapsed. The remaining answers below were
 * written from the surrounding page copy and should be reviewed before
 * this page ships.
 */

export const nav = [
  { label: 'About', href: '#use-cases' },
  { label: 'Services', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
  { label: 'FAQs', href: '#faq' },
]

export const hero = {
  titleBefore: "Africa's gateway to",
  titleHighlight: 'global decentralized',
  titleAfter: 'finance',
  blurb:
    'Fast, secure, and effortless for everyday spending. Send money to anyone in Africa instantly.',
  amountLabel: 'Enter Payment Amount',
}

export type UseCase = {
  icon: string
  title: string
  blurb: string
  tint: string
}

export const useCases: UseCase[] = [
  {
    icon: '💎',
    title: 'Spend Without Selling',
    blurb: 'Use your Bitcoin when you need cash without liquidating your stack',
    tint: 'text-accent-purple',
  },
  {
    icon: '⚡',
    title: 'Instant Bank Transfers',
    blurb: "Confirm the Bitcoin send; recipient's bank is notified in seconds.",
    tint: 'text-brand',
  },
  {
    icon: '🎯',
    title: 'No Hidden Fees',
    blurb: 'What you send is what they receive. We show the exact rate up front.',
    tint: 'text-accent-pink',
  },
  {
    icon: '🌍',
    title: 'Borderless & Simple',
    blurb: 'Pay anyone across supported African countries — no accounts, no friction.',
    tint: 'text-accent-teal',
  },
]

export const steps = [
  {
    title: 'Enter Amount & Recipient/Your Wallet',
    blurb:
      "Select payout currency and enter recipient bank/mobile money details or your Bitcoin wallet—depending on if you're buying or sending.",
  },
  {
    title: 'Review Live Rate & Details',
    blurb: "We show the exact rate and calculate what you'll send.",
  },
  {
    title: 'Send or Receive Bitcoin',
    blurb:
      'Buying? Paste or generate a Lightning invoice. Spending? Send Bitcoin to Aframp. All flows supported.',
  },
  {
    title: 'Instant Payout or Delivery',
    blurb:
      "Get instant payout to a recipient's bank/mobile money or have Bitcoin land in your wallet. Most settle in seconds!",
  },
]

export const faqs = [
  {
    q: 'How do I buy and save in Bitcoin, or send money to someone in Africa with Aframp?',
    a: 'Just choose how much you want, follow a few prompts, and your Bitcoin or payout is delivered instantly. Aframp lets you buy and save in Bitcoin—and send money across Africa (currently Nigeria; Ghana, Kenya, & Benin coming soon) without hassle.',
  },
  {
    q: 'What are the requirements? Is an account or identity verification needed?',
    a: 'You can start with just a phone number. Larger transfers may require identity verification to meet local regulations.',
  },
  {
    q: 'Are there minimums, maximums, or other limits?',
    a: 'Transfers start from a small minimum so you can try the service, with upper limits that scale as your account is verified.',
  },
  {
    q: 'How fast are transactions processed?',
    a: 'Most settle in seconds. Bank and mobile money payouts depend on the receiving institution, but are typically near-instant.',
  },
  {
    q: 'What wallets can I use with Aframp?',
    a: 'Any Bitcoin wallet that supports Lightning invoices or on-chain sends. You keep custody of your own funds.',
  },
  {
    q: 'Are there any hidden fees?',
    a: 'No. What you send is what they receive, and the exact rate is shown before you confirm.',
  },
  {
    q: 'Which countries are supported?',
    a: 'Nigeria today, with Ghana, Kenya and Benin coming soon.',
  },
  {
    q: 'Can I really spend without selling all my Bitcoin?',
    a: 'Yes. Spend only what you need for a given payment and keep the rest of your stack intact.',
  },
  {
    q: 'Is Aframp custodial?',
    a: 'No. Aframp is non-custodial — your Bitcoin stays in your wallet until you send it.',
  },
  {
    q: 'What happens if a payout fails? What support is available?',
    a: 'Failed payouts are returned to you automatically, and support is reachable by email at any point in the process.',
  },
]

export const whyUs = [
  {
    title: 'High remittance fees that drain income.',
    blurb:
      'Traditional money transfers often come with high fees that reduce the amount families receive. Aframp provides a low-cost alternative using Bitcoin, keeping more money in the hands of your loved ones.',
  },
  {
    title: 'Unstable exchange rates and fast devaluation',
    blurb:
      'In many regions, local currencies lose value quickly. Aframp helps users hold and convert Bitcoin into spendable value, providing protection from currency devaluation.',
  },
  {
    title: 'Limited access to reliable cross-border payments',
    blurb:
      "Banking systems aren't always accessible or efficient for international transactions. Aframp bridges the gap with seamless cross-border Bitcoin transfers that are reliable and secure.",
  },
  {
    title: 'Delays or friction when receiving funds from abroad',
    blurb:
      'Waiting days to receive money can disrupt everyday life. Aframp enables near-instant Bitcoin-based payments, giving recipients faster access to their funds.',
  },
]

export const footer = {
  tagline: 'Spend Bitcoin. Keep Your Bitcoin.',
  links: ['Blog', 'Terms', 'Privacy'],
  support: 'getAframp@gmail.com',
  business: 'partners@Aframp.com',
  copyright: '© 2026 Aframp. All rights reserved.',
}
