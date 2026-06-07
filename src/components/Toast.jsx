import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import { cn } from '../utils/cn'

export default function Toast({ toast, onClose }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle
  }

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500'
  }

  const Icon = icons[toast.type]

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white min-w-300 animate-slide-in',
      colors[toast.type]
    )}>
      <Icon size={20} />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="hover:opacity-80 transition-opacity"
      >
        <X size={18} />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  )
}
