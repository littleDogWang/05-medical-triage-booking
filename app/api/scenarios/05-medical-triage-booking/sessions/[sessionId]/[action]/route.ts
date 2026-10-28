import { NextResponse } from 'next/server';
import { ClinicError, runClinicTool } from '@/lib/medical-triage-booking/clinic';

export const runtime = 'nodejs';

export async function POST(request: Request, context: {
  params: Promise<{ sessionId: string; action: string }>;
}) {
  try {
    const { sessionId, action } = await context.params;
    let body: unknown;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'A JSON object is required' }, { status: 400 });
    }
    return NextResponse.json(runClinicTool(sessionId, action, body as Record<string, unknown>), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof ClinicError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Clinic tool failed:', error);
    return NextResponse.json({ error: 'Clinic operation failed. No success can be confirmed.' }, { status: 500 });
  }
}
