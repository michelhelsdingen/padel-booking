'use client'

import { useState, useEffect } from 'react'
import { Lock, Shield, AlertCircle } from 'lucide-react'

interface PinProtectionProps {
  children: React.ReactNode
}

export default function PinProtection({ children }: PinProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const correctPin = '7131'
  const maxAttempts = 3

  useEffect(() => {
    // Check if user is already authenticated (stored in sessionStorage)
    const authStatus = sessionStorage.getItem('admin_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (pin === correctPin) {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_authenticated', 'true')
      setError('')
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPin('')
      
      if (newAttempts >= maxAttempts) {
        setError(`Te veel pogingen. Probeer het over 5 minuten opnieuw.`)
        setTimeout(() => {
          setAttempts(0)
          setError('')
        }, 5 * 60 * 1000) // 5 minutes
      } else {
        setError(`Onjuiste PIN code. ${maxAttempts - newAttempts} pogingen over.`)
      }
    }
  }

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4) // Only numbers, max 4 digits
    setPin(value)
    if (error && value.length === 0) {
      setError('')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_authenticated')
    setPin('')
    setError('')
    setAttempts(0)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Toegang</h1>
              <p className="text-gray-600">Voer de PIN code in om door te gaan</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  PIN Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={handlePinChange}
                    placeholder="••••"
                    disabled={attempts >= maxAttempts}
                    className={`pl-10 w-full px-4 py-3 border rounded-lg text-center text-xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      error 
                        ? 'border-red-300 bg-red-50' 
                        : 'border-gray-300'
                    } ${
                      attempts >= maxAttempts 
                        ? 'bg-gray-100 cursor-not-allowed' 
                        : ''
                    }`}
                    maxLength={4}
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={pin.length !== 4 || attempts >= maxAttempts}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {attempts >= maxAttempts ? 'Geblokkeerd' : 'Toegang Verkrijgen'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Toegang beperkt tot geautoriseerd personeel
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Logout button in top right */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
        >
          Uitloggen
        </button>
      </div>
      {children}
    </div>
  )
}