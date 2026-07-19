'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Receiver { deviceId: string; displayName: string; deviceType: string; os: string; ready: boolean }

export default function ConnectClient({ sessionId }: { sessionId: string }) {
  const [receiver, setReceiver] = useState<Receiver | null>(null);
  const [status, setStatus] = useState<'loading' | 'pairing' | 'connected' | 'error'>('loading');
  const [error, setError] = useState('');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const chRef = useRef<RTCDataChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSig = useRef(0);

  const signal = useCallback(async (type: string, payload: unknown) => {
    await fetch('/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, from: 'browser', type, payload }) });
  }, [sessionId]);

  const startRTC = useCallback(async () => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;
    pc.onicecandidate = (e) => { if (e.candidate) signal('ice-candidate', e.candidate.toJSON()); };
    pc.onconnectionstatechange = () => { if (pc.connectionState === 'failed') { setError('connection failed'); setStatus('error'); } };
    const ch = pc.createDataChannel('shady', { ordered: true });
    chRef.current = ch;
    ch.binaryType = 'arraybuffer';
    ch.onopen = () => setStatus('connected');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signal('offer', offer);
  }, [signal]);

  const handleSig = useCallback(async (msg: { type: string; payload: unknown }) => {
    if (msg.type === 'pair-approve') { setStatus('connected'); await startRTC(); }
    else if (msg.type === 'pair-reject') { setError('rejected'); setStatus('error'); }
    else if (msg.type === 'answer' && pcRef.current) await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit));
    else if (msg.type === 'ice-candidate' && pcRef.current) await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.payload as RTCIceCandidateInit));
  }, [startRTC]);

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/signal?sessionId=${sessionId}&since=${lastSig.current}`);
      const d = await r.json();
      if (d.ok && d.messages?.length > 0) for (const m of d.messages) { lastSig.current = Math.max(lastSig.current, m.timestamp); handleSig(m); }
    } catch {}
  }, [sessionId, handleSig]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/presence?sessionId=${sessionId}`);
        const d = await r.json();
        if (d.ok && d.receiver) { setReceiver(d.receiver); setStatus('pairing'); }
        else { setError('receiver not found'); setStatus('error'); }
      } catch { setError('connection failed'); setStatus('error'); }
    })();
  }, [sessionId]);

  useEffect(() => { if (status === 'pairing') pollRef.current = setInterval(poll, 1000); return () => { clearInterval(pollRef.current!); }; }, [status, poll]);
  useEffect(() => () => { pcRef.current?.close(); }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <p className="text-sm text-gray-400 mb-8 text-center">shady</p>

        {status === 'loading' && (
          <div className="text-center fade-in">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-400">looking up receiver</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center fade-in">
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <a href="/" className="text-sm text-blue-500 hover:text-blue-600">back</a>
          </div>
        )}

        {status === 'pairing' && receiver && (
          <div className="text-center fade-in">
            <p className="text-base font-medium mb-0.5">{receiver.displayName}</p>
            <p className="text-xs text-gray-400 mb-5">{receiver.os}</p>
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-gray-400">waiting for approval</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="text-center fade-in">
            <div className="flex items-center justify-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-green-500 pulse"></div>
              <span className="text-sm font-medium text-green-600">connected</span>
            </div>
            <p className="text-xs text-gray-400">select files on the other page</p>
          </div>
        )}
      </div>
    </div>
  );
}
