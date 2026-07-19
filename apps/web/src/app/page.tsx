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

const DEVICE_ICONS: Record<string, string> = {
  desktop: '🖥️', laptop: '💻', phone: '📱', tablet: '📲', unknown: '❓',
};

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
    const interval = setInterval(fetchReceivers, 5000);
    return () => clearInterval(interval);
  }, [fetchReceivers]);

  useEffect(() => {
    if (!showScanner) {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    let mounted = true;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!mounted || !scannerContainerRef.current) return;

        const scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (decodedText.includes('/connect/')) {
              scanner.stop().catch(() => {});
              window.location.href = decodedText;
            }
          },
          () => {}
        );
      } catch (err) {
        console.error('QR scan error:', err);
        if (mounted) setShowScanner(false);
      }
    };

    const timer = setTimeout(initScanner, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [showScanner]);

  const handleManualConnect = () => {
    const clean = manualCode.replace(/\s/g, '');
    if (clean.length >= 6) window.location.href = `/connect/${clean}`;
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col">
      {/* Hero */}
      <section className="px-4 py-8 sm:py-12 text-center">
        <h1 className="text-3xl sm:text-5xl font-bold text-shady-accent mb-2 tracking-tight">SHADY</h1>
        <p className="text-shady-muted text-sm sm:text-lg">A suspiciously fast local drop.</p>
        <p className="text-shady-muted text-xs sm:text-sm mt-1 max-w-md mx-auto">
          Send files from your browser to any nearby terminal. No cloud. No accounts.
        </p>
      </section>

      {/* Install */}
      <section className="px-4 mb-6">
        <div className="bg-shady-surface border border-shady-accent/30 rounded-xl p-5 sm:p-6 text-center max-w-lg mx-auto">
          <span className="text-2xl sm:text-3xl font-bold text-shady-accent font-mono">$_</span>
          <h2 className="text-base sm:text-lg font-bold mt-2 mb-1">Install the Receiver</h2>
          <p className="text-shady-muted text-xs sm:text-sm mb-4">
            Runs in your terminal. Receives files via QR code.
          </p>
          <div className="bg-shady-bg border border-shady-border rounded-lg p-3 mb-3 overflow-x-auto">
            <code className="text-shady-accent text-xs sm:text-sm whitespace-nowrap">
              git clone https://github.com/vatistasdimitris01/shady &amp;&amp; cd shady/apps/tui &amp;&amp; npm install &amp;&amp; npm link
            </code>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <a href="/setup" className="bg-shady-accent text-shady-bg px-4 py-2 rounded-lg font-bold hover:bg-shady-accent-dim transition-colors text-sm">
              Setup Guide
            </a>
            <a href="https://github.com/vatistasdimitris01/shady" target="_blank" rel="noopener noreferrer"
              className="border border-shady-border text-shady-text px-4 py-2 rounded-lg font-bold hover:border-shady-accent transition-colors text-sm">
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* QR + Manual Row */}
      <section className="px-4 mb-6">
        <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* QR Scanner */}
          <button
            onClick={() => setShowScanner(true)}
            className="bg-shady-surface border border-shady-border rounded-xl p-5 text-center hover:border-shady-accent transition-colors group"
          >
            <div className="text-3xl mb-2">📷</div>
            <div className="font-bold text-sm group-hover:text-shady-accent transition-colors">Scan QR Code</div>
            <div className="text-xs text-shady-muted mt-1">Open camera and scan</div>
          </button>

          {/* Manual Code */}
          <div className="bg-shady-surface border border-shady-border rounded-xl p-5">
            <div className="text-center mb-3">
              <div className="text-3xl mb-2">⌨️</div>
              <div className="font-bold text-sm">Pairing Code</div>
              <div className="text-xs text-shady-muted mt-1">Enter code from terminal</div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="000 000"
                className="flex-1 min-w-0 bg-shady-bg border border-shady-border rounded-lg px-3 py-2 text-center text-lg tracking-[0.3em] font-mono text-shady-text placeholder-shady-muted focus:outline-none focus:border-shady-accent"
                maxLength={7}
                inputMode="numeric"
              />
              <button
                onClick={handleManualConnect}
                className="bg-shady-accent text-shady-bg px-4 py-2 rounded-lg font-bold hover:bg-shady-accent-dim transition-colors text-sm shrink-0"
              >
                Go
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Receivers */}
      <section className="px-4 mb-6 flex-1">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xs font-bold text-shady-accent mb-3 uppercase tracking-wider">Nearby Receivers</h2>
          {loading ? (
            <div className="text-center py-8 text-shady-muted">
              <div className="inline-block w-5 h-5 border-2 border-shady-accent border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-sm">Scanning...</p>
            </div>
          ) : receivers.length === 0 ? (
            <div className="text-center py-8 bg-shady-surface border border-shady-border rounded-xl">
              <p className="text-shady-muted text-sm">No receivers found.</p>
              <p className="text-shady-muted text-xs mt-1">Start SHADY on a nearby device.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {receivers.map((r) => (
                <a
                  key={r.deviceId}
                  href={`/send/${r.deviceId}`}
                  className="flex items-center justify-between bg-shady-surface border border-shady-border rounded-xl px-4 py-3 hover:border-shady-accent transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{DEVICE_ICONS[r.deviceType] || '❓'}</span>
                    <div>
                      <div className="font-medium text-sm group-hover:text-shady-accent transition-colors">{r.displayName}</div>
                      <div className="text-xs text-shady-muted">{r.os}</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.ready ? 'bg-green-500' : 'bg-shady-muted'}`}></span>
                    {r.ready ? 'Ready' : 'Busy'}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-8">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-2 text-center">
          <div className="bg-shady-surface border border-shady-border rounded-xl p-3">
            <div className="text-xl mb-1">🔒</div>
            <div className="text-xs font-bold">P2P</div>
            <div className="text-[10px] text-shady-muted">Direct transfer</div>
          </div>
          <div className="bg-shady-surface border border-shady-border rounded-xl p-3">
            <div className="text-xl mb-1">⚡</div>
            <div className="text-xs font-bold">Fast</div>
            <div className="text-[10px] text-shady-muted">LAN speed</div>
          </div>
          <div className="bg-shady-surface border border-shady-border rounded-xl p-3">
            <div className="text-xl mb-1">📱</div>
            <div className="text-xs font-bold">No Install</div>
            <div className="text-[10px] text-shady-muted">Browser only</div>
          </div>
        </div>
      </section>

      {/* QR Scanner Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setShowScanner(false)}>
          <div className="bg-shady-surface border border-shady-border rounded-2xl overflow-hidden w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-shady-border">
              <h3 className="font-bold text-sm">Scan QR Code</h3>
              <button onClick={() => setShowScanner(false)} className="text-shady-muted hover:text-shady-text text-xl leading-none">&times;</button>
            </div>
            <div className="relative">
              <div id="qr-reader" ref={scannerContainerRef} className="w-full aspect-square bg-black"></div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-shady-accent/50 rounded-2xl"></div>
              </div>
            </div>
            <div className="p-4 text-center">
              <p className="text-shady-muted text-xs">Point your camera at a SHADY QR code</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
