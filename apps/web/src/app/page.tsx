'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface Receiver {
  deviceId: string;
  displayName: string;
  deviceType: string;
  os: string;
  lastSeen: number;
  ready: boolean;
}

const ICONS: Record<string, string> = { desktop: '🖥', laptop: '💻', phone: '📱', tablet: '📲' };

export default function HomePage() {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const scannerRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const fetchReceivers = useCallback(async () => {
    try {
      const res = await fetch('/api/presence');
      const data = await res.json();
      if (data.ok) setReceivers(data.receivers);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReceivers();
    const i = setInterval(fetchReceivers, 5000);
    return () => clearInterval(i);
  }, [fetchReceivers]);

  useEffect(() => {
    if (!showScanner) {
      if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; }
      return;
    }
    let alive = true;
    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!alive || !scannerContainerRef.current) return;
        const s = new Html5Qrcode('qr-reader');
        scannerRef.current = s;
        await s.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1.0 },
          (text) => {
            if (text.includes('/connect/')) { s.stop().catch(() => {}); window.location.href = text; }
          },
          () => {}
        );
      } catch { if (alive) setShowScanner(false); }
    };
    const t = setTimeout(init, 100);
    return () => { alive = false; clearTimeout(t); if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; } };
  }, [showScanner]);

  const connect = () => {
    const c = manualCode.replace(/\s/g, '');
    if (c.length >= 6) window.location.href = `/connect/${c}`;
  };

  return (
    <div className="min-h-dvh flex flex-col px-5 py-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-shady-accent tracking-tight">shady</h1>
        <p className="text-[11px] text-shady-muted mt-1">send files to any terminal</p>
      </div>

      {/* Action cards */}
      <div className="flex-1 flex flex-col gap-3 max-w-xs mx-auto w-full">
        {/* QR Scan */}
        <button onClick={() => setShowScanner(true)}
          className="w-full bg-shady-surface border border-shady-border rounded-2xl p-5 text-center active:border-shady-accent transition-colors">
          <div className="text-3xl mb-2">📷</div>
          <div className="font-bold text-sm">Scan QR</div>
          <div className="text-[10px] text-shady-muted mt-1">Point at receiver terminal</div>
        </button>

        {/* Manual code */}
        <div className="bg-shady-surface border border-shady-border rounded-2xl p-5">
          <div className="text-center mb-3">
            <div className="text-3xl mb-2">⌨</div>
            <div className="font-bold text-sm">Pairing code</div>
            <div className="text-[10px] text-shady-muted mt-1">From the receiver terminal</div>
          </div>
          <div className="flex gap-2">
            <input type="text" value={manualCode} onChange={(e) => setManualCode(e.target.value)}
              placeholder="000 000" inputMode="numeric" maxLength={7}
              className="flex-1 min-w-0 bg-shady-bg border border-shady-border rounded-xl px-3 py-3 text-center text-lg tracking-[0.3em] font-mono text-shady-text placeholder-shady-muted focus:outline-none focus:border-shady-accent" />
            <button onClick={connect}
              className="bg-shady-accent text-shady-bg px-5 py-3 rounded-xl font-bold text-sm active:bg-shady-accent-dim shrink-0">
              Go
            </button>
          </div>
        </div>

        {/* Nearby receivers */}
        {receivers.length > 0 && (
          <div className="mt-2">
            <p className="text-[10px] text-shady-muted uppercase tracking-wider mb-2">Nearby</p>
            {receivers.map((r) => (
              <a key={r.deviceId} href={`/send/${r.deviceId}`}
                className="flex items-center gap-3 bg-shady-surface border border-shady-border rounded-xl px-4 py-3 mb-2 active:border-shady-accent transition-colors">
                <span className="text-lg">{ICONS[r.deviceType] || '❓'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm truncate">{r.displayName}</div>
                  <div className="text-[10px] text-shady-muted">{r.os}</div>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${r.ready ? 'bg-green-500' : 'bg-shady-muted'}`}></span>
              </a>
            ))}
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="w-4 h-4 border-2 border-shady-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center mt-8">
        <div className="flex items-center justify-center gap-4 text-[10px] text-shady-muted">
          <a href="/setup" className="hover:text-shady-accent">Setup</a>
          <a href="/about" className="hover:text-shady-accent">About</a>
          <a href="https://github.com/vatistasdimitris01/shady" target="_blank" rel="noopener noreferrer" className="hover:text-shady-accent">GitHub</a>
        </div>
      </div>

      {/* Scanner modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setShowScanner(false)}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3">
              <span className="text-sm font-bold text-shady-accent">Scan QR</span>
              <button onClick={() => setShowScanner(false)} className="text-shady-muted text-2xl leading-none">×</button>
            </div>
            <div className="relative mx-4 rounded-2xl overflow-hidden bg-black">
              <div id="qr-reader" ref={scannerContainerRef} className="w-full"></div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-52 h-52 border-2 border-shady-accent/40 rounded-2xl"></div>
              </div>
            </div>
            <p className="text-center text-[10px] text-shady-muted mt-3">Point at a SHADY QR code</p>
          </div>
        </div>
      )}
    </div>
  );
}
