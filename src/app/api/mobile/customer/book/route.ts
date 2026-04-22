import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/mobile-auth';

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { businessId, serviceId, staffId, branchId, date, time, groupSessionId, notes, customerOverride } = body;

    if (!businessId || !serviceId) {
      return NextResponse.json({ error: 'businessId, serviceId נדרשים' }, { status: 400 });
    }

    // Get customer record for this user + business
    const customer = await prisma.customer.findFirst({
      where: { userId: auth.userId, businessId },
    });

    if (!customer) {
      return NextResponse.json({ error: 'לא רשום כלקוח של עסק זה' }, { status: 403 });
    }

    // One-time override: appended as a note; the appointment stays linked to the
    // authenticated user's customer record — we do NOT update stored details.
    const overrideParts: string[] = [];
    if (customerOverride) {
      const fullName = `${(customerOverride.firstName || '').trim()} ${(customerOverride.lastName || '').trim()}`.trim();
      const original = `${customer.firstName} ${customer.lastName}`.trim();
      if (fullName && fullName !== original) overrideParts.push(`שם: ${fullName}`);
      const phone = (customerOverride.phone || '').trim();
      if (phone && phone !== (customer.phone || '')) overrideParts.push(`טלפון: ${phone}`);
      const email = (customerOverride.email || '').trim();
      if (email && email !== (customer.email || '')) overrideParts.push(`אימייל: ${email}`);
    }
    const overrideNote = overrideParts.length
      ? `פרטים חד־פעמיים לתור זה: ${overrideParts.join(', ')}`
      : '';
    const combinedNotes = [notes, overrideNote].filter(Boolean).join(' | ') || undefined;

    const bookPayload: Record<string, any> = {
      businessId,
      serviceId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerPhone: customer.phone,
      customerEmail: customer.email || undefined,
      notes: combinedNotes,
      source: 'public',
    };

    if (groupSessionId) {
      bookPayload.groupSessionId = groupSessionId;
    } else {
      if (!date || !time) {
        return NextResponse.json({ error: 'date, time נדרשים' }, { status: 400 });
      }
      bookPayload.date = date;
      bookPayload.time = time;
      if (staffId) bookPayload.staffId = staffId;
      if (branchId) bookPayload.branchId = branchId;
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.clickynder.com';
    const response = await fetch(`${baseUrl}/api/appointments/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Customer book error:', error);
    return NextResponse.json({ error: 'שגיאה בקביעת תור' }, { status: 500 });
  }
}
