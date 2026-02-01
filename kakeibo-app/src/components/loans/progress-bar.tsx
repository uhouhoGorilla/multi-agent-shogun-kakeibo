'use client'

import { Progress } from '@/components/ui/progress'
import { formatCurrency, formatPercent } from '@/lib/utils/loan-calculator'
import { cn } from '@/lib/utils'

interface LoanProgressBarProps {
  principalAmount: number
  currentBalance: number
  className?: string
  showLabels?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LoanProgressBar({
  principalAmount,
  currentBalance,
  className,
  showLabels = true,
  size = 'md',
}: LoanProgressBarProps) {
  const paidAmount = principalAmount - currentBalance
  const progressPercentage = principalAmount > 0
    ? Math.round((paidAmount / principalAmount) * 1000) / 10
    : 0

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  const indicatorColor = progressPercentage >= 100
    ? 'bg-green-500'
    : progressPercentage >= 75
    ? 'bg-emerald-500'
    : progressPercentage >= 50
    ? 'bg-blue-500'
    : progressPercentage >= 25
    ? 'bg-yellow-500'
    : 'bg-orange-500'

  return (
    <div className={cn('space-y-2', className)}>
      {showLabels && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">返済進捗</span>
          <span className="font-medium">{formatPercent(progressPercentage)}</span>
        </div>
      )}
      <Progress
        value={progressPercentage}
        max={100}
        className={sizeClasses[size]}
        indicatorClassName={indicatorColor}
      />
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>返済済: {formatCurrency(paidAmount)}</span>
          <span>残高: {formatCurrency(currentBalance)}</span>
        </div>
      )}
    </div>
  )
}

interface CompactProgressProps {
  percentage: number
  className?: string
}

export function CompactProgress({ percentage, className }: CompactProgressProps) {
  const indicatorColor = percentage >= 100
    ? 'bg-green-500'
    : percentage >= 75
    ? 'bg-emerald-500'
    : percentage >= 50
    ? 'bg-blue-500'
    : 'bg-orange-500'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Progress
        value={percentage}
        max={100}
        className="h-2 flex-1"
        indicatorClassName={indicatorColor}
      />
      <span className="text-xs font-medium w-12 text-right">
        {formatPercent(percentage)}
      </span>
    </div>
  )
}
