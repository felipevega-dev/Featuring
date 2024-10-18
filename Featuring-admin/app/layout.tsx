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
      <body className={`${inter.className} bg-general-100 text-primary-800 min-h-screen flex flex-col`}>
        <header className="bg-primary-700 text-white p-4">
          <h1 className="text-2xl font-bold">Panel de Administración Featuring</h1>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-primary-700 text-white p-4 text-center">
          <p>&copy; 2025 Featuring. Todos los derechos reservados.</p>
        </footer>
      </body>
    </html>
  )
}
