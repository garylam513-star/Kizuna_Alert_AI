import type { Metadata, Viewport } from 'next';
import './globals.css';
import { DisasterProvider } from '@/context/DisasterContext';

export const metadata: Metadata = {
  title: 'Kizuna Alert AI - Japan Multilingual Disaster Copilot',
  description:
    'Real-time, AI-powered multilingual disaster guidance (Earthquake, Tsunami, Typhoon) across Japan for Foreign Travelers, Foreign Workers, and Local Japanese Residents.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kizuna Alert',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#dc2626',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col antialiased selection:bg-red-600 selection:text-white">
        <DisasterProvider>
          {children}
        </DisasterProvider>
      </body>
    </html>
  );
}
