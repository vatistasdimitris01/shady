import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'shady',
  description: 'Send files to any terminal.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'shady' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#09090b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-zinc-950 text-zinc-50 antialiased">
        {children}
      </body>
    </html>
  );
}
