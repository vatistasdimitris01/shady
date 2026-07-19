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
import type { LogEntry, PairingRequest, ActiveTransfer, ActiveTransferFile } from '../types.js';

const HEARTBEAT_INTERVAL = 5000;
const SIGNAL_POLL_INTERVAL = 1000;
const SESSION_DURATION = 10 * 60 * 1000;

export function useShadyState(offline: boolean) {
  const [identity] = useState(() => ({
    deviceId: generateDeviceId(),
    displayName: generateDisplayName(),
    sessionId: generateSessionId(),
    publicKey: `ed25519:${generateQrSecret().slice(0, 64)}`,
    createdAt: Date.now(),
  }));

  const [sessionExpiresAt, setSessionExpiresAt] = useState(Date.now() + SESSION_DURATION);
  const [qrSecret, setQrSecret] = useState(generateQrSecret);
  const [pairingCode, setPairingCode] = useState(generatePairingCode);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PairingRequest | null>(null);
  const [activeTransfers, setActiveTransfers] = useState<ActiveTransfer[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastSignalTimestamp, setLastSignalTimestamp] = useState(0);
  const lastSignalRef = useRef(0);

  const addLog = useCallback((type: LogEntry['type'], message: string) => {
    setLogs((prev) => [...prev, { id: `log-${Date.now()}-${Math.random()}`, timestamp: Date.now(), type, message }]);
  }, []);

  const refreshQr = useCallback(() => {
    setQrSecret(generateQrSecret());
    setPairingCode(generatePairingCode());
    setSessionExpiresAt(Date.now() + SESSION_DURATION);
    addLog('info', 'QR code regenerated');
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

  const toggleVisibility = useCallback(() => {
    addLog('info', 'Visibility toggled (press O to cycle)');
  }, [addLog]);

  useEffect(() => {
    if (offline) {
      addLog('info', 'Offline mode — no backend connection');
      return;
    }

    addLog('info', `Receiver started: ${identity.displayName}`);
    addLog('info', `Session: ${identity.sessionId}`);

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat({
        deviceId: identity.deviceId,
        displayName: identity.displayName,
        publicKey: identity.publicKey,
        sessionId: identity.sessionId,
        protocolVersion: '1.0.0',
        capabilities: ['files', 'clipboard', 'folders'],
        os: detectOS(),
        deviceType: detectDeviceType(),
        visibility: 'qr-only',
      }).then((ok) => {
        setIsConnected(ok);
        if (ok && logs.length <= 2) {
          addLog('success', 'Connected to discovery service');
        }
      });
    }, HEARTBEAT_INTERVAL);

    sendHeartbeat({
      deviceId: identity.deviceId,
      displayName: identity.displayName,
      publicKey: identity.publicKey,
      sessionId: identity.sessionId,
      protocolVersion: '1.0.0',
      capabilities: ['files', 'clipboard', 'folders'],
      os: detectOS(),
      deviceType: detectDeviceType(),
      visibility: 'qr-only',
    }).then((ok) => {
      setIsConnected(ok);
      if (ok) addLog('success', 'Registered with discovery service');
      else addLog('error', 'Failed to register — check internet connection');
    });

    return () => {
      clearInterval(heartbeatInterval);
      unregisterDevice(identity.deviceId);
      addLog('info', 'Unregistered from discovery service');
    };
  }, [offline, identity.deviceId]);

  useEffect(() => {
    if (offline) return;

    const pollInterval = setInterval(async () => {
      const messages = await pollSignals(identity.sessionId, lastSignalRef.current);
      for (const msg of messages) {
        lastSignalRef.current = Math.max(lastSignalRef.current, msg.timestamp);

        if (msg.type === 'pair-request') {
          const payload = msg.payload as {
            senderName: string;
            senderDeviceType: string;
            senderBrowser: string;
            senderOS: string;
          };
          const code = pairingCode;
          setPendingRequest({
            sessionId: identity.sessionId,
            senderName: payload.senderName || 'Unknown Device',
            senderDeviceType: (payload.senderDeviceType as any) || 'unknown',
            senderBrowser: payload.senderBrowser || 'Unknown',
            senderOS: payload.senderOS || 'Unknown',
            pairingCode: code,
            timestamp: msg.timestamp,
          });
          addLog('warning', `Connection request from ${payload.senderName}`);
        }

        if (msg.type === 'offer') {
          addLog('info', 'WebRTC offer received — establishing data channel');
        }

        if (msg.type === 'cancel') {
          setPendingRequest(null);
          addLog('warning', 'Sender cancelled the request');
        }
      }
    }, SIGNAL_POLL_INTERVAL);

    return () => clearInterval(pollInterval);
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
    activeTransfers,
    setActiveTransfers,
    logs,
    addLog,
    refreshQr,
    approveRequest,
    rejectRequest,
    toggleVisibility,
  };
}
