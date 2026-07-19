const BASE_URL = process.env.SHADY_API_URL || 'https://shady-app.vercel.app';

export interface HeartbeatData {
  deviceId: string;
  displayName: string;
  publicKey: string;
  sessionId: string;
  protocolVersion: string;
  capabilities: string[];
  os: string;
  deviceType: string;
  visibility: string;
}

export async function sendHeartbeat(data: HeartbeatData): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    return json.ok === true;
  } catch {
    return false;
  }
}

export async function unregisterDevice(deviceId: string): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/presence`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {}
}

export async function sendSignal(sessionId: string, from: string, type: string, payload: unknown): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, from, type, payload }),
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    return json.ok ? json.id : null;
  } catch {
    return null;
  }
}

export async function pollSignals(sessionId: string, since?: number): Promise<{ id: string; type: string; payload: unknown; timestamp: number }[]> {
  try {
    const url = new URL(`${BASE_URL}/api/signal`);
    url.searchParams.set('sessionId', sessionId);
    if (since) url.searchParams.set('since', String(since));

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(5000) });
    const json = await res.json();
    return json.ok ? (json.messages || []) : [];
  } catch {
    return [];
  }
}

export async function lookupReceiver(sessionId: string): Promise<{ deviceId: string; displayName: string; deviceType: string; os: string; ready: boolean } | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/presence?sessionId=${sessionId}`, {
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    if (json.ok && json.receiver) return json.receiver;
    return null;
  } catch {
    return null;
  }
}
