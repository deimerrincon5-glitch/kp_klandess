import React from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { cn } from '../../utils/cn'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

const KPICard = React.forwardRef(({ 
  title,
  value,
  previousValue,
  trend,
  trendDirection = 'up',
  icon: Icon,
  sparklineData,
  className = '',
  ...props 
}, ref) => {
  const calculateTrend = () => {
    if (previousValue && value) {
      const percentChange = ((value - previousValue) / previousValue) * 100
      return percentChange.toFixed(1)
    }
    return trend || '0'
  }

  const trendValue = calculateTrend()
  const isPositive = parseFloat(trendValue) > 0
  const isNegative = parseFloat(trendValue) < 0
  const isNeutral = parseFloat(trendValue) === 0

  const trendColor = isPositive ? 'text-success-600' : isNegative ? 'text-error-600' : 'text-neutral-500'
  const trendBg = isPositive ? 'bg-success-100' : isNegative ? 'bg-error-100' : 'bg-neutral-100'
  const TrendIcon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus

  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-base transform hover:-translate-y-1',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-neutral-900">{value}</p>
        </div>
        {Icon && (
          <div className="bg-primary-100 p-3 rounded-lg">
            <Icon size={24} className="text-primary-600" />
          </div>
        )}
      </div>

      {(trendValue || sparklineData) && (
        <div className="flex items-center justify-between mt-4">
          {trendValue && (
            <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium', trendBg, trendColor)}>
              <TrendIcon size={14} />
              <span>{Math.abs(trendValue)}%</span>
            </div>
          )}
          
          {sparklineData && sparklineData.length > 0 && (
            <ResponsiveContainer width={100} height={40}>
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? '#22C55E' : isNegative ? '#EF4444' : '#737373'}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  )
})

KPICard.displayName = 'KPICard'

export default KPICard
