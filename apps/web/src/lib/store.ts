import { createHmac, randomBytes } from 'crypto';

const PRESENCE_TTL = 15_000;
const SIGNAL_TTL = 30_000;

interface PresenceEntry {
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
  localIp: string;
  localPort: number;
  lastSeen: number;
  networkScope: string;
}

interface SignalEntry {
  id: string;
  sessionId: string;
  from: string;
  type: string;
  payload?: unknown;
  timestamp: number;
}

const presence = new Map<string, PresenceEntry>();
const signals = new Map<string, SignalEntry[]>();
const SERVER_SECRET = process.env.SHADY_HMAC_SECRET || 'shady-dev-secret-change-in-prod';

function computeNetworkScope(sourceIp: string): string {
  return createHmac('sha256', SERVER_SECRET).update(sourceIp).digest('hex');
}

function normalizeIp(ip: string): string {
  if (ip === '::1' || ip === '127.0.0.1') return 'local';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

export function registerPresence(data: Omit<PresenceEntry, 'lastSeen' | 'networkScope'>, sourceIp: string): void {
  const scope = computeNetworkScope(normalizeIp(sourceIp));
  presence.set(data.deviceId, {
    ...data,
    localIp: (data as any).localIp || '',
    localPort: (data as any).localPort || 0,
    lastSeen: Date.now(),
    networkScope: scope,
  });
}

export function heartbeat(deviceId: string, sourceIp: string, patch?: { city?: string; region?: string; country?: string; countryCode?: string; pairingCode?: string; localIp?: string; localPort?: number }): boolean {
  const entry = presence.get(deviceId);
  if (!entry) return false;
  entry.lastSeen = Date.now();
  entry.networkScope = computeNetworkScope(normalizeIp(sourceIp));
  if (patch?.city !== undefined) entry.city = patch.city;
  if (patch?.region !== undefined) entry.region = patch.region;
  if (patch?.country !== undefined) entry.country = patch.country;
  if (patch?.countryCode !== undefined) entry.countryCode = patch.countryCode;
  if (patch?.pairingCode) entry.pairingCode = patch.pairingCode;
  if (patch?.localIp !== undefined) entry.localIp = patch.localIp;
  if (patch?.localPort !== undefined) entry.localPort = patch.localPort;
  return true;
}

export function unregisterPresence(deviceId: string): void {
  presence.delete(deviceId);
  for (const [key, msgs] of signals) {
    signals.set(key, msgs.filter((m) => m.from !== deviceId));
  }
}

export function getReceiverByCode(code: string): PresenceEntry | null {
  const now = Date.now();
  for (const entry of presence.values()) {
    if (entry.pairingCode === code && entry.lastSeen + PRESENCE_TTL >= now) {
      return entry;
    }
  }
  return null;
}

export function getReceiverBySession(sessionId: string): PresenceEntry | null {
  const now = Date.now();
  for (const entry of presence.values()) {
    if (entry.sessionId === sessionId && entry.lastSeen + PRESENCE_TTL >= now) {
      return entry;
    }
  }
  return null;
}

export function getNearbyByLocation(query: { city: string; country: string; countryCode: string }): {
  deviceId: string; displayName: string; deviceType: string; os: string; lastSeen: number; ready: boolean;
  pairingCode: string; sessionId: string; city: string; region: string; country: string; match: 'city' | 'country';
  localIp: string; localPort: number;
}[] {
  const now = Date.now();
  const results: any[] = [];

  for (const entry of presence.values()) {
    if (entry.lastSeen + PRESENCE_TTL < now) continue;
    if (entry.visibility === 'hidden') continue;
    if (!entry.city || !entry.country) continue;

    const sameCity = entry.city.toLowerCase() === query.city.toLowerCase() && entry.country.toLowerCase() === query.country.toLowerCase();
    const sameCountry = entry.countryCode.toLowerCase() === query.countryCode.toLowerCase();

    if (!sameCity && !sameCountry) continue;

    results.push({
      deviceId: entry.deviceId,
      displayName: entry.displayName,
      deviceType: entry.deviceType,
      os: entry.os,
      lastSeen: entry.lastSeen,
      ready: true,
      pairingCode: entry.pairingCode,
      sessionId: entry.sessionId,
      city: entry.city,
      region: entry.region,
      country: entry.country,
      localIp: entry.localIp,
      localPort: entry.localPort,
      match: sameCity ? 'city' as const : 'country' as const,
    });
  }

  results.sort((a: any, b: any) => {
    if (a.match === 'city' && b.match !== 'city') return -1;
    if (a.match !== 'city' && b.match === 'city') return 1;
    return a.city.localeCompare(b.city);
  });

  return results;
}

export function isNameTaken(name: string): boolean {
  const now = Date.now();
  for (const entry of presence.values()) {
    if (entry.displayName.toLowerCase() === name.toLowerCase() && entry.lastSeen + PRESENCE_TTL >= now) {
      return true;
    }
  }
  return false;
}

export function pushSignal(msg: Omit<SignalEntry, 'id' | 'timestamp'>): SignalEntry {
  const entry: SignalEntry = {
    ...msg,
    id: randomBytes(16).toString('hex'),
    timestamp: Date.now(),
  };
  const list = signals.get(msg.sessionId) || [];
  list.push(entry);
  signals.set(msg.sessionId, list);
  return entry;
}

export function pollSignals(sessionId: string, since?: number): SignalEntry[] {
  const list = signals.get(sessionId) || [];
  const now = Date.now();
  const filtered = list.filter((s) => {
    if (s.timestamp + SIGNAL_TTL < now) return false;
    if (since && s.timestamp <= since) return false;
    return true;
  });
  signals.set(sessionId, filtered);
  return filtered;
}

export function clearSignals(sessionId: string): void {
  signals.delete(sessionId);
}

const approvals = new Map<string, Set<string>>();

export function approveSender(sessionId: string, senderId: string): void {
  const set = approvals.get(sessionId) || new Set();
  set.add(senderId);
  approvals.set(sessionId, set);
}

export function isApproved(sessionId: string, senderId: string): boolean {
  const set = approvals.get(sessionId);
  return set ? set.has(senderId) : false;
}

export function unapproveSender(sessionId: string, senderId: string): void {
  const set = approvals.get(sessionId);
  if (set) set.delete(senderId);
}

export function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, entry] of presence) {
    if (entry.lastSeen + PRESENCE_TTL < now) {
      presence.delete(id);
    }
  }
}
