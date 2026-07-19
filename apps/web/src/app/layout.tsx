import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SHADY — A suspiciously fast local drop',
  description: 'Send files directly to any nearby terminal. No cloud, no accounts, no fuss.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-shady-bg text-shady-text grid-bg antialiased">
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-shady-border px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <a href="/" className="flex items-center gap-3">
                <span className="text-shady-accent font-bold text-xl tracking-tight">SHADY</span>
                <span className="text-shady-muted text-sm hidden sm:inline">A suspiciously fast local drop.</span>
              </a>
              <nav className="flex items-center gap-4 text-sm">
                <a href="/setup" className="text-shady-accent hover:text-shady-accent-dim transition-colors font-bold">Setup</a>
                <a href="/privacy" className="text-shady-muted hover:text-shady-text transition-colors">Privacy</a>
                <a href="/security" className="text-shady-muted hover:text-shady-text transition-colors">Security</a>
                <a href="/about" className="text-shady-muted hover:text-shady-text transition-colors">About</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-shady-border px-6 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-shady-muted">
              <span>SHADY v0.1.0</span>
              <span>Files transfer directly. No server storage.</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-shady-accent animate-pulse-dot"></span>
                P2P
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
