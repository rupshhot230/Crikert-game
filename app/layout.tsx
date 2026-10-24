import { Analytics } from '@vercel/analytics/next'
import { Outfit, Geist_Mono } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'CRIKERT — The game. In your hands.',
  description: 'Step up to the crease in a playable 3D cricket game. Chase runs for Pakistan against India with timed batting, lofted shots, and a live broadcast scoreboard. Play instantly with keyboard or touch.',
}
export const viewport: Viewport = { colorScheme: 'dark', themeColor: '#101b23' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`bg-background ${outfit.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
