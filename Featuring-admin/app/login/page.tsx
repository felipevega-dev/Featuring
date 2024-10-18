'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push('/')
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-primary-700">Iniciar sesión</h1>
      <form onSubmit={handleLogin} className="w-full max-w-md bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="mb-4">
          <label htmlFor="email" className="block text-secondary-700 text-sm font-bold mb-2">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-primary-800 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-secondary-700 text-sm font-bold mb-2">Contraseña</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="shadow appearance-none border rounded w-full py-2 px-3 text-primary-800 mb-3 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300">
            Iniciar sesión
          </button>
          <Link href="/register" className="inline-block align-baseline font-bold text-sm text-primary-500 hover:text-primary-600">
            Registrarse
          </Link>
        </div>
      </form>
    </div>
  )
}
