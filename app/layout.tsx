import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Taekwon-Do Team Kaufungen Dashboard',
  description: 'Dashboard fuer Mitglieder und Pruefungsverwaltung',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
