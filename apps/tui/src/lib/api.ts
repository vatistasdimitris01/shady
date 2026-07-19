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
  city: string;
  region: string;
  country: string;
  countryCode: string;
}

export async function sendHeartbeat(data: HeartbeatData): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/presence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(5000),
    });
    const json = await res.json();
    return { ok: json.ok === true, error: json.error || (json.ok ? undefined : `HTTP ${res.status}`) };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'network error' };
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

export async function fetchGeoLocation(): Promise<{ city: string; region: string; country: string; countryCode: string }> {
  const services = [
    'https://ipapi.co/json/',
    'https://ipwho.is/',
    'https://ipinfo.io/json',
  ];
  for (const url of services) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      const d = await res.json();
      const city = d.city || d.region || '';
      const region = d.region || d.region_name || '';
      const country = d.country_name || d.country || '';
      const countryCode = d.country_code || d.country || '';
      if (city && country) return { city, region, country, countryCode };
    } catch {}
  }
  return { city: '', region: '', country: '', countryCode: '' };
}
