import { format, parseISO, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(dateString, formatStr = 'dd/MM/yyyy') {
  if (!dateString) return ''
  try {
    return format(parseISO(dateString), formatStr, { locale: es })
  } catch {
    return dateString
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function addDaysToDate(dateString, days) {
  const date = parseISO(dateString)
  return addDays(date, days).toISOString()
}

export function isDateBefore(dateString, compareDate = new Date()) {
  try {
    return parseISO(dateString) < compareDate
  } catch {
    return false
  }
}

export function getCurrentYear() {
  return new Date().getFullYear().toString()
}

export function getCurrentDateISO() {
  return new Date().toISOString()
}
