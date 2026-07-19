'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface NearbyDevice {
  deviceId: string;
  displayName: string;
  deviceType: string;
  os: string;
  distance: number;
  sessionId: string;
}

export default function Home() {
  const [code, setCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearby, setNearby] = useState<NearbyDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const scannerRef = useRef<any>(null);
  const scannerEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: 0, lng: 0 }),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  const scanNearby = useCallback(async () => {
    if (!location) return;
    setScanning(true);
    try {
      const r = await fetch(`/api/presence?lat=${location.lat}&lng=${location.lng}`);
      const d = await r.json();
      if (d.ok) setNearby(d.receivers || []);
    } catch {}
    setScanning(false);
  }, [location]);

  useEffect(() => {
    if (!location || (location.lat === 0 && location.lng === 0)) return;
    scanNearby();
    const poll = setInterval(scanNearby, 5000);
    return () => clearInterval(poll);
  }, [location, scanNearby]);

  const lookupCode = async () => {
    const c = code.replace(/\s/g, '');
    if (c.length < 6) return;
    setLookingUp(true);
    setLookupError('');
    try {
      const r = await fetch(`/api/presence?code=${c}`);
      const d = await r.json();
      if (d.ok && d.sessionId) {
        window.location.href = `/send/${d.sessionId}`;
      } else {
        setLookupError('no receiver found');
      }
    } catch {
      setLookupError('connection failed');
    }
    setLookingUp(false);
  };

  useEffect(() => {
    if (!showScanner) {
      if (scannerRef.current) { scannerRef.current.stop().catch(() => {}); scannerRef.current = null; }
      return;
    }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!alive || !scannerEl.current) return;
        const s = new Html5Qrcode('qr');
        scannerRef.current = s;
        await s.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 200, height: 200 } },
          (text) => { if (text.includes('/connect/')) { s.stop(); window.location.href = text; } },
          () => {}
        );
      } catch { if (alive) setShowScanner(false); }
    }, 100);
    return () => { alive = false; clearTimeout(t); scannerRef.current?.stop().catch(() => {}); };
  }, [showScanner]);

  const hasLocation = location && (location.lat !== 0 || location.lng !== 0);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-start px-4 pt-16">
      <h1 className="text-2xl font-light tracking-tight mb-1">shady</h1>
      <p className="text-sm text-gray-400 mb-10">send files to any terminal</p>

      <div className="w-full max-w-sm">

        {/* Nearby devices */}
        {hasLocation && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-700">Nearby devices</p>
              {nearby.length > 0 && (
                <p className="text-xs text-gray-400">{nearby.length} found</p>
              )}
            </div>

            {nearby.length === 0 && !scanning && (
              <p className="text-xs text-gray-400 py-6 text-center">no devices nearby</p>
            )}

            {scanning && nearby.length === 0 && (
              <p className="text-xs text-gray-400 py-6 text-center">scanning...</p>
            )}

            <div className="space-y-2">
              {nearby.map((d) => (
                <button key={d.deviceId} onClick={() => window.location.href = `/send/${d.sessionId}`}
                  className="w-full flex items-center justify-between border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-3 transition-colors text-left">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{d.displayName}</p>
                    <p className="text-xs text-gray-400">{d.os}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{d.distance < 1 ? '<1' : d.distance} km</span>
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!hasLocation && (
          <div className="mb-8 py-6 text-center">
            <p className="text-xs text-gray-400">finding nearby devices...</p>
          </div>
        )}

        {/* Code input */}
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setLookupError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && lookupCode()}
              placeholder="enter code"
              inputMode="numeric"
              maxLength={7}
              autoFocus
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 transition-colors"
            />
            <button onClick={lookupCode} disabled={code.replace(/\s/g, '').length < 6 || lookingUp}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors">
              {lookingUp ? '...' : 'Connect'}
            </button>
          </div>
          {lookupError && <p className="text-xs text-red-400 mt-2">{lookupError}</p>}

          <div className="flex items-center gap-2 mt-3">
            <button onClick={() => setShowScanner(true)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              scan qr code
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a href="/setup" className="text-xs text-gray-300 hover:text-gray-500 transition-colors">setup</a>
        </div>
      </div>

      {/* Scanner */}
      {showScanner && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col" onClick={() => setShowScanner(false)}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <span className="text-sm text-gray-700">Scan QR code</span>
            <button onClick={() => setShowScanner(false)} className="text-gray-400 text-lg">✕</button>
          </div>
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-xs relative" onClick={(e) => e.stopPropagation()}>
              <div id="qr" ref={scannerEl} className="w-full rounded-2xl overflow-hidden"></div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-blue-400/40 rounded-xl"></div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-gray-400 pb-8">point at a shady qr code</p>
        </div>
      )}
    </div>
  );
}
