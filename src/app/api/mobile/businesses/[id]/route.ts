/**
 * Mobile Business Detail API
 * GET   /api/mobile/businesses/:id - Get business details
 * PATCH /api/mobile/businesses/:id - Update business details
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business || business.id !== params.id) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const full = await prisma.business.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        logoUrl: true,
        primaryColor: true,
        templateStyle: true,
        currency: true,
        font: true,
        secondaryColor: true,
        backgroundColorStart: true,
        backgroundColorEnd: true,
        showBranches: true,
        showStaff: true,
        reminderEnabled: true,
        reminderHoursBefore: true,
        confirmationEnabled: true,
        confirmationHoursBefore: true,
        facebookUrl: true,
        instagramUrl: true,
        whatsappNumber: true,
      },
    });

    return NextResponse.json(full);
  } catch (error) {
    console.error('Error fetching mobile business:', error);
    return NextResponse.json({ error: 'Failed to fetch business' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const business = await getAuthenticatedBusiness(auth.userId!);
    if (!business || business.id !== params.id) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();

    const allowedFields = [
      'name', 'slug', 'description', 'address', 'phone', 'email',
      'primaryColor', 'currency', 'showBranches', 'showStaff',
      'reminderEnabled', 'reminderHoursBefore',
      'confirmationEnabled', 'confirmationHoursBefore',
      'facebookUrl', 'instagramUrl', 'whatsappNumber',
      'logoUrl', 'templateStyle', 'font', 'secondaryColor', 'backgroundColorStart', 'backgroundColorEnd',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    if (updateData.slug && updateData.slug !== business.slug) {
      const slugTaken = await prisma.business.findFirst({
        where: { slug: updateData.slug, id: { not: params.id } },
      });
      if (slugTaken) {
        return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
      }
    }

    const updated = await prisma.business.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      address: updated.address,
      phone: updated.phone,
      email: updated.email,
      logoUrl: updated.logoUrl,
      primaryColor: updated.primaryColor,
      templateStyle: updated.templateStyle,
      currency: updated.currency,
      font: updated.font,
      secondaryColor: updated.secondaryColor,
      backgroundColorStart: updated.backgroundColorStart,
      backgroundColorEnd: updated.backgroundColorEnd,
      showBranches: updated.showBranches,
      showStaff: updated.showStaff,
    });
  } catch (error) {
    console.error('Error updating mobile business:', error);
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}
