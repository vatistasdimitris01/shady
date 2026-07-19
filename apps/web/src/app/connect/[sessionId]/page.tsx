'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';

interface ReceiverInfo {
  deviceId: string;
  displayName: string;
  deviceType: string;
  os: string;
  ready: boolean;
}

export default function ConnectPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [receiver, setReceiver] = useState<ReceiverInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'pairing' | 'connected' | 'error'>('loading');
  const [error, setError] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSignalRef = useRef<number>(0);

  const fetchReceiver = useCallback(async () => {
    try {
      const res = await fetch(`/api/presence?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.ok && data.receiver) {
        setReceiver(data.receiver);
        setStatus('pairing');
        if (data.receiver.pairingCode) setPairingCode(data.receiver.pairingCode);
      } else {
        setError('Receiver not found or expired');
        setStatus('error');
      }
    } catch {
      setError('Failed to reach discovery service');
      setStatus('error');
    }
  }, [sessionId]);

  useEffect(() => { fetchReceiver(); }, [fetchReceiver]);

  const sendSignal = useCallback(async (type: string, payload: unknown) => {
    await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, from: 'browser', type, payload }),
    });
  }, [sessionId]);

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
  }, [sessionId]);

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
  }, []);

  const startWebRTC = useCallback(async () => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;
    pc.onicecandidate = (e) => { if (e.candidate) sendSignal('ice-candidate', e.candidate.toJSON()); };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') setError('Direct connection failed. Try the same Wi-Fi.');
    };
    const channel = pc.createDataChannel('shady-transfer', { ordered: true });
    channelRef.current = channel;
    channel.binaryType = 'arraybuffer';
    channel.onopen = () => setStatus('connected');
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal('offer', offer);
  }, [sendSignal]);

  useEffect(() => {
    if (status === 'pairing') pollRef.current = setInterval(pollSignals, 1000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [status, pollSignals]);

  useEffect(() => () => { pcRef.current?.close(); }, []);

  const sendFiles = async (files: File[]) => {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== 'open') return;
    const CHUNK_SIZE = 256 * 1024;
    const manifest = files.map((f, i) => ({ fileId: `file-${i}`, name: f.name, size: f.size, mimeType: f.type || 'application/octet-stream' }));
    channel.send(JSON.stringify({ type: 'manifest', files: manifest }));
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

  const icon = receiver?.deviceType === 'phone' ? '📱' : receiver?.deviceType === 'laptop' ? '💻' : '🖥️';

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-shady-accent">SHADY</h1>
        </div>

        {status === 'loading' && (
          <div className="bg-shady-surface border border-shady-border rounded-xl p-6 text-center">
            <div className="inline-block w-6 h-6 border-2 border-shady-accent border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-shady-muted text-sm">Looking up receiver...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-shady-surface border border-red-500/50 rounded-xl p-6 text-center">
            <div className="text-2xl mb-3">❌</div>
            <p className="text-red-400 font-bold text-sm mb-1">Failed</p>
            <p className="text-shady-muted text-xs">{error}</p>
            <a href="/" className="inline-block mt-3 text-shady-accent text-sm hover:underline">Back</a>
          </div>
        )}

        {status === 'pairing' && receiver && (
          <div className="bg-shady-surface border border-shady-border rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">{icon}</div>
            <h2 className="font-bold text-sm mb-1">{receiver.displayName}</h2>
            <p className="text-shady-muted text-xs mb-4">{receiver.os}</p>
            <div className="bg-shady-bg border border-shady-border rounded-lg p-3 mb-3">
              <p className="text-[10px] text-shady-muted mb-1">Pairing code</p>
              <p className="text-xl font-bold tracking-[0.3em] text-shady-accent">{pairingCode || '...'}</p>
            </div>
            <div className="inline-block w-5 h-5 border-2 border-shady-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-shady-muted text-xs mt-2">Waiting for approval...</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="bg-shady-surface border border-shady-accent/50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-2">✅</div>
            <h2 className="font-bold text-sm text-shady-accent mb-1">Connected</h2>
            <p className="text-shady-muted text-xs mb-4">Secure channel established</p>
            <div
              className="border-2 border-dashed border-shady-border rounded-xl p-6 hover:border-shady-accent transition-colors cursor-pointer"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
              onDrop={(e) => { e.preventDefault(); sendFiles(Array.from(e.dataTransfer.files)); }}
            >
              <div className="text-2xl mb-2">📁</div>
              <p className="font-bold text-sm mb-1">Drop files</p>
              <p className="text-shady-muted text-xs">or tap to browse</p>
              <input type="file" multiple className="hidden" id="file-input"
                onChange={(e) => sendFiles(Array.from(e.target.files || []))} />
              <label htmlFor="file-input" className="cursor-pointer mt-3 inline-block bg-shady-accent text-shady-bg px-4 py-2 rounded-lg font-bold text-xs hover:bg-shady-accent-dim transition-colors">
                Select Files
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
