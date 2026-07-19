'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export default function Home() {
  const [code, setCode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<any>(null);
  const scannerEl = useRef<HTMLDivElement>(null);

  const connect = () => {
    const c = code.replace(/\s/g, '');
    if (c.length >= 6) window.location.href = `/connect/${c}`;
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
        <p className="text-center text-zinc-500 text-xs mb-10">send files to any terminal</p>

        {/* Code input */}
        <div className="mb-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && connect()}
            placeholder="pairing code"
            inputMode="numeric"
            maxLength={7}
            autoFocus
            className="w-full bg-transparent border-b border-zinc-800 focus:border-lime-400 outline-none text-center text-2xl tracking-[0.4em] font-mono py-3 placeholder-zinc-700 transition-colors"
          />
          {code.replace(/\s/g, '').length >= 6 && (
            <button onClick={connect}
              className="w-full mt-4 bg-lime-400 text-zinc-950 py-2.5 rounded-lg text-sm font-semibold fade-in">
              connect
            </button>
          )}
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

      {/* Scanner */}
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
