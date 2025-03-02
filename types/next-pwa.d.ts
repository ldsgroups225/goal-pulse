// types/next-pwa.d.ts
declare module 'next-pwa' {
  import type { NextConfig } from 'next'

  interface PWAConfig {
    dest?: string
    disable?: boolean
    register?: boolean
    skipWaiting?: boolean
    scope?: string
    sw?: string
    runtimeCaching?: any[]
    publicExcludes?: string[]
    buildExcludes?: string[] | (() => string[])
    fallbacks?: {
      [key: string]: string
    }
    cacheOnFrontEndNav?: boolean
    dynamicStartUrl?: boolean
    dynamicStartUrlRedirect?: string
    reloadOnOnline?: boolean
    subdomainPrefix?: string
    workboxOptions?: any
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig
  export default withPWA
}
