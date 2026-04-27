/**
 * Mobile Intake Forms API
 * GET  /api/mobile/intake-forms                     - List forms with field/submission counts
 * POST /api/mobile/intake-forms                     - Create a form (optionally with fields)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getAuthenticatedBusiness } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

const FIELD_TYPES = ['text', 'textarea', 'select', 'radio', 'checkbox', 'yes_no', 'number', 'date'] as const;

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const forms = await prisma.intakeForm.findMany({
    where: { businessId: business.id },
    include: {
      services: { include: { service: { select: { id: true, name: true } } } },
      _count: { select: { fields: true, submissions: true } },
    },
    orderBy: { position: 'asc' },
  });

  return NextResponse.json(
    forms.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      enabled: f.isActive,
      isGlobal: f.isGlobal,
      fieldsCount: f._count.fields,
      submissionsCount: f._count.submissions,
      services: f.services.map((s) => ({ id: s.service.id, name: s.service.name })),
    })),
  );
}

interface IncomingField {
  type: (typeof FIELD_TYPES)[number];
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) return NextResponse.json({ error: auth.error }, { status: 401 });
  const business = await getAuthenticatedBusiness(auth.userId!);
  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 });

  const body = await req.json();
  const {
    name,
    description = null,
    isGlobal = true,
    fields = [],
    serviceIds = [],
  }: {
    name: string;
    description?: string | null;
    isGlobal?: boolean;
    fields?: IncomingField[];
    serviceIds?: string[];
  } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  for (const f of fields) {
    if (!FIELD_TYPES.includes(f.type)) {
      return NextResponse.json({ error: `invalid field type: ${f.type}` }, { status: 400 });
    }
    if (!f.label || !f.label.trim()) {
      return NextResponse.json({ error: 'every field must have a label' }, { status: 400 });
    }
  }

  const form = await prisma.$transaction(async (tx) => {
    const created = await tx.intakeForm.create({
      data: {
        businessId: business.id,
        name: name.trim(),
        description: description?.trim() || null,
        isGlobal,
        fields: {
          create: fields.map((f, i) => ({
            type: f.type,
            label: f.label.trim(),
            description: f.description?.trim() || null,
            placeholder: f.placeholder?.trim() || null,
            required: f.required ?? false,
            position: i,
            optionsJson: f.options && f.options.length > 0 ? f.options : undefined,
          })),
        },
      },
    });

    if (!isGlobal && Array.isArray(serviceIds) && serviceIds.length > 0) {
      const services = await tx.service.findMany({
        where: { id: { in: serviceIds }, businessId: business.id },
        select: { id: true },
      });
      await tx.serviceIntakeForm.createMany({
        data: services.map((s) => ({ formId: created.id, serviceId: s.id })),
      });
    }

    return created;
  });

  return NextResponse.json({ form }, { status: 201 });
}
