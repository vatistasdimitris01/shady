'use client';

import { useState, useEffect, useCallback } from 'react';

interface Receiver {
  deviceId: string;
  displayName: string;
  deviceType: string;
  os: string;
  lastSeen: number;
  ready: boolean;
}

const DEVICE_ICONS: Record<string, string> = {
  desktop: '🖥️',
  laptop: '💻',
  phone: '📱',
  tablet: '📲',
  unknown: '❓',
};

export default function HomePage() {
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleManualConnect = () => {
    const clean = manualCode.replace(/\s/g, '');
    if (clean.length >= 6) {
      window.location.href = `/connect/${clean}`;
    }
  };

  const handleScanQR = async () => {
    setScanning(true);
    try {
      if ('mediaDevices' in navigator) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = document.createElement('video');
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const scanFrame = () => {
          if (!scanning) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          // QR detection would go here — for now use manual input
          requestAnimationFrame(scanFrame);
        };
        requestAnimationFrame(scanFrame);

        setTimeout(() => {
          stream.getTracks().forEach(t => t.stop());
          setScanning(false);
        }, 15000);
      }
    } catch {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-shady-accent mb-4 tracking-tight">SHADY</h1>
        <p className="text-shady-muted text-lg">A suspiciously fast local drop.</p>
        <p className="text-shady-muted text-sm mt-2">Send files directly from your browser to any nearby terminal.</p>
      </div>

      <div className="bg-shady-surface border border-shady-accent/30 rounded-xl p-8 mb-8 text-center">
        <div className="inline-block mb-4">
          <span className="text-4xl font-bold text-shady-accent font-mono tracking-tighter">$_</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Install the TUI Receiver</h2>
        <p className="text-shady-muted text-sm mb-6 max-w-lg mx-auto">
          The receiver runs in your terminal and lets any nearby browser send files directly to your computer.
          No accounts. No cloud. Just your terminal and a QR code.
        </p>
        <div className="bg-shady-bg border border-shady-border rounded-lg p-4 mb-4 inline-block">
          <code className="text-shady-accent text-sm">npx git+https://github.com/vatistasdimitris01/shady.git</code>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <a
            href="/setup"
            className="bg-shady-accent text-shady-bg px-6 py-3 rounded-lg font-bold hover:bg-shady-accent-dim transition-colors text-sm"
          >
            Setup Guide
          </a>
          <a
            href="https://github.com/vatistasdimitris01/shady"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-shady-border text-shady-text px-6 py-3 rounded-lg font-bold hover:border-shady-accent transition-colors text-sm"
          >
            GitHub
          </a>
        </div>
        <p className="text-shady-muted text-xs mt-4">macOS, Linux, Windows · Requires Node.js 18+</p>
      </div>

      <div className="bg-shady-surface border border-shady-border rounded-xl p-6 mb-8">
        <h2 className="text-sm font-bold text-shady-accent mb-4 uppercase tracking-wider">Nearby Receivers</h2>
        {loading ? (
          <div className="text-center py-8 text-shady-muted">
            <div className="inline-block w-5 h-5 border-2 border-shady-accent border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm">Scanning for nearby devices...</p>
          </div>
        ) : receivers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-shady-muted mb-2">No receivers found on your network.</p>
            <p className="text-shady-muted text-sm">Make sure SHADY is running on a nearby device, or scan a QR code.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {receivers.map((r) => (
              <a
                key={r.deviceId}
                href={`/send/${r.deviceId}`}
                className="flex items-center justify-between bg-shady-bg border border-shady-border rounded-lg px-4 py-3 hover:border-shady-accent transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{DEVICE_ICONS[r.deviceType] || '❓'}</span>
                  <div>
                    <div className="font-medium group-hover:text-shady-accent transition-colors">{r.displayName}</div>
                    <div className="text-xs text-shady-muted">{r.os}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.ready ? 'bg-green-500' : 'bg-shady-muted'}`}></span>
                    {r.ready ? 'Ready' : 'Busy'}
                  </span>
                  <button className="bg-shady-accent text-shady-bg px-3 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Connect
                  </button>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="bg-shady-surface border border-shady-border rounded-xl p-6 mb-8">
        <h2 className="text-sm font-bold text-shady-accent mb-4 uppercase tracking-wider">QR Scanner</h2>
        <p className="text-shady-muted text-sm mb-4">Scan a QR code from a SHADY receiver terminal to connect directly.</p>
        <button
          onClick={handleScanQR}
          disabled={scanning}
          className="w-full bg-shady-accent text-shady-bg py-3 rounded-lg font-bold hover:bg-shady-accent-dim transition-colors disabled:opacity-50"
        >
          {scanning ? 'Scanning...' : 'Open Camera & Scan QR'}
        </button>
      </div>

      <div className="bg-shady-surface border border-shady-border rounded-xl p-6 mb-8">
        <h2 className="text-sm font-bold text-shady-accent mb-4 uppercase tracking-wider">Manual Pairing</h2>
        <p className="text-shady-muted text-sm mb-4">Enter the 6-digit pairing code displayed on the receiver.</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="000 000"
            className="flex-1 bg-shady-bg border border-shady-border rounded-lg px-4 py-3 text-center text-lg tracking-[0.3em] font-mono text-shady-text placeholder-shady-muted focus:outline-none focus:border-shady-accent"
            maxLength={7}
          />
          <button
            onClick={handleManualConnect}
            className="bg-shady-accent text-shady-bg px-6 py-3 rounded-lg font-bold hover:bg-shady-accent-dim transition-colors"
          >
            Connect
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-center">
        <div className="bg-shady-surface border border-shady-border rounded-xl p-4">
          <div className="text-2xl mb-2">🔒</div>
          <div className="text-sm font-bold mb-1">Direct P2P</div>
          <div className="text-xs text-shady-muted">Files never touch a server</div>
        </div>
        <div className="bg-shady-surface border border-shady-border rounded-xl p-4">
          <div className="text-2xl mb-2">⚡</div>
          <div className="text-sm font-bold mb-1">Full Speed</div>
          <div className="text-xs text-shady-muted">LAN transfers at wire speed</div>
        </div>
        <div className="bg-shady-surface border border-shady-border rounded-xl p-4">
          <div className="text-2xl mb-2">📱</div>
          <div className="text-sm font-bold mb-1">No Install</div>
          <div className="text-xs text-shady-muted">Just open the browser</div>
        </div>
      </div>
    </div>
  );
}
