import withPWAInit from 'next-pwa'
import defaultRuntimeCaching from 'next-pwa/cache.js'
import { withSentryConfig } from '@sentry/nextjs'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Limit concurrency only in resource-constrained CI environments.
    // Set CI_LOW_RESOURCES=1 in your CI pipeline to enable these caps;
    // leave it unset for normal development and production builds so they
    // use all available CPU cores.
    ...(process.env.CI_LOW_RESOURCES
      ? {
          cpus: 1,
          staticGenerationMaxConcurrency: 1,
          staticGenerationMinPagesPerWorker: 1,
        }
      : {}),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  output: 'standalone',
  async redirects() {
    return [
      // /login and signup are the same flow (phone + OTP). Redirect /login to
      // /signup so that 401-page CTAs and any external links don't dead-end on
      // a 404 (issue #272).
      {
        source: '/login',
        destination: '/signup',
        permanent: false,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /\/api\/(?:exchange-rate|rates)(?:\/)?(?:\?.*)?$/,
      handler: 'StaleWhileRevalidate',
      method: 'GET',
      options: {
        cacheName: 'exchange-rates',
        cacheableResponse: {
          statuses: [0, 200],
        },
        expiration: {
          maxEntries: 8,
          maxAgeSeconds: 24 * 60 * 60,
          purgeOnQuotaError: true,
        },
      },
    },
    ...defaultRuntimeCaching,
  ],
})

const configWithPWA = withPWA(nextConfig)

export default withSentryConfig(configWithPWA)
