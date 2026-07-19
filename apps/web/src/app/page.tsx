'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface NearbyDevice {
  deviceId: string;
  displayName: string;
  deviceType: string;
  os: string;
  distance: number;
  pairingCode: string;
  sessionId: string;
}

export default function Home() {
  const [code, setCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState('');
  const [nearby, setNearby] = useState<NearbyDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const scannerRef = useRef<any>(null);
  const scannerEl = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocError('');
      },
      () => setLocError('location access denied'),
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
    if (!location) return;
    scanNearby();
    pollRef.current = setInterval(scanNearby, 5000);
    return () => clearInterval(pollRef.current!);
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

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[280px]">
        <h1 className="text-center text-lg font-medium tracking-tight mb-1">shady</h1>
        <p className="text-center text-zinc-500 text-xs mb-8">send files to any terminal</p>

        {/* Nearby devices */}
        {location && nearby.length > 0 && (
          <div className="mb-6 fade-in">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider">nearby</p>
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-lime-400 pulse"></div>
                <p className="text-[10px] text-zinc-600">{scanning ? 'scanning...' : `${nearby.length} device${nearby.length !== 1 ? 's' : ''}`}</p>
              </div>
            </div>
            <div className="space-y-2">
              {nearby.map((d) => (
                <button key={d.deviceId} onClick={() => window.location.href = `/send/${d.sessionId}`}
                  className="w-full text-left border border-zinc-800 hover:border-zinc-700 rounded-lg p-3 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium">{d.displayName}</p>
                      <p className="text-[10px] text-zinc-600">{d.os}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-500">{d.distance < 1 ? '<1' : d.distance}km</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="text-center text-zinc-700 text-xs my-4">or</div>
          </div>
        )}

        {location && nearby.length === 0 && !scanning && (
          <div className="mb-6 text-center">
            <p className="text-zinc-600 text-[10px] mb-4">no nearby devices</p>
            <div className="text-center text-zinc-700 text-xs my-4">or</div>
          </div>
        )}

        {!location && locError && (
          <div className="mb-6 text-center">
            <p className="text-zinc-600 text-[10px] mb-4">{locError}</p>
            <div className="text-center text-zinc-700 text-xs my-4">or</div>
          </div>
        )}

        {!location && !locError && (
          <div className="mb-6 text-center">
            <div className="w-4 h-4 border-2 border-zinc-700 border-t-lime-400 rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-zinc-600 text-[10px]">getting location</p>
            <div className="text-center text-zinc-700 text-xs my-4">or</div>
          </div>
        )}

        {/* Pairing code input */}
        <div className="mb-4">
          <input
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setLookupError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && lookupCode()}
            placeholder="pairing code"
            inputMode="numeric"
            maxLength={7}
            autoFocus
            className="w-full bg-transparent border-b border-zinc-800 focus:border-lime-400 outline-none text-center text-2xl tracking-[0.4em] font-mono py-3 placeholder-zinc-700 transition-colors"
          />
          {code.replace(/\s/g, '').length >= 6 && (
            <button onClick={lookupCode} disabled={lookingUp}
              className="w-full mt-4 bg-lime-400 text-zinc-950 py-2.5 rounded-lg text-sm font-semibold fade-in disabled:opacity-50">
              {lookingUp ? 'looking up...' : 'connect'}
            </button>
          )}
          {lookupError && <p className="text-center text-zinc-600 text-[10px] mt-2">{lookupError}</p>}
        </div>

        <div className="text-center text-zinc-700 text-xs my-4">or</div>

        <button onClick={() => setShowScanner(true)}
          className="w-full border border-zinc-800 hover:border-zinc-700 py-2.5 rounded-lg text-sm text-zinc-400 transition-colors">
          scan qr code
        </button>

        <div className="mt-16 text-center">
          <a href="/setup" className="text-zinc-700 text-[10px] hover:text-zinc-500 transition-colors">setup</a>
        </div>
      </div>

      {showScanner && (
        <div className="fixed inset-0 z-50 bg-zinc-950/95 flex flex-col" onClick={() => setShowScanner(false)}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <span className="text-xs text-zinc-500">scan qr</span>
            <button onClick={() => setShowScanner(false)} className="text-zinc-500 text-lg">✕</button>
          </div>
          <div className="flex-1 flex items-center justify-center px-8">
            <div className="w-full max-w-xs relative" onClick={(e) => e.stopPropagation()}>
              <div id="qr" ref={scannerEl} className="w-full rounded-2xl overflow-hidden"></div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-48 h-48 border border-lime-400/30 rounded-xl"></div>
              </div>
            </div>
          </div>
          <p className="text-center text-[10px] text-zinc-700 pb-8">point at a shady qr code</p>
        </div>
      )}
    </div>
  );
}
