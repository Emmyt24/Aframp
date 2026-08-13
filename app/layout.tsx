import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

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
    <html lang="en" suppressHydrationWarning>
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
