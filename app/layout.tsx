import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RAW Studios',
  description: 'Кабинет фотостудии',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={geist.className} style={{ margin: 0, padding: 0, background: '#FAF8F5' }}>
        {children}
      </body>
    </html>
  )
}