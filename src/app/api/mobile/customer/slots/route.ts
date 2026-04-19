import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/mobile-auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get('businessId');
  const serviceId = searchParams.get('serviceId');
  const date = searchParams.get('date');
  const staffId = searchParams.get('staffId');
  const branchId = searchParams.get('branchId');

  if (!businessId || !serviceId || !date) {
    return NextResponse.json({ error: 'businessId, serviceId, date נדרשים' }, { status: 400 });
  }

  try {
    // Proxy to the existing public slots API
    const params = new URLSearchParams({ businessId, serviceId, date });
    if (staffId) params.set('staffId', staffId);
    if (branchId) params.set('branchId', branchId);

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.clickynder.com';
    const response = await fetch(`${baseUrl}/api/appointments/slots?${params}`);
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get customer slots error:', error);
    return NextResponse.json({ error: 'שגיאה בטעינת זמנים' }, { status: 500 });
  }
}
