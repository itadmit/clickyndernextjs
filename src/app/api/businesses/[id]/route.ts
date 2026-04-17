/**
 * Business API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get business and verify ownership
    const business = await prisma.business.findFirst({
      where: {
        id: params.id,
        ownerUserId: session.user.id,
      },
      select: {
        id: true,
        showBranches: true,
        showStaff: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  return PATCH(req, context);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify business ownership
    const existingBusiness = await prisma.business.findFirst({
      where: {
        id: params.id,
        ownerUserId: session.user.id,
      },
    });

    if (!existingBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();

    // If slug is being changed, check if it's already taken
    if (body.slug && body.slug !== existingBusiness.slug) {
      const slugExists = await prisma.business.findFirst({
        where: {
          slug: body.slug,
          id: {
            not: params.id,
          },
        },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'כתובת האתר הזאת כבר תפוסה. אנא בחר כתובת אחרת' },
          { status: 400 }
        );
      }
    }

    // Filter only allowed fields
    const allowedFields = [
      'name',
      'slug',
      'description',
      'address',
      'phone',
      'email',
      'timezone',
      'currency',
      'primaryColor',
      'secondaryColor',
      'backgroundColorStart',
      'backgroundColorEnd',
      'showBranches',
      'showStaff',
      'onlinePaymentEnabled',
      'logoUrl',
      'font',
      'templateStyle',
      'developerMode',
      'customCss',
      'customJs',
      'reminderEnabled',
      'reminderHoursBefore',
      'confirmationEnabled',
      'confirmationHoursBefore',
      'paymentProvider',
      'paymeSellerPaymeId',
      'paymeApiKey',
      'depositEnabled',
      'depositAmountCents',
      'depositPercentage',
      'requirePaymentForBooking',
      'cancellationPolicyEnabled',
      'cancellationDeadlineHours',
      'cancellationFeePercentage',
      'noShowFeePercentage',
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const business = await prisma.business.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error('Error updating business:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

