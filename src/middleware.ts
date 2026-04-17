import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle /wp-admin/admin.php redirect to dashboard (for WebView from iOS app)
  // Next.js doesn't handle .php files well, so we catch it in middleware
  if (pathname.startsWith('/wp-admin/admin')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    // Preserve query parameters (like ?page=Clickynder&ref=ios)
    return NextResponse.redirect(url, 302);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/wp-admin/:path*', // Match any path under /wp-admin
  ],
};

