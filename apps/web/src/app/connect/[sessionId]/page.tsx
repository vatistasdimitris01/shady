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
  const [secret, setSecret] = useState('');
  const [receiver, setReceiver] = useState<ReceiverInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'pairing' | 'connected' | 'error'>('loading');
  const [error, setError] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSignalRef = useRef<number>(0);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) setSecret(hash);
  }, []);

  const fetchReceiver = useCallback(async () => {
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
  }, [sessionId]);

  useEffect(() => {
    fetchReceiver();
  }, [fetchReceiver]);

  const sendSignal = useCallback(async (type: string, payload: unknown) => {
    await fetch('/api/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        from: 'browser',
        type,
        payload,
      }),
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
      setError('Connection rejected by receiver');
      setStatus('error');
    } else if (msg.type === 'answer' && pcRef.current) {
      const answer = new RTCSessionDescription(msg.payload as RTCSessionDescriptionInit);
      await pcRef.current.setRemoteDescription(answer);
    } else if (msg.type === 'ice-candidate' && pcRef.current) {
      const candidate = new RTCIceCandidate(msg.payload as RTCIceCandidateInit);
      await pcRef.current.addIceCandidate(candidate);
    }
  }, []);

  const startWebRTC = useCallback(async () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal('ice-candidate', e.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        setError('Direct connection failed. Try connecting to the same Wi-Fi or use offline mode.');
      }
    };

    const channel = pc.createDataChannel('shady-transfer', {
      ordered: true,
    });
    channelRef.current = channel;

    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      setStatus('connected');
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal('offer', offer);
  }, [sendSignal]);

  useEffect(() => {
    if (status === 'pairing') {
      pollRef.current = setInterval(pollSignals, 1000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, pollSignals]);

  useEffect(() => {
    return () => {
      pcRef.current?.close();
    };
  }, []);

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-shady-accent mb-2">SHADY</h1>
        <p className="text-shady-muted text-sm">Connecting to receiver</p>
      </div>

      {status === 'loading' && (
        <div className="bg-shady-surface border border-shady-border rounded-xl p-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-shady-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-shady-muted">Looking up receiver...</p>
          <p className="text-shady-muted text-xs mt-1">Session: {sessionId}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-shady-surface border border-red-500/50 rounded-xl p-8 text-center">
          <div className="text-3xl mb-4">❌</div>
          <p className="text-red-400 font-bold mb-2">Connection Failed</p>
          <p className="text-shady-muted text-sm">{error}</p>
          <a href="/" className="inline-block mt-4 text-shady-accent text-sm hover:underline">
            Back to home
          </a>
        </div>
      )}

      {status === 'pairing' && receiver && (
        <div className="bg-shady-surface border border-shady-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">
            {receiver.deviceType === 'phone' ? '📱' : receiver.deviceType === 'laptop' ? '💻' : '🖥️'}
          </div>
          <h2 className="text-lg font-bold mb-1">{receiver.displayName}</h2>
          <p className="text-shady-muted text-sm mb-6">{receiver.os}</p>

          <div className="bg-shady-bg border border-shady-border rounded-lg p-4 mb-4">
            <p className="text-xs text-shady-muted mb-2">Pairing code</p>
            <p className="text-2xl font-bold tracking-[0.3em] text-shady-accent">{pairingCode || '...'}</p>
            <p className="text-xs text-shady-muted mt-2">Confirm this matches the code on the receiver screen</p>
          </div>

          <div className="inline-block w-6 h-6 border-2 border-shady-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-shady-muted text-sm mt-2">Waiting for receiver approval...</p>
          <p className="text-shady-muted text-xs mt-1">The receiver must accept before the connection is established</p>
        </div>
      )}

      {status === 'connected' && (
        <div className="bg-shady-surface border border-shady-accent/50 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-lg font-bold text-shady-accent mb-1">Connected</h2>
          <p className="text-shady-muted text-sm mb-6">Secure data channel established</p>

          <div
            className="border-2 border-dashed border-shady-border rounded-xl p-8 hover:border-shady-accent transition-colors cursor-pointer"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              if (files.length > 0) sendFiles(files);
            }}
          >
            <div className="text-4xl mb-3">📁</div>
            <p className="font-bold mb-1">Drop files here</p>
            <p className="text-shady-muted text-sm">or click to browse</p>
            <input
              type="file"
              multiple
              className="hidden"
              id="file-input"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) sendFiles(files);
              }}
            />
            <label htmlFor="file-input" className="cursor-pointer">
              <div className="mt-4 bg-shady-accent text-shady-bg px-4 py-2 rounded-lg font-bold text-sm inline-block hover:bg-shady-accent-dim transition-colors">
                Select Files
              </div>
            </label>
          </div>
        </div>
      )}
    </div>
  );

  async function sendFiles(files: File[]) {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== 'open') return;

    const CHUNK_SIZE = 256 * 1024;

    const manifest = files.map((f, i) => ({
      fileId: `file-${i}`,
      name: f.name,
      size: f.size,
      mimeType: f.type || 'application/octet-stream',
      relativePath: f.name,
      lastModified: f.lastModified,
    }));

    channel.send(JSON.stringify({ type: 'manifest', files: manifest }));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      for (let chunk = 0; chunk < totalChunks; chunk++) {
        const start = chunk * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const slice = file.slice(start, end);
        const buffer = await slice.arrayBuffer();

        const header = new TextEncoder().encode(JSON.stringify({
          transferId: 'transfer-0',
          fileId: `file-${i}`,
          chunkIndex: chunk,
          totalChunks,
        }));

        const packet = new Uint8Array(4 + header.length + buffer.byteLength);
        new DataView(packet.buffer).setUint32(0, header.length, false);
        packet.set(header, 4);
        packet.set(new Uint8Array(buffer), 4 + header.length);

        channel.send(packet.buffer);

        while (channel.bufferedAmount > CHUNK_SIZE * 4) {
          await new Promise((r) => setTimeout(r, 10));
        }
      }
    }

    channel.send(JSON.stringify({ type: 'complete' }));
  }
}
