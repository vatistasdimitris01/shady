'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ReceiverInfo {
  deviceId: string;
  displayName: string;
  deviceType: string;
  os: string;
  ready: boolean;
}

export default function ConnectPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const [receiver, setReceiver] = useState<ReceiverInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'pairing' | 'connected' | 'error'>('loading');
  const [error, setError] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSignalRef = useRef<number>(0);

  const sendSignal = useCallback(async (type: string, payload: unknown) => {
    await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, from: 'browser', type, payload }),
    });
  }, [sessionId]);

  const startWebRTC = useCallback(async () => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;
    pc.onicecandidate = (e) => { if (e.candidate) sendSignal('ice-candidate', e.candidate.toJSON()); };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') { setError('Connection failed. Same Wi-Fi?'); setStatus('error'); }
    };
    const channel = pc.createDataChannel('shady-transfer', { ordered: true });
    channelRef.current = channel;
    channel.binaryType = 'arraybuffer';
    channel.onopen = () => setStatus('connected');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal('offer', offer);
  }, [sendSignal]);

  const handleSignal = useCallback(async (msg: { type: string; payload: unknown }) => {
    if (msg.type === 'pair-approve') {
      setStatus('connected');
      await startWebRTC();
    } else if (msg.type === 'pair-reject') {
      setError('Connection rejected');
      setStatus('error');
    } else if (msg.type === 'answer' && pcRef.current) {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit));
    } else if (msg.type === 'ice-candidate' && pcRef.current) {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.payload as RTCIceCandidateInit));
    }
  }, [startWebRTC]);

  const pollSignals = useCallback(async () => {
    try {
      const res = await fetch(`/api/signal?sessionId=${sessionId}&since=${lastSignalRef.current}`);
      const data = await res.json();
      if (data.ok && data.messages?.length > 0) {
        for (const msg of data.messages) {
          lastSignalRef.current = Math.max(lastSignalRef.current, msg.timestamp);
          handleSignal(msg);
        }
      }
    } catch {}
  }, [sessionId, handleSignal]);

  useEffect(() => {
    const fetchReceiver = async () => {
      try {
        const res = await fetch(`/api/presence?sessionId=${sessionId}`);
        const data = await res.json();
        if (data.ok && data.receiver) {
          setReceiver(data.receiver);
          setStatus('pairing');
        } else {
          setError('Receiver not found or expired');
          setStatus('error');
        }
      } catch {
        setError('Failed to reach discovery service');
        setStatus('error');
      }
    };
    fetchReceiver();
  }, [sessionId]);

  useEffect(() => {
    if (status === 'pairing') pollRef.current = setInterval(pollSignals, 1000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status, pollSignals]);

  useEffect(() => () => { pcRef.current?.close(); }, []);

  const sendFiles = async (files: File[]) => {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== 'open') return;
    const CHUNK_SIZE = 256 * 1024;
    channel.send(JSON.stringify({ type: 'manifest', files: files.map((f, i) => ({ fileId: `file-${i}`, name: f.name, size: f.size, mimeType: f.type || 'application/octet-stream' })) }));
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      for (let chunk = 0; chunk < totalChunks; chunk++) {
        const start = chunk * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const buffer = await file.slice(start, end).arrayBuffer();
        const header = new TextEncoder().encode(JSON.stringify({ transferId: 't-0', fileId: `file-${i}`, chunkIndex: chunk, totalChunks }));
        const packet = new Uint8Array(4 + header.length + buffer.byteLength);
        new DataView(packet.buffer).setUint32(0, header.length, false);
        packet.set(header, 4);
        packet.set(new Uint8Array(buffer), 4 + header.length);
        channel.send(packet.buffer);
        while (channel.bufferedAmount > CHUNK_SIZE * 4) await new Promise((r) => setTimeout(r, 10));
      }
    }
    channel.send(JSON.stringify({ type: 'complete' }));
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-6">
      <div className="w-full max-w-xs">
        <h1 className="text-xl font-bold text-shady-accent text-center mb-6">SHADY</h1>

        {status === 'loading' && (
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-shady-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-shady-muted text-sm">Looking up receiver...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <p className="text-lg mb-2">✕</p>
            <p className="text-sm font-bold text-red-400 mb-1">Failed</p>
            <p className="text-xs text-shady-muted mb-4">{error}</p>
            <a href="/" className="text-shady-accent text-sm">← Back</a>
          </div>
        )}

        {status === 'pairing' && receiver && (
          <div className="text-center">
            <p className="font-bold text-sm mb-1">{receiver.displayName}</p>
            <p className="text-xs text-shady-muted mb-4">{receiver.os}</p>
            <div className="bg-shady-surface border border-shady-border rounded-xl p-4 mb-4">
              <p className="text-[10px] text-shady-muted mb-1">Pairing code</p>
              <p className="text-2xl font-bold tracking-[0.3em] text-shady-accent">{pairingCode || '...'}</p>
            </div>
            <div className="w-5 h-5 border-2 border-shady-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-shady-muted">Waiting for approval...</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot"></span>
              <span className="font-bold text-sm text-shady-accent">Connected</span>
            </div>
            <label className="block bg-shady-surface border border-shady-border rounded-xl p-5 cursor-pointer active:border-shady-accent transition-colors">
              <div className="text-2xl mb-2">+</div>
              <p className="font-bold text-sm">Select files</p>
              <p className="text-[10px] text-shady-muted mt-1">or drag and drop</p>
              <input type="file" multiple className="hidden"
                onChange={(e) => sendFiles(Array.from(e.target.files || []))} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
