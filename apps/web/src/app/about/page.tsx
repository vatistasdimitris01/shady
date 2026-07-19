export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-shady-accent mb-3">SHADY</h1>
        <p className="text-shady-muted text-lg italic">A suspiciously fast local drop.</p>
      </div>

      <div className="space-y-6 text-shady-text text-sm leading-relaxed">
        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">What is SHADY?</h2>
          <p className="text-shady-muted">SHADY lets any nearby browser send files directly to your terminal. Start the receiver on your computer, scan its QR code or find it on this web app, approve the connection, and transfer files peer-to-peer.</p>
          <p className="text-shady-muted mt-2">Vercel coordinates discovery and signaling, but file contents never pass through the cloud.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Architecture</h2>
          <div className="text-shady-muted space-y-2">
            <p><span className="text-shady-accent font-bold">1.</span> TUI starts a receiver, generates ephemeral keys</p>
            <p><span className="text-shady-accent font-bold">2.</span> Heartbeats register presence with Vercel every 5 seconds</p>
            <p><span className="text-shady-accent font-bold">3.</span> Sender opens this website, sees nearby receivers</p>
            <p><span className="text-shady-accent font-bold">4.</span> Sender selects a receiver, a pairing code appears on both devices</p>
            <p><span className="text-shady-accent font-bold">5.</span> Receiver approves the connection</p>
            <p><span className="text-shady-accent font-bold">6.</span> WebRTC data channel establishes a direct encrypted link</p>
            <p><span className="text-shady-accent font-bold">7.</span> Files transfer directly, chunk by chunk, never touching a server</p>
            <p><span className="text-shady-accent font-bold">8.</span> Receiver verifies SHA-256 integrity and saves to disk</p>
          </div>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Supported platforms</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-shady-muted">
            <div>• macOS (TUI receiver)</div>
            <div>• Linux (TUI receiver)</div>
            <div>• Windows (TUI receiver)</div>
            <div>• Any modern browser (sender)</div>
            <div>• Chrome / Edge / Safari / Firefox</div>
            <div>• Mobile browsers supported</div>
          </div>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Open source</h2>
          <p className="text-shady-muted">SHADY is open source under the MIT license. Contributions are welcome. The protocol is documented and versioned independently from the interfaces.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Protocol</h2>
          <p className="text-shady-muted">Version: 1.0.0</p>
          <p className="text-shady-muted mt-1">Transport: WebRTC data channels (DTLS encrypted)</p>
          <p className="text-shady-muted">Chunk size: 256 KiB (adaptive)</p>
          <p className="text-shady-muted">Integrity: SHA-256 per file</p>
        </section>
      </div>
    </div>
  );
}
