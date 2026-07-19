'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';

interface ReceiverInfo {
  deviceId: string;
  displayName: string;
  deviceType: string;
  os: string;
  ready: boolean;
}

export default function SendPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [receiver, setReceiver] = useState<ReceiverInfo | null>(null);
  const [status, setStatus] = useState<'loading' | 'pairing' | 'connected' | 'transferring' | 'done' | 'error'>('loading');
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [error, setError] = useState('');
  const [clipboardText, setClipboardText] = useState('');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<RTCDataChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSignalRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const fetchReceiver = useCallback(async () => {
    try {
      const res = await fetch(`/api/presence?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.ok && data.receiver) {
        setReceiver(data.receiver);
        setStatus('pairing');
        await sendSignal('pair-request', {
          senderName: 'Browser',
          senderDeviceType: 'unknown',
          senderBrowser: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
          senderOS: navigator.platform,
        });
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
      if (e.candidate) sendSignal('ice-candidate', e.candidate.toJSON());
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        setError('Direct connection failed. Try connecting to the same Wi-Fi or use offline mode.');
        setStatus('error');
      }
    };

    const channel = pc.createDataChannel('shady-transfer', { ordered: true });
    channelRef.current = channel;
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      setStatus('connected');
    };

    channel.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string);
        if (data.type === 'chunk-ack') {
          // track acknowledgments
        } else if (data.type === 'hash-verified') {
          setStatus('done');
        }
      } catch {}
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
    return () => { pcRef.current?.close(); };
  }, []);

  const sendFiles = async (files: File[]) => {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== 'open') return;
    setStatus('transferring');
    startTimeRef.current = Date.now();

    const CHUNK_SIZE = 256 * 1024;
    let totalSent = 0;
    const totalSize = files.reduce((a, f) => a + f.size, 0);

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
        totalSent += buffer.byteLength;

        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setProgress(totalSize > 0 ? (totalSent / totalSize) * 100 : 0);
        setSpeed(elapsed > 0 ? totalSent / elapsed : 0);

        while (channel.bufferedAmount > CHUNK_SIZE * 4) {
          await new Promise((r) => setTimeout(r, 10));
        }
      }
    }

    channel.send(JSON.stringify({ type: 'complete' }));
    setStatus('done');
    setProgress(100);
  };

  const sendClipboard = async () => {
    const channel = channelRef.current;
    if (!channel || channel.readyState !== 'open' || !clipboardText.trim()) return;

    channel.send(JSON.stringify({
      type: 'manifest',
      files: [{
        fileId: 'clipboard',
        name: 'clipboard.txt',
        size: new TextEncoder().encode(clipboardText).length,
        mimeType: 'text/plain',
        relativePath: 'clipboard.txt',
        lastModified: Date.now(),
      }],
    }));

    const data = new TextEncoder().encode(clipboardText);
    const header = new TextEncoder().encode(JSON.stringify({
      transferId: 'transfer-clipboard',
      fileId: 'clipboard',
      chunkIndex: 0,
      totalChunks: 1,
    }));

    const packet = new Uint8Array(4 + header.length + data.length);
    new DataView(packet.buffer).setUint32(0, header.length, false);
    packet.set(header, 4);
    packet.set(data, 4 + header.length);

    channel.send(packet.buffer);
    channel.send(JSON.stringify({ type: 'complete' }));
    setStatus('done');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatSpeed = (bps: number) => `${formatBytes(bps)}/s`;

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-shady-accent mb-2">SHADY</h1>
        <p className="text-shady-muted text-sm">Send files securely</p>
      </div>

      {status === 'loading' && (
        <div className="bg-shady-surface border border-shady-border rounded-xl p-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-shady-accent border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-shady-muted">Connecting to receiver...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-shady-surface border border-red-500/50 rounded-xl p-8 text-center">
          <div className="text-3xl mb-4">❌</div>
          <p className="text-red-400 font-bold mb-2">Connection Failed</p>
          <p className="text-shady-muted text-sm mb-4">{error}</p>
          <a href="/" className="text-shady-accent text-sm hover:underline">Back to home</a>
        </div>
      )}

      {status === 'pairing' && receiver && (
        <div className="bg-shady-surface border border-shady-border rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">
            {receiver.deviceType === 'phone' ? '📱' : receiver.deviceType === 'laptop' ? '💻' : '🖥️'}
          </div>
          <h2 className="text-lg font-bold mb-1">{receiver.displayName}</h2>
          <p className="text-shady-muted text-sm mb-6">{receiver.os}</p>
          <div className="inline-block w-6 h-6 border-2 border-shady-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-shady-muted text-sm mt-2">Requesting connection... approve on the receiver</p>
        </div>
      )}

      {(status === 'connected' || status === 'transferring' || status === 'done') && (
        <div className="bg-shady-surface border border-shady-accent/50 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot"></span>
            <span className="font-bold">Connected to {receiver?.displayName}</span>
          </div>

          {status === 'transferring' && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-shady-muted">Transferring...</span>
                <span className="text-shady-accent font-bold">{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-shady-bg rounded-full h-2 mb-2">
                <div className="progress-bar h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-shady-muted">
                <span>{formatSpeed(speed)}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-4 mb-6">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-shady-accent font-bold">Transfer Complete</p>
            </div>
          )}

          <div
            className="border-2 border-dashed border-shady-border rounded-xl p-8 hover:border-shady-accent transition-colors cursor-pointer mb-4"
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
            onDrop={(e) => {
              e.preventDefault();
              const files = Array.from(e.dataTransfer.files);
              if (files.length > 0) sendFiles(files);
            }}
          >
            <div className="text-4xl mb-3">📁</div>
            <p className="font-bold mb-1 text-center">Drop files here</p>
            <p className="text-shady-muted text-sm text-center">or click to browse</p>
            <input type="file" multiple className="hidden" id="file-send"
              onChange={(e) => { const files = Array.from(e.target.files || []); if (files.length) sendFiles(files); }}
            />
            <label htmlFor="file-send" className="cursor-pointer block text-center mt-4">
              <span className="bg-shady-accent text-shady-bg px-6 py-2 rounded-lg font-bold text-sm hover:bg-shady-accent-dim transition-colors inline-block">
                Select Files
              </span>
            </label>
          </div>

          <div className="bg-shady-bg border border-shady-border rounded-lg p-4">
            <p className="text-xs text-shady-muted mb-2">Or paste text / clipboard</p>
            <textarea
              value={clipboardText}
              onChange={(e) => setClipboardText(e.target.value)}
              placeholder="Paste text, URL, code, or notes..."
              className="w-full bg-transparent border-none outline-none text-sm text-shady-text placeholder-shady-muted resize-none"
              rows={3}
            />
            <button
              onClick={sendClipboard}
              disabled={!clipboardText.trim()}
              className="mt-2 bg-shady-accent text-shady-bg px-4 py-1.5 rounded text-xs font-bold hover:bg-shady-accent-dim transition-colors disabled:opacity-40"
            >
              Send Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
