'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

interface Receiver { deviceId: string; displayName: string; deviceType: string; os: string; ready: boolean }

export default function SendPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [receiver, setReceiver] = useState<Receiver | null>(null);
  const [status, setStatus] = useState<'loading' | 'pairing' | 'connected' | 'sending' | 'done' | 'error'>('loading');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const chRef = useRef<RTCDataChannel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSig = useRef(0);
  const t0 = useRef(0);

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
    ch.onmessage = (e) => { try { const d = JSON.parse(e.data); if (d.type === 'hash-verified') setStatus('done'); } catch {} };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    signal('offer', offer);
  }, [signal]);

  const handleSig = useCallback(async (msg: { type: string; payload: unknown }) => {
    if (msg.type === 'pair-approve') await startRTC();
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
        if (d.ok && d.receiver) { setReceiver(d.receiver); setStatus('pairing');
          await signal('pair-request', { senderName: 'Browser', senderDeviceType: 'unknown', senderBrowser: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop', senderOS: navigator.platform });
        } else { setError('receiver not found'); setStatus('error'); }
      } catch { setError('connection failed'); setStatus('error'); }
    })();
  }, [sessionId, signal]);

  useEffect(() => { if (status === 'pairing') pollRef.current = setInterval(poll, 1000); return () => { clearInterval(pollRef.current!); }; }, [status, poll]);
  useEffect(() => () => { pcRef.current?.close(); }, []);

  const send = async (files: File[]) => {
    const ch = chRef.current;
    if (!ch || ch.readyState !== 'open') return;
    setStatus('sending'); t0.current = Date.now();
    const CS = 256 * 1024; let sent = 0; const total = files.reduce((a, f) => a + f.size, 0);
    ch.send(JSON.stringify({ type: 'manifest', files: files.map((f, i) => ({ fileId: `f${i}`, name: f.name, size: f.size, mimeType: f.type || 'application/octet-stream' })) }));
    for (let i = 0; i < files.length; i++) {
      const f = files[i]; const tc = Math.ceil(f.size / CS);
      for (let c = 0; c < tc; c++) {
        const buf = await f.slice(c * CS, Math.min((c + 1) * CS, f.size)).arrayBuffer();
        const hdr = new TextEncoder().encode(JSON.stringify({ t: 't0', f: `f${i}`, c, n: tc }));
        const pkt = new Uint8Array(4 + hdr.length + buf.byteLength);
        new DataView(pkt.buffer).setUint32(0, hdr.length, false);
        pkt.set(hdr, 4); pkt.set(new Uint8Array(buf), 4 + hdr.length);
        ch.send(pkt.buffer); sent += buf.byteLength;
        setProgress(total > 0 ? (sent / total) * 100 : 0);
        while (ch.bufferedAmount > CS * 4) await new Promise(r => setTimeout(r, 10));
      }
    }
    ch.send(JSON.stringify({ type: 'complete' }));
    setStatus('done'); setProgress(100); setSentCount(files.length);
  };

  const fmt = (b: number) => { if (!b) return '0B'; const k = 1024; const s = ['B','KB','MB','GB']; const i = Math.floor(Math.log(b)/Math.log(k)); return `${(b/Math.pow(k,i)).toFixed(0)}${s[i]}`; };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[280px]">
        <h1 className="text-center text-lg font-medium tracking-tight mb-8">shady</h1>

        {status === 'loading' && (
          <div className="text-center fade-in">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-lime-400 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-zinc-500 text-xs">connecting</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center fade-in">
            <p className="text-zinc-600 text-xs mb-3">{error}</p>
            <a href="/" className="text-lime-400 text-xs">← back</a>
          </div>
        )}

        {status === 'pairing' && receiver && (
          <div className="text-center fade-in">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-lime-400 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm font-medium mb-0.5">{receiver.displayName}</p>
            <p className="text-zinc-500 text-[10px] mb-4">{receiver.os}</p>
            <p className="text-zinc-600 text-[10px]">waiting for approval</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="fade-in">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-lime-400 pulse"></div>
              <span className="text-xs font-medium">{receiver?.displayName}</span>
            </div>
            <label className="block cursor-pointer">
              <div className="border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl py-8 text-center transition-colors">
                <p className="text-2xl font-light text-zinc-700 mb-1">+</p>
                <p className="text-xs text-zinc-500">select files</p>
              </div>
              <input type="file" multiple className="hidden" onChange={(e) => send(Array.from(e.target.files || []))} />
            </label>
          </div>
        )}

        {status === 'sending' && (
          <div className="fade-in">
            <div className="mb-6">
              <div className="w-full h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-lime-400 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-right text-[10px] text-zinc-600 mt-1.5">{progress.toFixed(0)}%</p>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="text-center fade-in">
            <p className="text-lime-400 text-sm font-medium mb-1">sent</p>
            <p className="text-zinc-600 text-[10px] mb-6">{sentCount} file{sentCount !== 1 ? 's' : ''}</p>
            <label className="cursor-pointer text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
              send more
              <input type="file" multiple className="hidden" onChange={(e) => { setStatus('connected'); send(Array.from(e.target.files || [])); }} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
