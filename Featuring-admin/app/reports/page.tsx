'use client'

import Link from 'next/link'
import { FiEye, FiUsers, FiMessageCircle, FiUser } from 'react-icons/fi'

export default function ReportsMain() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-700">Gestión de Reportes</h1>
        <Link href="/" className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300">
          Volver al Menú Principal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/reports/watch" className="flex items-center justify-center p-6 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300">
          <FiEye className="mr-3" size={24} />
          <span className="text-xl font-semibold">Reportes Watch</span>
        </Link>
        <Link href="/reports/community" className="flex items-center justify-center p-6 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition duration-300">
          <FiUsers className="mr-3" size={24} />
          <span className="text-xl font-semibold">Reportes Comunidad</span>
        </Link>
        <Link href="/reports/chat" className="flex items-center justify-center p-6 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition duration-300">
          <FiMessageCircle className="mr-3" size={24} />
          <span className="text-xl font-semibold">Reportes Chat</span>
        </Link>
        <Link href="/reports/profiles" className="flex items-center justify-center p-6 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 transition duration-300">
          <FiUser className="mr-3" size={24} />
          <span className="text-xl font-semibold">Reportes Perfiles</span>
        </Link>
      </div>
    </div>
  )
}
