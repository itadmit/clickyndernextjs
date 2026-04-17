import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ available: false, error: 'slug is required' }, { status: 400 });
  }

  const existing = await prisma.business.findUnique({ where: { slug } });
  return NextResponse.json({ available: !existing });
}
