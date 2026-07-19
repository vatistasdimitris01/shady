import { useState, useEffect, useCallback, useRef } from 'react';
import { sendHeartbeat, unregisterDevice, pollSignals, sendSignal, sendApproval, fetchGeoLocation, checkNameTaken, fetchNearbyDevices } from '../lib/api.js';
import { startLocalServer } from '../lib/localServer.js';
import {
  generateDeviceId,
  generateSessionId,
  generatePairingCode,
  generateQrSecret,
  generateDisplayName,
  detectDeviceType,
  detectOS,
} from '../lib/crypto.js';
import type { LogEntry, PairingRequest } from '../types.js';

const HEARTBEAT_INTERVAL = 5000;
const SIGNAL_POLL_INTERVAL = 1000;
const SESSION_DURATION = 10 * 60 * 1000;

export function useShadyState(offline: boolean) {
  const [identity] = useState(() => ({
    deviceId: generateDeviceId(),
    sessionId: generateSessionId(),
    publicKey: `ed25519:${generateQrSecret().slice(0, 64)}`,
  }));

  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    if (offline) { setDisplayName(generateDisplayName()); return; }
    (async () => {
      let name = generateDisplayName();
      while (await checkNameTaken(name)) name = generateDisplayName();
      setDisplayName(name);
    })();
  }, [offline]);

  const [sessionExpiresAt, setSessionExpiresAt] = useState(Date.now() + SESSION_DURATION);
  const [qrSecret, setQrSecret] = useState(generateQrSecret);
  const [pairingCode, setPairingCode] = useState(generatePairingCode);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PairingRequest | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nearbyDevices, setNearbyDevices] = useState<any[]>([]);
  const [downloadDir, setDownloadDir] = useState(process.cwd());
  const lastSignalRef = useRef(0);

  const pairingCodeRef = useRef(pairingCode);
  useEffect(() => { pairingCodeRef.current = pairingCode; }, [pairingCode]);

  const displayNameRef = useRef(displayName);
  useEffect(() => { displayNameRef.current = displayName; }, [displayName]);

  const locationRef = useRef({ city: '', region: '', country: '', countryCode: '' });
  const serverRef = useRef<{ ip: string; port: number } | null>(null);

  useEffect(() => {
    if (offline) return;
    startLocalServer(downloadDir).then((info) => {
      serverRef.current = info;
      addLog('info', `Save to: ${info.ip}:${info.port}`);
    }).catch((err) => addLog('error', `Server failed: ${err.message}`));
  }, [offline]);

  useEffect(() => {
    if (offline) return;
    fetchGeoLocation().then((loc) => {
      locationRef.current = loc;
      if (loc.city && loc.country) {
        addLog('info', `${loc.city}, ${loc.country}`);
      }
    });
  }, [offline]);

  useEffect(() => {
    if (offline) return;
    const poll = setInterval(async () => {
      const loc = locationRef.current;
      if (!loc.city || !loc.country) return;
      const devices = await fetchNearbyDevices(loc.city, loc.country, loc.countryCode);
      setNearbyDevices(devices);
    }, 5000);
    return () => clearInterval(poll);
  }, [offline]);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs((prev) => [...prev.slice(-20), { id: `log-${Date.now()}-${Math.random()}`, timestamp: Date.now(), type, message }]);
  }, []);

  const refreshQr = useCallback(() => {
    setQrSecret(generateQrSecret());
    setPairingCode(generatePairingCode());
    setSessionExpiresAt(Date.now() + SESSION_DURATION);
    addLog('info', 'QR refreshed');
  }, [addLog]);

  const approveRequest = useCallback(() => {
    if (!pendingRequest) return;
    sendSignal(pendingRequest.sessionId, identity.deviceId, 'pair-approve', { pairingCode: pendingRequest.pairingCode });
    if (pendingRequest.senderId) sendApproval(pendingRequest.sessionId, pendingRequest.senderId);
    setPendingRequest(null);
    addLog('success', `Approved: ${pendingRequest.senderName}`);
  }, [pendingRequest, identity.deviceId, addLog]);

  const rejectRequest = useCallback(() => {
    if (!pendingRequest) return;
    sendSignal(pendingRequest.sessionId, identity.deviceId, 'pair-reject', {});
    setPendingRequest(null);
    addLog('warning', `Rejected: ${pendingRequest.senderName}`);
  }, [pendingRequest, identity.deviceId, addLog]);

  useEffect(() => {
    if (offline) {
      addLog('info', 'Offline mode — no backend');
      return;
    }

    addLog('info', `Ready: ${displayName}`);

    let firstRun = true;

    const doHeartbeat = () => {
      const dn = displayNameRef.current;
      if (!dn) return Promise.resolve({ ok: false, error: 'name pending' });
      const loc = locationRef.current;
      const sv = serverRef.current;
      return sendHeartbeat({
        deviceId: identity.deviceId,
        displayName: dn,
        publicKey: identity.publicKey,
        sessionId: identity.sessionId,
        protocolVersion: '1.0.0',
        capabilities: ['files'],
        os: detectOS(),
        deviceType: detectDeviceType(),
        visibility: 'qr-only',
        pairingCode: pairingCodeRef.current,
        city: loc.city,
        region: loc.region,
        country: loc.country,
        countryCode: loc.countryCode,
        localIp: sv?.ip,
        localPort: sv?.port,
      });
    };

    doHeartbeat().then((r) => {
      setIsConnected(r.ok);
      addLog(r.ok ? 'success' : 'error', r.ok ? 'Connected' : r.error ? `Connection failed: ${r.error}` : 'Connection failed');
    });

    const heartbeat = setInterval(() => {
      doHeartbeat().then((r) => setIsConnected(r.ok));
    }, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(heartbeat);
      unregisterDevice(identity.deviceId);
    };
  }, [offline]);

  useEffect(() => {
    if (offline) return;

    const poll = setInterval(async () => {
      const messages = await pollSignals(identity.sessionId, lastSignalRef.current);
      for (const msg of messages) {
        lastSignalRef.current = Math.max(lastSignalRef.current, msg.timestamp);

        if (msg.type === 'pair-request') {
          const p = msg.payload as { senderId: string; senderName: string; senderDeviceType: string; senderBrowser: string; senderOS: string };
          setPendingRequest({
            sessionId: identity.sessionId,
            senderId: p.senderId || '',
            senderName: p.senderName || 'Unknown',
            senderDeviceType: (p.senderDeviceType as any) || 'unknown',
            senderBrowser: p.senderBrowser || 'Unknown',
            senderOS: p.senderOS || 'Unknown',
            pairingCode,
            timestamp: msg.timestamp,
          });
          addLog('warning', `Request from ${p.senderName}`);
        }

        if (msg.type === 'cancel') {
          setPendingRequest(null);
          addLog('warning', 'Sender cancelled');
        }
      }
    }, SIGNAL_POLL_INTERVAL);

    return () => clearInterval(poll);
  }, [offline, identity.sessionId, pairingCode, addLog]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionExpiresAt((prev) => {
        if (Date.now() >= prev) {
          refreshQr();
          return Date.now() + SESSION_DURATION;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [refreshQr]);

  return {
    identity,
    displayName,
    sessionExpiresAt,
    qrSecret,
    pairingCode,
    isConnected,
    pendingRequest,
    logs,
    nearbyDevices,
    downloadDir,
    setDownloadDir,
    addLog,
    refreshQr,
    approveRequest,
    rejectRequest,
  };
}
