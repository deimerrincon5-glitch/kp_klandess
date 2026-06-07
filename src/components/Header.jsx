import React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bell, Settings } from 'lucide-react'

export default function Header({ companyName, alertsCount }) {
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })

  return (
    <header className="h-16 bg-white border-b border-amber-200 px-6 flex items-center justify-between">
      <div>
        <h2 className="font-playfair text-2xl font-semibold text-amber-900">{companyName}</h2>
        <p className="text-sm text-amber-600">{today}</p>
      </div>

      <div className="flex items-center gap-4">
        {alertsCount > 0 && (
          <div className="relative">
            <Bell className="text-amber-600" size={24} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {alertsCount}
            </span>
          </div>
        )}
        <button className="p-2 hover:bg-amber-50 rounded-lg transition-colors">
          <Settings className="text-amber-600" size={24} />
        </button>
      </div>
    </header>
  )
}
