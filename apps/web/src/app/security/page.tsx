export default function SecurityPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[320px]">
        <a href="/" className="text-zinc-700 text-xs hover:text-zinc-500 transition-colors mb-6 inline-block">← back</a>
        <h1 className="text-lg font-medium tracking-tight mb-1">security</h1>
        <p className="text-zinc-500 text-xs mb-8">how your files stay safe</p>

        <div className="space-y-5 text-xs text-zinc-400 leading-relaxed">
          {[
            ['encryption', 'WebRTC DTLS encrypts all data in transit. Only sender and receiver can read it.'],
            ['ephemeral keys', 'Each session generates fresh Ed25519 keys. Discarded when done.'],
            ['manual approval', 'Every connection requires explicit approval with a 6-digit code.'],
            ['one-time secrets', 'QR codes contain one-time secrets. The URL fragment never hits the server.'],
            ['file integrity', 'SHA-256 hash verified after transfer. Mismatches are rejected.'],
            ['path protection', 'File names are sanitized. No path traversal, no escaping the destination.'],
          ].map(([t, d]) => (
            <div key={t}>
              <p className="text-zinc-200 font-medium mb-1">{t}</p>
              <p className="text-zinc-500">{d}</p>
            </div>
          ))}

          <div>
            <p className="text-zinc-200 font-medium mb-1">honest claims</p>
            <ul className="text-zinc-600 space-y-0.5">
              <li>· WebRTC doesn't hide peer IPs from each other</li>
              <li>· Vercel can observe timing metadata</li>
              <li>· NAT/firewall may block direct connections</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
