export default function PrivacyPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <a href="/" className="text-xs text-gray-400 hover:text-gray-600 mb-6 inline-block">back</a>
        <h1 className="text-lg font-medium mb-1">Privacy</h1>
        <p className="text-sm text-gray-400 mb-8">Nothing is stored</p>

        <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
          <div>
            <p className="text-gray-900 font-medium mb-1">What we store</p>
            <p className="text-gray-500">Nothing. No files, no names, no history, no analytics. While active, a receiver sends a heartbeat with a random ID and display name. This data expires 15 seconds after the last heartbeat.</p>
          </div>

          <div>
            <p className="text-gray-900 font-medium mb-1">Location</p>
            <p className="text-gray-500">Your browser shares its approximate location (from GPS) to find nearby devices. The TUI shares an IP-based approximate location. Only currently active devices within 50 km can see each other. No location data is stored.</p>
          </div>

          <div>
            <p className="text-gray-900 font-medium mb-1">Transfers</p>
            <p className="text-gray-500">All files transfer directly between devices over WebRTC DTLS. No file data passes through any server.</p>
          </div>

          <div>
            <p className="text-gray-900 font-medium mb-1">Telemetry</p>
            <p className="text-gray-500">None. No analytics unless explicitly enabled.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
