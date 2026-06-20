import React from 'react'
import { cn } from '../../utils/cn'

const Input = React.forwardRef(({ 
  type = 'text',
  size = 'md',
  state = 'default',
  className = '',
  disabled = false,
  error,
  label,
  helperText,
  icon: Icon,
  ...props 
}, ref) => {
  const baseStyles = 'w-full rounded-lg border transition-base focus:outline-none disabled:bg-neutral-100 disabled:cursor-not-allowed'
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  }
  
  const states = {
    default: 'border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
    error: 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-200',
    success: 'border-success-500 focus:border-success-500 focus:ring-2 focus:ring-success-200',
  }
  
  const inputStyles = cn(
    baseStyles,
    sizes[size],
    states[state],
    Icon && 'pl-10',
    className
  )
  
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          {label}
          {props.required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon 
            size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
        )}
        <input
          ref={ref}
          type={type}
          className={inputStyles}
          disabled={disabled}
          {...props}
        />
      </div>
      {helperText && (
        <p className={cn('text-xs mt-1', error ? 'text-error-500' : 'text-neutral-500')}>
          {helperText}
        </p>
      )}
      {error && (
        <p className="text-xs text-error-500 mt-1">{error}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input
