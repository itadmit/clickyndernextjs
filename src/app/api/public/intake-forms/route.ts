/**
 * Public Intake Forms API
 * GET /api/public/intake-forms?businessId=X&serviceId=Y
 * Returns active forms for a specific service (or global forms)
 * No authentication required - used by public booking page
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');
    const serviceId = searchParams.get('serviceId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    // Find forms that are:
    // 1. Active
    // 2. Either global (apply to all services) OR linked to the specific service
    const forms = await prisma.intakeForm.findMany({
      where: {
        businessId,
        isActive: true,
        OR: [
          { isGlobal: true },
          ...(serviceId
            ? [
                {
                  services: {
                    some: { serviceId },
                  },
                },
              ]
            : []),
        ],
      },
      include: {
        fields: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching public intake forms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


