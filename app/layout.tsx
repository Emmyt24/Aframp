import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { Atkinson_Hyperlegible } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

// The Aframp brand typeface — picked for legibility at small sizes,
// which is what the balance and rate figures need.
const atkinson = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-atkinson',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Aframp Pay — Accept Stellar payments',
  description:
    'Merchant point-of-sale for Stellar-settled payments. Enter an amount, show the code, get paid.',
  keywords: ['Aframp', 'merchant', 'POS', 'Stellar', 'cNGN', 'Nigeria', 'payments'],
  generator: 'Next.js',
}

export const viewport: Viewport = {
  themeColor: '#10b981',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={atkinson.variable} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
