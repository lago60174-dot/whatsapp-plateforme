import { NextRequest, NextResponse } from 'next/server'

// Protège toutes les routes /admin
// Simple protection par mot de passe via cookie de session
// Pour le MVP : tu te connectes une fois, le cookie persiste

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Laisser passer la page de login et le webhook WhatsApp
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/webhook') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // Vérifier le cookie de session pour les routes /admin
  if (pathname.startsWith('/admin') || pathname === '/') {
    const session = request.cookies.get('admin_session')
    if (!session || session.value !== process.env.ADMIN_SESSION_TOKEN) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
