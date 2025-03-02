import type { NextConfig } from 'next'

const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.betmines.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Config for hosting SVGs inline
  webpack(config) {
    // Add SVG support
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
}

export default withPWA(nextConfig)
