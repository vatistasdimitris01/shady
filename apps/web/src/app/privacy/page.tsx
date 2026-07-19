export default function PrivacyPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-[320px]">
        <a href="/" className="text-zinc-700 text-xs hover:text-zinc-500 transition-colors mb-6 inline-block">← back</a>
        <h1 className="text-lg font-medium tracking-tight mb-1">privacy</h1>
        <p className="text-zinc-500 text-xs mb-8">nothing is stored</p>

        <div className="space-y-5 text-xs text-zinc-400 leading-relaxed">
          <div>
            <p className="text-zinc-200 font-medium mb-1">what we store</p>
            <p className="text-zinc-500">Nothing. No files, no names, no history, no analytics. While active, a receiver sends a heartbeat with a random ID and display name. This data expires 15 seconds after the last heartbeat.</p>
          </div>

          <div>
            <p className="text-zinc-200 font-medium mb-1">vercel</p>
            <p className="text-zinc-500">Handles temporary presence and signaling only. Never sees file contents. May observe timing metadata.</p>
          </div>

          <div>
            <p className="text-zinc-200 font-medium mb-1">transfer</p>
            <p className="text-zinc-500">All files transfer directly between devices over WebRTC DTLS. No file data passes through any server.</p>
          </div>

          <div>
            <p className="text-zinc-200 font-medium mb-1">telemetry</p>
            <p className="text-zinc-500">None. No analytics unless explicitly enabled.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
