import React, { useEffect, useState } from 'react'
import { CandlestickChart } from 'lucide-react'

export default function SplashScreen({ onComplete }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onComplete, 300)
    }, 1500)

    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-amber-50 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-amber-600 p-6 rounded-full">
            <CandlestickChart size={64} className="text-white" />
          </div>
        </div>
        <h1 className="font-playfair text-4xl font-bold text-amber-900 mb-2">
          Velas Artesanales
        </h1>
        <p className="text-amber-600 text-lg">Sistema de Gestión</p>
        <div className="mt-8">
          <div className="w-48 h-1 bg-amber-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-amber-600 rounded-full animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
