import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    error: 'Appointment requests have been replaced by session-scoped patient, opening, booking and management tools. No request was submitted.',
  }, { status: 410 });
}
