export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-shady-accent mb-8">Privacy</h1>

      <div className="space-y-6 text-shady-text text-sm leading-relaxed">
        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">What we store</h2>
          <p className="text-shady-muted mb-3">Nothing. SHADY does not store files, file names, file contents, transfer history, permanent machine identifiers, raw IP addresses, user accounts, or analytics identifiers.</p>
          <p className="text-shady-muted">While a receiver is active, it sends a heartbeat every 5 seconds containing only a random device ID, display name, public key, and session ID. This data is held in memory and expires 15 seconds after the last heartbeat.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Vercel&apos;s role</h2>
          <p className="text-shady-muted mb-3">Vercel handles temporary presence registration and WebRTC signaling. The Vercel server never sees file bytes, file names, or file contents.</p>
          <p className="text-shady-muted">Vercel may observe timing metadata and device-presence patterns necessary to operate the signaling service. We do not add additional analytics or tracking.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Network scope</h2>
          <p className="text-shady-muted mb-3">The server computes a network-scope identifier using HMAC-SHA256 of your normalized source IP with a server secret. This identifier is never returned to either client. It is used only to ensure that nearby discovery only shows receivers on the same network.</p>
          <p className="text-shady-muted">The raw source IP is never returned to either party.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">File transfer</h2>
          <p className="text-shady-muted">All files transfer directly between devices over WebRTC data channels, which are encrypted with DTLS. No file data passes through Vercel or any third-party server. Both peers may learn each other&apos;s network address through the WebRTC connection establishment process.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Telemetry</h2>
          <p className="text-shady-muted">Telemetry is disabled by default. No analytics are collected unless explicitly enabled by the user in settings.</p>
        </section>
      </div>
    </div>
  );
}
