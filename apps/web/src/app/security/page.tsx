export default function SecurityPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-shady-accent mb-8">Security</h1>

      <div className="space-y-6 text-shady-text text-sm leading-relaxed">
        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">End-to-end encryption</h2>
          <p className="text-shady-muted">All file transfers use WebRTC data channels secured with DTLS encryption. Data is encrypted on the sender and decrypted only on the receiver. No intermediary can read the file contents.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Ephemeral identity</h2>
          <p className="text-shady-muted">Each SHADY session generates a fresh Ed25519 identity key. When the session ends, the key is discarded. No permanent machine identity is ever created or stored.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Manual approval</h2>
          <p className="text-shady-muted">Every incoming connection requires explicit approval from the receiver. A 6-digit pairing code is displayed on both devices and must be visually confirmed by the user. Nearby discovery never bypasses this approval step.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">One-time secrets</h2>
          <p className="text-shady-muted">QR codes contain a one-time secret placed after the URL fragment (#). The fragment is never sent to the server during the initial HTTP request. After successful pairing, the secret is rotated. Expired or used secrets are rejected.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">File integrity</h2>
          <p className="text-shady-muted">Every file is hashed with SHA-256 before transfer. The receiver verifies the hash after all chunks arrive. If the hash does not match, the file is rejected and the incomplete file is cleaned up automatically.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">Path traversal protection</h2>
          <p className="text-shady-muted">Received file names are sanitized. Path components like <code className="bg-shady-bg px-1 rounded">../</code>, absolute paths, Windows drive prefixes, null bytes, reserved device names, and hidden control characters are stripped. Files cannot escape the configured destination directory.</p>
        </section>

        <section className="bg-shady-surface border border-shady-border rounded-xl p-6">
          <h2 className="text-lg font-bold mb-3">What we don&apos;t claim</h2>
          <ul className="text-shady-muted space-y-1.5">
            <li>• WebRTC does not hide peer IP addresses from each other</li>
            <li>• Vercel can observe timing and device-presence metadata</li>
            <li>• Restrictive NAT/firewall configs can prevent direct connections</li>
            <li>• No system provides complete anonymity</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
