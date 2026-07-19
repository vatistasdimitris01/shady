export default function AboutPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[320px]">
        <a href="/" className="text-zinc-700 text-xs hover:text-zinc-500 transition-colors mb-6 inline-block">← back</a>
        <h1 className="text-lg font-medium tracking-tight mb-1">about</h1>
        <p className="text-zinc-500 text-xs mb-8">a suspiciously fast local drop</p>

        <div className="space-y-6 text-xs text-zinc-400 leading-relaxed">
          <p>SHADY lets any nearby browser send files directly to your terminal. No accounts, no cloud, no fuss.</p>

          <div>
            <p className="text-zinc-200 font-medium mb-1">how it works</p>
            <p className="text-zinc-500">Start the receiver on your computer. Open this site on your phone. Scan the QR code or enter the pairing code. Approve the connection. Drop files. They transfer directly over your local network via WebRTC — encrypted, fast, private.</p>
          </div>

          <div>
            <p className="text-zinc-200 font-medium mb-1">architecture</p>
            <div className="text-zinc-500 space-y-1">
              <p>1. TUI generates ephemeral keys</p>
              <p>2. Heartbeats register presence via Vercel</p>
              <p>3. Sender opens this site, sees receivers</p>
              <p>4. Pairing code confirms identity on both devices</p>
              <p>5. WebRTC data channel establishes direct link</p>
              <p>6. Files transfer chunk by chunk, never touching a server</p>
              <p>7. SHA-256 verifies integrity</p>
            </div>
          </div>

          <div>
            <p className="text-zinc-200 font-medium mb-1">protocol</p>
            <div className="text-zinc-500 space-y-0.5">
              <p>Version 1.0.0 · WebRTC DTLS · 256 KiB chunks · SHA-256</p>
            </div>
          </div>

          <div>
            <p className="text-zinc-200 font-medium mb-1">platforms</p>
            <p className="text-zinc-500">macOS, Linux, Windows (receiver) · Any modern browser (sender)</p>
          </div>

          <p className="text-zinc-600 text-[10px]">MIT license · open source</p>
        </div>
      </div>
    </div>
  );
}
