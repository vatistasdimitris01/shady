export default function SecurityPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <a href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-6 inline-block">back</a>
        <h1 className="text-lg font-medium mb-1">Security</h1>
        <p className="text-sm text-gray-400 mb-8">How your files stay safe</p>

        <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
          {[
            ['Encryption', 'WebRTC DTLS encrypts all data in transit. Only sender and receiver can read it.'],
            ['Ephemeral keys', 'Each session generates fresh Ed25519 keys. Discarded when done.'],
            ['Manual approval', 'Every connection requires approval with a 6-digit code.'],
            ['One-time secrets', 'QR codes contain one-time secrets. The URL fragment never hits the server.'],
            ['File integrity', 'SHA-256 hash verified after transfer. Mismatches are rejected.'],
            ['Path protection', 'File names are sanitized. No path traversal.'],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="text-gray-900 font-medium mb-1">{t}</p>
              <p className="text-gray-500">{d}</p>
            </div>
          ))}

          <div>
            <p className="text-gray-900 font-medium mb-1">Honest claims</p>
            <div className="text-gray-400 space-y-0.5 text-xs">
              <p>· WebRTC does not hide peer IPs from each other</p>
              <p>· Vercel can observe timing metadata</p>
              <p>· NAT/firewall may block direct connections</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
