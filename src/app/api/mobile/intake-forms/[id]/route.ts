/**
 * Mobile Intake Form detail API
 * GET    /api/mobile/intake-forms/[id]   - Form with all fields + service mappings
 * PUT    /api/mobile/intake-forms/[id]   - Update form metadata + replace fields
 * DELETE /api/mobile/intake-forms/[id]   - Delete (cascades fields and links)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

const FIELD_TYPES = ['text', 'textarea', 'select', 'radio', 'checkbox', 'yes_no', 'number', 'date'] as const;

async function authBusiness(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return { error: auth.error, status: 401 } as const;
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return { error: 'Business not found', status: 404 } as const;
  return { business } as const;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const form = await prisma.intakeForm.findFirst({
    where: { id, businessId: a.business.id },
    include: {
      fields: { orderBy: { position: 'asc' } },
      services: { include: { service: { select: { id: true, name: true } } } },
    },
  });
  if (!form) return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  return NextResponse.json({
    id: form.id,
    name: form.name,
    description: form.description,
    enabled: form.isActive,
    isGlobal: form.isGlobal,
    fields: form.fields.map((f) => ({
      id: f.id,
      type: f.type,
      label: f.label,
      description: f.description,
      placeholder: f.placeholder,
      required: f.required,
      options: Array.isArray(f.optionsJson) ? (f.optionsJson as string[]) : [],
    })),
    services: form.services.map((s) => ({ id: s.service.id, name: s.service.name })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const existing = await prisma.intakeForm.findFirst({ where: { id, businessId: a.business.id } });
  if (!existing) return NextResponse.json({ error: 'Form not found' }, { status: 404 });

  const body = await req.json();
  const { name, description, isGlobal, enabled, fields, serviceIds } = body;

  // basic field validation
  if (Array.isArray(fields)) {
    for (const f of fields) {
      if (!FIELD_TYPES.includes(f.type)) {
        return NextResponse.json({ error: `invalid field type: ${f.type}` }, { status: 400 });
      }
      if (!f.label || !String(f.label).trim()) {
        return NextResponse.json({ error: 'every field must have a label' }, { status: 400 });
      }
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.intakeForm.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: String(name).trim() }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(isGlobal !== undefined && { isGlobal: !!isGlobal }),
        ...(enabled !== undefined && { isActive: !!enabled }),
      },
    });

    if (Array.isArray(fields)) {
      await tx.intakeFormField.deleteMany({ where: { formId: id } });
      await tx.intakeFormField.createMany({
        data: fields.map((f: any, i: number) => ({
          formId: id,
          type: f.type,
          label: String(f.label).trim(),
          description: f.description ? String(f.description).trim() : null,
          placeholder: f.placeholder ? String(f.placeholder).trim() : null,
          required: !!f.required,
          position: i,
          optionsJson: Array.isArray(f.options) && f.options.length > 0 ? f.options : undefined,
        })),
      });
    }

    if (Array.isArray(serviceIds)) {
      await tx.serviceIntakeForm.deleteMany({ where: { formId: id } });
      const services = await tx.service.findMany({
        where: { id: { in: serviceIds }, businessId: a.business.id },
        select: { id: true },
      });
      if (services.length > 0) {
        await tx.serviceIntakeForm.createMany({
          data: services.map((s) => ({ formId: id, serviceId: s.id })),
        });
      }
    }

    return tx.intakeForm.findUniqueOrThrow({
      where: { id },
      include: { fields: { orderBy: { position: 'asc' } } },
    });
  });

  return NextResponse.json({ form: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const a = await authBusiness(req);
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status });
  const { id } = await params;
  const existing = await prisma.intakeForm.findFirst({ where: { id, businessId: a.business.id } });
  if (!existing) return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  await prisma.intakeForm.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
