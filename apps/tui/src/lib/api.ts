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
  pairingCode: string;
  lat: number;
  lng: number;
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

export async function fetchGeoLocation(): Promise<{ lat: number; lng: number }> {
  const services = [
    'https://ipapi.co/json/',
    'https://ipwho.is/',
    'https://ipinfo.io/json',
  ];
  for (const url of services) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const d = await res.json();
      const lat = d.latitude ?? d.lat ?? d.loc?.split(',')[0];
      const lng = d.longitude ?? d.lng ?? d.lon ?? d.loc?.split(',')[1];
      if (lat && lng) return { lat: parseFloat(lat), lng: parseFloat(lng) };
    } catch {}
  }
  return { lat: 0, lng: 0 };
}
