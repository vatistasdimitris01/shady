import { NextRequest, NextResponse } from 'next/server';
import { approveSender, isApproved, unapproveSender } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, senderId } = await req.json();
    if (!sessionId || !senderId) {
      return NextResponse.json({ ok: false, error: 'sessionId and senderId required' }, { status: 400 });
    }
    approveSender(sessionId, senderId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  const senderId = req.nextUrl.searchParams.get('senderId');
  if (!sessionId || !senderId) {
    return NextResponse.json({ ok: false, error: 'sessionId and senderId required' }, { status: 400 });
  }
  const approved = isApproved(sessionId, senderId);
  if (approved) unapproveSender(sessionId, senderId);
  return NextResponse.json({ ok: true, approved });
}
