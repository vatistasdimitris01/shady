import { NextRequest, NextResponse } from 'next/server';
import { pushSignal, pollSignals, clearSignals } from '@/lib/store';
import { z } from 'zod';

const signalSchema = z.object({
  sessionId: z.string().min(1),
  from: z.string().min(1),
  type: z.enum(['offer', 'answer', 'ice-candidate', 'pair-request', 'pair-approve', 'pair-reject', 'cancel']),
  payload: z.unknown(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signalSchema.parse(body);
    const msg = pushSignal(parsed);
    return NextResponse.json({ ok: true, id: msg.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid payload', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: 'sessionId required' }, { status: 400 });
  }
  const since = req.nextUrl.searchParams.get('since');
  const sinceNum = since ? parseInt(since, 10) : undefined;
  const messages = pollSignals(sessionId, sinceNum);
  return NextResponse.json({ ok: true, messages });
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return NextResponse.json({ ok: false, error: 'sessionId required' }, { status: 400 });
  }
  clearSignals(sessionId);
  return NextResponse.json({ ok: true });
}
