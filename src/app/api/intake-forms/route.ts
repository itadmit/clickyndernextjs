/**
 * Intake Forms API Routes
 * GET /api/intake-forms - Get all forms for a business
 * POST /api/intake-forms - Create a new form
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyBusinessOwnership } from '@/lib/verify-business';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const owned = await verifyBusinessOwnership(session.user.id, businessId);
    if (!owned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const forms = await prisma.intakeForm.findMany({
      where: { businessId },
      include: {
        fields: {
          orderBy: { position: 'asc' },
        },
        services: {
          include: {
            service: {
              select: { id: true, name: true },
            },
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json(forms);
  } catch (error) {
    console.error('Error fetching intake forms:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { businessId, name, description, isGlobal, fields, serviceIds } = body;

    if (!businessId || !name) {
      return NextResponse.json(
        { error: 'businessId and name are required' },
        { status: 400 }
      );
    }

    // Create form with fields in a transaction
    const form = await prisma.$transaction(async (tx) => {
      // Create the form
      const newForm = await tx.intakeForm.create({
        data: {
          businessId,
          name,
          description: description || null,
          isGlobal: isGlobal || false,
        },
      });

      // Create fields
      if (fields && fields.length > 0) {
        await tx.intakeFormField.createMany({
          data: fields.map((field: any, index: number) => ({
            formId: newForm.id,
            type: field.type,
            label: field.label,
            description: field.description || null,
            placeholder: field.placeholder || null,
            required: field.required || false,
            position: index,
            optionsJson: field.options ? field.options : null,
            fileUrl: field.fileUrl || null,
            validationJson: field.validation || null,
          })),
        });
      }

      // Link to services (if not global)
      if (!isGlobal && serviceIds && serviceIds.length > 0) {
        await tx.serviceIntakeForm.createMany({
          data: serviceIds.map((serviceId: string) => ({
            serviceId,
            formId: newForm.id,
          })),
        });
      }

      // Return the form with all relations
      return tx.intakeForm.findUnique({
        where: { id: newForm.id },
        include: {
          fields: { orderBy: { position: 'asc' } },
          services: {
            include: {
              service: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    return NextResponse.json(form, { status: 201 });
  } catch (error) {
    console.error('Error creating intake form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


