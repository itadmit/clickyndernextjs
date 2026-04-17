import { NextRequest, NextResponse } from 'next/server';

/**
 * Route handler for /wp-admin/admin.php
 * Redirects to dashboard (handles WebView redirects from iOS app)
 * Next.js will map /wp-admin/admin to this route
 */
export async function GET(request: NextRequest) {
  // Redirect to dashboard - NextAuth will handle authentication
  const dashboardUrl = new URL('/dashboard', request.url);
  return NextResponse.redirect(dashboardUrl, 302);
}

export async function POST(request: NextRequest) {
  // Also handle POST requests
  const dashboardUrl = new URL('/dashboard', request.url);
  return NextResponse.redirect(dashboardUrl, 302);
}

