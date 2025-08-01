import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { AppLayout } from '@/components/layout/AppLayout'
import Script from 'next/script'

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

// Use system fonts for now until Geist is available
const systemMono = {
  variable: "--font-geist-mono"
}

export const metadata: Metadata = {
  title: 'RedPill VC - AI-Native Venture Capital Platform',
  description: 'AI-powered VC platform with deal flow management, portfolio tracking, and intelligent investment analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="extension-conflict-prevention" strategy="beforeInteractive">
          {`
          // Prevent wallet extension conflicts
          if (typeof window !== 'undefined') {
            const originalDefineProperty = Object.defineProperty;
            Object.defineProperty = function(obj, prop, descriptor) {
              if (prop === 'solana' || prop === 'ethereum' || prop === 'phantom') {
                console.log('Blocking wallet extension property:', prop);
                return obj;
              }
              return originalDefineProperty.call(this, obj, prop, descriptor);
            };
          }
          `}
        </Script>
      </head>
      <body className={`${inter.variable} ${systemMono.variable} antialiased font-sans`}>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
        </Providers>
      </body>
    </html>
  )
}