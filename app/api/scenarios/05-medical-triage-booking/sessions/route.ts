import { NextResponse } from 'next/server';
import { createClinicSession } from '@/lib/medical-triage-booking/clinic';

export const runtime = 'nodejs';

// Creates only fictional, call-isolated records; never a real clinic account.
export async function POST() {
  return NextResponse.json(createClinicSession(), {
    status: 201,
    headers: { 'Cache-Control': 'no-store' },
  });
}
