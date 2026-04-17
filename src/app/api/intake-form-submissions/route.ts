/**
 * Intake Form Submissions API
 * POST /api/intake-form-submissions - Submit form answers (public, no auth)
 * GET /api/intake-form-submissions - Get submissions (auth required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyBusinessOwnership } from '@/lib/verify-business';

// Public - submit form answers during booking
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { formId, appointmentId, answers, signatureData, consentGiven } = body;

    if (!formId || !answers) {
      return NextResponse.json(
        { error: 'formId and answers are required' },
        { status: 400 }
      );
    }

    // Validate that form exists and is active
    const form = await prisma.intakeForm.findUnique({
      where: { id: formId },
      include: {
        fields: {
          where: { required: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!form || !form.isActive) {
      return NextResponse.json({ error: 'Form not found or inactive' }, { status: 404 });
    }

    // Validate required fields are answered
    const answersObj = answers as Record<string, any>;
    for (const field of form.fields) {
      const answer = answersObj[field.id];
      if (field.required && (answer === undefined || answer === null || answer === '')) {
        return NextResponse.json(
          { error: `השדה "${field.label}" הוא שדה חובה` },
          { status: 400 }
        );
      }
    }

    const submission = await prisma.intakeFormSubmission.create({
      data: {
        formId,
        appointmentId: appointmentId || null,
        answersJson: answers,
        signatureData: signatureData || null,
        consentGiven: consentGiven || false,
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error creating intake form submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Auth required - get submissions for a business
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('formId');
    const appointmentId = searchParams.get('appointmentId');

    if (formId) {
      const form = await prisma.intakeForm.findUnique({
        where: { id: formId },
        select: { businessId: true },
      });
      if (!form) {
        return NextResponse.json({ error: 'Form not found' }, { status: 404 });
      }
      const ownedForm = await verifyBusinessOwnership(session.user.id, form.businessId);
      if (!ownedForm) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { businessId: true },
      });
      if (!appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }
      const ownedAppt = await verifyBusinessOwnership(session.user.id, appointment.businessId);
      if (!ownedAppt) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where: any = {};
    if (formId) where.formId = formId;
    if (appointmentId) where.appointmentId = appointmentId;

    const submissions = await prisma.intakeFormSubmission.findMany({
      where,
      include: {
        form: {
          select: {
            id: true,
            name: true,
            fields: {
              orderBy: { position: 'asc' },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


