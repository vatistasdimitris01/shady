'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Receiver { deviceId: string; displayName: string; deviceType: string; os: string; ready: boolean; localIp?: string; localPort?: number }

export default function SendClient({ sessionId }: { sessionId: string }) {
  const [receiver, setReceiver] = useState<Receiver | null>(null);
  const [status, setStatus] = useState<'loading' | 'pairing' | 'connected' | 'sending' | 'done' | 'error'>('loading');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [sentCount, setSentCount] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const approveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const senderIdRef = useRef(crypto.randomUUID());
  const startedRef = useRef(false);

  const signal = useCallback(async (type: string, payload: unknown) => {
    await fetch('/api/signal', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, from: 'browser', type, payload }) });
  }, [sessionId]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/presence?sessionId=${sessionId}`);
        const d = await r.json();
        if (d.ok && d.receiver) { setReceiver(d.receiver); setStatus('pairing');
          await signal('pair-request', { senderId: senderIdRef.current, senderName: 'Browser', senderDeviceType: 'unknown', senderBrowser: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop', senderOS: navigator.platform });
        } else { setError('receiver not found'); setStatus('error'); }
      } catch { setError('connection failed'); setStatus('error'); }
    })();
  }, [sessionId, signal]);

  const poll = useCallback(async () => {
    try {
      const r = await fetch(`/api/signal?sessionId=${sessionId}&since=0`);
      const d = await r.json();
      if (d.ok && d.messages?.length > 0) for (const m of d.messages) {
        if (m.type === 'pair-approve' && !startedRef.current) { startedRef.current = true; setStatus('connected'); }
        if (m.type === 'pair-reject') { setError('rejected'); setStatus('error'); }
      }
    } catch {}
  }, [sessionId]);

  useEffect(() => { if (status === 'pairing') pollRef.current = setInterval(poll, 1000); return () => { clearInterval(pollRef.current!); }; }, [status, poll]);

  useEffect(() => {
    if (status !== 'pairing') return;
    const id = setInterval(async () => {
      try {
        const r = await fetch(`/api/presence?sessionId=${sessionId}&senderId=${senderIdRef.current}`);
        const d = await r.json();
        if (d.ok && d.approved && !startedRef.current) { startedRef.current = true; setStatus('connected'); }
      } catch {}
    }, 800);
    approveRef.current = id;
    return () => clearInterval(id);
  }, [status, sessionId]);

  const send = async (files: File[]) => {
    const rec = receiver;
    if (!rec?.localIp || !rec?.localPort) { setError('receiver not reachable'); setStatus('error'); return; }
    setStatus('sending');
    const total = files.reduce((a, f) => a + f.size, 0);
    let sent = 0;
    for (const file of files) {
      try {
        const buf = await file.arrayBuffer();
        const r = await fetch(`http://${rec.localIp}:${rec.localPort}/upload`, {
          method: 'POST',
          headers: { 'X-Filename': encodeURIComponent(file.name), 'Content-Type': 'application/octet-stream' },
          body: buf,
        });
        const d = await r.json();
        if (!d.ok) throw new Error(d.error || 'upload failed');
        sent += buf.byteLength;
        setProgress(total > 0 ? (sent / total) * 100 : 0);
      } catch (e: any) {
        setError(`upload failed: ${e.message}`);
        setStatus('error');
        return;
      }
    }
    setStatus('done'); setProgress(100); setSentCount(files.length);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    send(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}>
      <div className="w-full max-w-sm">
        <p className="text-sm text-gray-400 mb-8 text-center">shady</p>

        {status === 'loading' && (
          <div className="text-center fade-in">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-gray-400">connecting</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center fade-in">
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <a href="/" className="text-sm text-blue-500">back</a>
          </div>
        )}

        {status === 'pairing' && receiver && (
          <div className="text-center fade-in">
            <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-base font-medium mb-0.5">{receiver.displayName}</p>
            <p className="text-xs text-gray-400 mb-4">{receiver.os}</p>
            <p className="text-xs text-gray-400">waiting for approval</p>
          </div>
        )}

        {status === 'connected' && (
          <div className="fade-in">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-green-500 pulse"></div>
              <span className="text-sm font-medium text-green-600">{receiver?.displayName}</span>
              {receiver?.localIp && <span className="text-xs text-gray-400">LAN</span>}
            </div>
            <label className={`block cursor-pointer border-2 border-dashed rounded-xl py-10 text-center transition-colors ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="file" multiple className="hidden" onChange={(e) => send(Array.from(e.target.files || []))} />
              <p className="text-3xl font-light text-gray-300 mb-1">+</p>
              <p className="text-xs text-gray-400">click or drop files</p>
            </label>
          </div>
        )}

        {status === 'sending' && (
          <div className="fade-in">
            <div className="mb-6">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-right text-xs text-gray-400 mt-1.5">{progress.toFixed(0)}%</p>
            </div>
          </div>
        )}

        {status === 'done' && (
          <div className="text-center fade-in">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Sent</p>
            <p className="text-xs text-gray-400 mb-5">{sentCount} file{sentCount !== 1 ? 's' : ''}</p>
            <label className="cursor-pointer text-sm text-blue-500 hover:text-blue-600">
              send more
              <input type="file" multiple className="hidden" onChange={(e) => { setStatus('connected'); send(Array.from(e.target.files || [])); }} />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
