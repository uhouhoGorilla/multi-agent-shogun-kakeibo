'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/utils/loan-calculator'
import type { RepaymentScheduleItem } from '@/lib/utils/loan-calculator'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RepaymentScheduleProps {
  items: RepaymentScheduleItem[]
  className?: string
  maxHeight?: string
}

export function RepaymentSchedule({
  items,
  className,
  maxHeight = '400px',
}: RepaymentScheduleProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}/${date.getMonth() + 1}`
  }

  const today = new Date()
  const currentMonthStr = `${today.getFullYear()}/${today.getMonth() + 1}`

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          返済スケジュール
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">回</TableHead>
                <TableHead className="w-[100px]">返済月</TableHead>
                <TableHead className="text-right">返済額</TableHead>
                <TableHead className="text-right">元本</TableHead>
                <TableHead className="text-right">利息</TableHead>
                <TableHead className="text-right">残高</TableHead>
                <TableHead className="w-[60px] text-center">状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const monthStr = formatDate(item.date)
                const isCurrent = monthStr === currentMonthStr

                return (
                  <TableRow
                    key={item.month}
                    className={cn(
                      isCurrent && 'bg-primary/5 font-medium',
                      item.isPaid && 'text-muted-foreground'
                    )}
                  >
                    <TableCell className="font-medium">{item.month}</TableCell>
                    <TableCell>
                      {monthStr}
                      {isCurrent && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          今月
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.payment)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-blue-600 dark:text-blue-400">
                      {formatCurrency(item.principal)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-orange-600 dark:text-orange-400">
                      {formatCurrency(item.interest)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.balance)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isPaid ? (
                        <CheckCircle2 className="h-4 w-4 mx-auto text-green-500" />
                      ) : (
                        <Circle className="h-4 w-4 mx-auto text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface RepaymentSummaryProps {
  totalPayment: number
  totalInterest: number
  completedPayments: number
  remainingPayments: number
  className?: string
}

export function RepaymentSummary({
  totalPayment,
  totalInterest,
  completedPayments,
  remainingPayments,
  className,
}: RepaymentSummaryProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">返済サマリー</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">総返済額</p>
            <p className="text-xl font-bold">{formatCurrency(totalPayment)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">総利息額</p>
            <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(totalInterest)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">返済済み回数</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {completedPayments}回
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">残り回数</p>
            <p className="text-xl font-bold">
              {remainingPayments}回
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
