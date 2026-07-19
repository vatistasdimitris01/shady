export default function AboutPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <a href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-6 inline-block">back</a>
        <h1 className="text-lg font-medium mb-1">About</h1>
        <p className="text-sm text-gray-400 mb-8">A fast local drop</p>

        <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
          <p>Shady lets any nearby browser send files directly to your terminal. No accounts, no cloud.</p>

          <div>
            <p className="text-gray-900 font-medium mb-1">How it works</p>
            <p className="text-gray-500">Start the receiver on your computer. Open this site on your phone. Scan the QR code or enter the pairing code. Approve the connection. Drop files. They transfer directly over your local network via WebRTC.</p>
          </div>

          <div>
            <p className="text-gray-900 font-medium mb-1">Architecture</p>
            <div className="text-gray-500 space-y-0.5">
              <p>TUI generates ephemeral keys</p>
              <p>Heartbeats register presence via Vercel</p>
              <p>Sender opens this site, sees nearby receivers</p>
              <p>Pairing code confirms identity on both devices</p>
              <p>WebRTC data channel establishes direct link</p>
              <p>Files transfer chunk by chunk, never touching a server</p>
              <p>SHA-256 verifies integrity</p>
            </div>
          </div>

          <div>
            <p className="text-gray-900 font-medium mb-1">Platforms</p>
            <p className="text-gray-500">macOS, Linux, Windows (receiver) · Any modern browser (sender)</p>
          </div>

          <p className="text-xs text-gray-300">MIT license · open source</p>
        </div>
      </div>
    </div>
  );
}
