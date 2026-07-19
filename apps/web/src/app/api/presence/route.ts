import { NextRequest, NextResponse } from 'next/server';
import { registerPresence, heartbeat, unregisterPresence, getReceiverBySession, getReceiverByCode, getNearbyByLocation, cleanupExpired } from '@/lib/store';
import { z } from 'zod';

const heartbeatSchema = z.object({
  deviceId: z.string().min(1),
  displayName: z.string().min(1).max(64),
  publicKey: z.string().min(1),
  sessionId: z.string().min(1),
  protocolVersion: z.string(),
  capabilities: z.array(z.string()),
  os: z.string(),
  deviceType: z.enum(['desktop', 'laptop', 'phone', 'tablet', 'unknown']),
  visibility: z.enum(['hidden', 'qr-only', 'nearby', 'nearby-5min']),
  pairingCode: z.string().optional().default(''),
  city: z.string().optional().default(''),
  region: z.string().optional().default(''),
  country: z.string().optional().default(''),
  countryCode: z.string().optional().default(''),
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
