import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Featuring Admin Panel',
  description: 'Panel de administración para Featuring',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
