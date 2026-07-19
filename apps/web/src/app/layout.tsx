import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SHADY — A suspiciously fast local drop',
  description: 'Send files directly to any nearby terminal. No cloud, no accounts, no fuss.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SHADY',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-shady-bg text-shady-text grid-bg antialiased overscroll-none">
        <div className="min-h-screen min-h-dvh flex flex-col">
          <header className="border-b border-shady-border px-4 sm:px-6 py-3">
            <div className="max-w-lg mx-auto flex items-center justify-between">
              <a href="/" className="font-bold text-lg text-shady-accent tracking-tight">SHADY</a>
              <nav className="flex items-center gap-3 text-xs sm:text-sm">
                <a href="/setup" className="text-shady-accent font-bold">Setup</a>
                <a href="/privacy" className="text-shady-muted hover:text-shady-text transition-colors">Privacy</a>
                <a href="/security" className="text-shady-muted hover:text-shady-text transition-colors hidden sm:inline">Security</a>
                <a href="/about" className="text-shady-muted hover:text-shady-text transition-colors">About</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-shady-border px-4 py-3">
            <div className="max-w-lg mx-auto flex items-center justify-between text-[10px] sm:text-xs text-shady-muted">
              <span>v0.1.0</span>
              <span className="hidden sm:inline">No files pass through any server.</span>
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
