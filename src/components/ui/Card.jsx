import React from 'react'
import { cn } from '../../utils/cn'

const Card = React.forwardRef(({ 
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  ...props 
}, ref) => {
  const baseStyles = 'rounded-lg transition-base'
  
  const variants = {
    default: 'bg-white shadow-sm',
    elevated: 'bg-white shadow-md',
    bordered: 'bg-white border border-neutral-200',
    filled: 'bg-neutral-100',
  }
  
  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        baseStyles,
        variants[variant],
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

const CardHeader = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 mb-4', className)}
    {...props}
  >
    {children}
  </div>
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-heading font-semibold text-neutral-900 text-lg', className)}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-500', className)}
    {...props}
  >
    {children}
  </p>
))
CardDescription.displayName = 'CardDescription'

const CardBody = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('', className)}
    {...props}
  >
    {children}
  </div>
))
CardBody.displayName = 'CardBody'

const CardFooter = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 mt-4 border-t border-neutral-200', className)}
    {...props}
  >
    {children}
  </div>
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter }
