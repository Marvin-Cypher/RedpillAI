import type { Metadata } from "next"
import { Hubot_Sans, Mona_Sans } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"
import { Providers } from "./providers"
import Script from 'next/script'

const hubot_sans = Hubot_Sans({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--display-family',
})

const mona_sans = Mona_Sans({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--text-family',
})

export const metadata: Metadata = {
  title: 'RedPill VC - AI-Native Venture Capital Platform',
  description: 'AI-powered VC platform with deal flow management, portfolio tracking, and intelligent investment analysis',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
      <body className={`${hubot_sans.variable} ${mona_sans.variable} antialiased font-text group/body`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
