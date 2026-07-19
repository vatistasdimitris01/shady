import { createHmac, randomBytes } from 'crypto';

const PRESENCE_TTL = 15_000;
const SIGNAL_TTL = 30_000;
const MAX_PROXIMITY_KM = 50;

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
  lat: number;
  lng: number;
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

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function registerPresence(data: Omit<PresenceEntry, 'lastSeen' | 'networkScope'>, sourceIp: string): void {
  const scope = computeNetworkScope(normalizeIp(sourceIp));
  presence.set(data.deviceId, {
    ...data,
    lastSeen: Date.now(),
    networkScope: scope,
  });
}

export function heartbeat(deviceId: string, sourceIp: string, patch?: { lat?: number; lng?: number; pairingCode?: string }): boolean {
  const entry = presence.get(deviceId);
  if (!entry) return false;
  entry.lastSeen = Date.now();
  entry.networkScope = computeNetworkScope(normalizeIp(sourceIp));
  if (patch?.lat !== undefined) entry.lat = patch.lat;
  if (patch?.lng !== undefined) entry.lng = patch.lng;
  if (patch?.pairingCode) entry.pairingCode = patch.pairingCode;
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

export function getNearbyReceiversByLocation(lat: number, lng: number): { deviceId: string; displayName: string; deviceType: string; os: string; lastSeen: number; ready: boolean; distance: number; pairingCode: string; sessionId: string }[] {
  const now = Date.now();
  const results: { deviceId: string; displayName: string; deviceType: string; os: string; lastSeen: number; ready: boolean; distance: number; pairingCode: string; sessionId: string }[] = [];

  for (const entry of presence.values()) {
    if (entry.lastSeen + PRESENCE_TTL < now) continue;
    if (entry.visibility === 'hidden') continue;
    if (entry.lat === 0 && entry.lng === 0) continue;
    const dist = haversine(lat, lng, entry.lat, entry.lng);
    if (dist > MAX_PROXIMITY_KM) continue;
    results.push({
      deviceId: entry.deviceId,
      displayName: entry.displayName,
      deviceType: entry.deviceType,
      os: entry.os,
      lastSeen: entry.lastSeen,
      ready: true,
      distance: Math.round(dist * 10) / 10,
      pairingCode: entry.pairingCode,
      sessionId: entry.sessionId,
    });
  }

  results.sort((a, b) => a.distance - b.distance);
  return results;
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

export function cleanupExpired(): void {
  const now = Date.now();
  for (const [id, entry] of presence) {
    if (entry.lastSeen + PRESENCE_TTL < now) {
      presence.delete(id);
    }
  }
}
