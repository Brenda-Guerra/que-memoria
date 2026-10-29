import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'

import { SomGlobal } from '@/components/Som'

import './globals.css'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '700', '800'],
})

const corpo = DM_Sans({
  subsets: ['latin'],
  variable: '--font-corpo',
})

export const metadata: Metadata = {
  title: 'Que memória?',
  description: 'Jogo da memória multiplayer: crie uma sala, escolha o tema e ache os pares',
}

export const viewport: Viewport = {
  themeColor: '#f6efe1',
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable}`}>
      <body>
        <SomGlobal />
        {children}
      </body>
    </html>
  )
}
