import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle offline pages or network resilience
  const userAgent = request.headers.get('user-agent') || ''
  const url = request.nextUrl.clone()

  // If the PWA is installed, check network status
  // This is a simple implementation, a more complex approach would use
  // service workers to handle offline content
  if (url.pathname.startsWith('/api/') && userAgent.includes('Mobile')) {
    try {
      return NextResponse.next()
    }
    catch (error) {
      console.error(error)

      // If API fails, we could return a cached version or an error page
      url.pathname = '/offline'
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}
