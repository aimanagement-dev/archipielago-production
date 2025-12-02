import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import ProtectedLayout from '@/components/Layout/ProtectedLayout'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'Archipiélago | Production OS',
  description: 'AI-Powered Film Production Management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-background text-foreground overflow-hidden`}>
        <ProtectedLayout>
          {children}
        </ProtectedLayout>
      </body>
    </html>
  )
}
