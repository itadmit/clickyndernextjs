import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

/**
 * Route handler for /wp-admin/admin.php
 * Redirects to dashboard (handles WebView redirects)
 */
export async function GET(request: NextRequest) {
  // Redirect to dashboard - NextAuth will handle authentication
  return NextResponse.redirect(new URL('/dashboard', request.url));
}

export async function POST(request: NextRequest) {
  // Also handle POST requests
  return NextResponse.redirect(new URL('/dashboard', request.url));
}

