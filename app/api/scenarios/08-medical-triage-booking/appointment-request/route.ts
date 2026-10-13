import { NextResponse } from 'next/server';
import {
  buildAppointmentRequest,
  triageIntent,
} from '@/scenarios/08-medical-triage-booking/triage';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      request_id?: unknown;
      description?: unknown;
      details?: unknown;
    };
    if (
      typeof body.request_id !== 'string' ||
      typeof body.description !== 'string' ||
      typeof body.details !== 'object' ||
      body.details === null ||
      Array.isArray(body.details)
    ) {
      return NextResponse.json(
        { error: 'request_id, description, and details are required' },
        { status: 400 },
      );
    }
    if (triageIntent(body.description) === 'emergency_escalation') {
      return NextResponse.json(
        {
          outcome: 'emergency_escalation',
          message: 'Contact local emergency services or an urgent medical professional now.',
          booking_confirmed: false,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      buildAppointmentRequest(body.request_id, body.details as Record<string, string>),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'invalid request' },
      { status: 400 },
    );
  }
}
