/**
 * Intake Form Detail API
 * GET /api/intake-forms/[id] - Get a specific form with fields
 * PUT /api/intake-forms/[id] - Update form (name, fields, services)
 * DELETE /api/intake-forms/[id] - Delete form
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyBusinessOwnership } from '@/lib/verify-business';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const form = await prisma.intakeForm.findUnique({
      where: { id: params.id },
      include: {
        fields: { orderBy: { position: 'asc' } },
        services: {
          include: {
            service: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const owned = await verifyBusinessOwnership(session.user.id, form.businessId);
    if (!owned) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching intake form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingForm = await prisma.intakeForm.findUnique({
      where: { id: params.id },
      select: { businessId: true },
    });

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const ownedPut = await verifyBusinessOwnership(session.user.id, existingForm.businessId);
    if (!ownedPut) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, isActive, isGlobal, fields, serviceIds } = body;

    const form = await prisma.$transaction(async (tx) => {
      // Update form metadata
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isGlobal !== undefined) updateData.isGlobal = isGlobal;

      await tx.intakeForm.update({
        where: { id: params.id },
        data: updateData,
      });

      // Update fields if provided - delete all and recreate
      if (fields !== undefined) {
        await tx.intakeFormField.deleteMany({
          where: { formId: params.id },
        });

        if (fields.length > 0) {
          await tx.intakeFormField.createMany({
            data: fields.map((field: any, index: number) => ({
              formId: params.id,
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
      }

      // Update service links if provided
      if (serviceIds !== undefined) {
        await tx.serviceIntakeForm.deleteMany({
          where: { formId: params.id },
        });

        if (serviceIds.length > 0) {
          await tx.serviceIntakeForm.createMany({
            data: serviceIds.map((serviceId: string) => ({
              serviceId,
              formId: params.id,
            })),
          });
        }
      }

      return tx.intakeForm.findUnique({
        where: { id: params.id },
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

    return NextResponse.json(form);
  } catch (error) {
    console.error('Error updating intake form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formToDelete = await prisma.intakeForm.findUnique({
      where: { id: params.id },
      select: { businessId: true },
    });

    if (!formToDelete) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const ownedDelete = await verifyBusinessOwnership(session.user.id, formToDelete.businessId);
    if (!ownedDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.intakeForm.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting intake form:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


