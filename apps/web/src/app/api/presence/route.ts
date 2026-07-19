import { NextRequest, NextResponse } from 'next/server';
import { registerPresence, heartbeat, unregisterPresence, getReceiverBySession, getReceiverByCode, getNearbyByLocation, cleanupExpired, isNameTaken, approveSender, isApproved, unapproveSender } from '@/lib/store';
import { z } from 'zod';

const heartbeatSchema = z.object({
  deviceId: z.string().min(1),
  displayName: z.string().min(1).max(64).optional().default(''),
  publicKey: z.string().min(1).optional().default(''),
  sessionId: z.string().min(1),
  protocolVersion: z.string().optional().default(''),
  capabilities: z.array(z.string()).optional().default([]),
  os: z.string().optional().default(''),
  deviceType: z.enum(['desktop', 'laptop', 'phone', 'tablet', 'unknown']).optional().default('unknown'),
  visibility: z.enum(['hidden', 'qr-only', 'nearby', 'nearby-5min']).optional().default('qr-only'),
  pairingCode: z.string().optional().default(''),
  city: z.string().optional().default(''),
  region: z.string().optional().default(''),
  country: z.string().optional().default(''),
  countryCode: z.string().optional().default(''),
  action: z.string().optional().default(''),
  approvedSenderId: z.string().optional().default(''),
});

function getSourceIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = heartbeatSchema.parse(body);
    const ip = getSourceIp(req);

    // Handle approval action
    if (parsed.action === 'approve' && parsed.approvedSenderId) {
      approveSender(parsed.sessionId, parsed.approvedSenderId);
      // Also set on the presence entry for GET-based check
      const entry = getReceiverBySession(parsed.sessionId);
      if (entry) (entry as any).approvedSenderId = parsed.approvedSenderId;
      return NextResponse.json({ ok: true, timestamp: Date.now() });
    }

    const patch = { city: parsed.city, region: parsed.region, country: parsed.country, countryCode: parsed.countryCode, pairingCode: parsed.pairingCode };

    if (!heartbeat(parsed.deviceId, ip, patch)) {
      registerPresence(parsed as any, ip);
    }

    return NextResponse.json({ ok: true, timestamp: Date.now() });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Invalid payload', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { deviceId } = await req.json();
    if (!deviceId) {
      return NextResponse.json({ ok: false, error: 'deviceId required' }, { status: 400 });
    }
    unregisterPresence(deviceId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  cleanupExpired();

  const taken = req.nextUrl.searchParams.get('taken');
  if (taken) {
    return NextResponse.json({ ok: true, taken: isNameTaken(taken) });
  }

  const code = req.nextUrl.searchParams.get('code');
  if (code) {
    const receiver = getReceiverByCode(code);
    if (!receiver) {
      return NextResponse.json({ ok: false, error: 'No receiver with that code' }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      sessionId: receiver.sessionId,
      receiver: {
        deviceId: receiver.deviceId,
        displayName: receiver.displayName,
        deviceType: receiver.deviceType,
        os: receiver.os,
        ready: true,
      },
    });
  }

  const city = req.nextUrl.searchParams.get('city');
  const country = req.nextUrl.searchParams.get('country');
  const countryCode = req.nextUrl.searchParams.get('countryCode');
  if (city && country && countryCode) {
    const nearby = getNearbyByLocation({ city, country, countryCode });
    return NextResponse.json({ ok: true, receivers: nearby });
  }

  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (sessionId) {
    const senderId = req.nextUrl.searchParams.get('senderId');
    if (senderId) {
      return NextResponse.json({ ok: true, approved: isApproved(sessionId, senderId) });
    }
    const receiver = getReceiverBySession(sessionId);
    if (!receiver) {
      return NextResponse.json({ ok: false, error: 'Receiver not found' }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      receiver: {
        deviceId: receiver.deviceId,
        displayName: receiver.displayName,
        deviceType: receiver.deviceType,
        os: receiver.os,
        ready: true,
      },
    });
  }

  return NextResponse.json({ ok: true, receivers: [] });
}
