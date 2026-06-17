import type { Metadata, Viewport } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Taekwon-Do Team Kaufungen Dashboard',
  description: 'Dashboard fuer Mitglieder und Pruefungsverwaltung',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TKD Dashboard',
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: '#111110',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
