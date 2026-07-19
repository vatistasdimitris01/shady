import { useState, useEffect, useCallback, useRef } from 'react';
import { sendHeartbeat, unregisterDevice, pollSignals, sendSignal } from '../lib/api.js';
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
    displayName: generateDisplayName(),
    sessionId: generateSessionId(),
    publicKey: `ed25519:${generateQrSecret().slice(0, 64)}`,
  }));

  const [sessionExpiresAt, setSessionExpiresAt] = useState(Date.now() + SESSION_DURATION);
  const [qrSecret, setQrSecret] = useState(generateQrSecret);
  const [pairingCode, setPairingCode] = useState(generatePairingCode);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PairingRequest | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const lastSignalRef = useRef(0);

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

    addLog('info', `Ready: ${identity.displayName}`);

    const heartbeat = setInterval(() => {
      sendHeartbeat({
        deviceId: identity.deviceId,
        displayName: identity.displayName,
        publicKey: identity.publicKey,
        sessionId: identity.sessionId,
        protocolVersion: '1.0.0',
        capabilities: ['files'],
        os: detectOS(),
        deviceType: detectDeviceType(),
        visibility: 'qr-only',
      }).then((ok) => setIsConnected(ok));
    }, HEARTBEAT_INTERVAL);

    sendHeartbeat({
      deviceId: identity.deviceId,
      displayName: identity.displayName,
      publicKey: identity.publicKey,
      sessionId: identity.sessionId,
      protocolVersion: '1.0.0',
      capabilities: ['files'],
      os: detectOS(),
      deviceType: detectDeviceType(),
      visibility: 'qr-only',
    }).then((ok) => {
      setIsConnected(ok);
      addLog(ok ? 'success' : 'error', ok ? 'Connected' : 'Connection failed');
    });

    return () => {
      clearInterval(heartbeat);
      unregisterDevice(identity.deviceId);
    };
  }, [offline, identity.deviceId]);

  useEffect(() => {
    if (offline) return;

    const poll = setInterval(async () => {
      const messages = await pollSignals(identity.sessionId, lastSignalRef.current);
      for (const msg of messages) {
        lastSignalRef.current = Math.max(lastSignalRef.current, msg.timestamp);

        if (msg.type === 'pair-request') {
          const p = msg.payload as { senderName: string; senderDeviceType: string; senderBrowser: string; senderOS: string };
          setPendingRequest({
            sessionId: identity.sessionId,
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
    sessionExpiresAt,
    qrSecret,
    pairingCode,
    isConnected,
    pendingRequest,
    logs,
    addLog,
    refreshQr,
    approveRequest,
    rejectRequest,
  };
}
