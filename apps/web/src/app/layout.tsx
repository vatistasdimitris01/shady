import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'shady — send files to any terminal',
  description: 'Send files from your browser to any nearby terminal. No cloud, no accounts.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'shady' },
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
      <body className="min-h-dvh bg-shady-bg text-shady-text antialiased overscroll-none">
        {children}
      </body>
    </html>
  );
}
