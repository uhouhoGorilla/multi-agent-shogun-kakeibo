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
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatCurrency } from '@/lib/utils/loan-calculator'
import type { PaymentRecord } from '@/lib/actions/loans'
import { History, Receipt } from 'lucide-react'

interface PaymentHistoryProps {
  payments: PaymentRecord[]
  className?: string
  maxHeight?: string
}

export function PaymentHistory({
  payments,
  className,
  maxHeight = '300px',
}: PaymentHistoryProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
  }

  if (payments.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            返済履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mb-2" />
            <p>返済履歴はありません</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          返済履歴
          <span className="text-sm font-normal text-muted-foreground">
            ({payments.length}件)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">返済日</TableHead>
                <TableHead className="text-right">返済額</TableHead>
                <TableHead className="text-right">元本</TableHead>
                <TableHead className="text-right">利息</TableHead>
                <TableHead>引落口座</TableHead>
                <TableHead>メモ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {formatDate(payment.payment_date)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {formatCurrency(payment.total_amount)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-blue-600 dark:text-blue-400">
                    {formatCurrency(payment.principal_amount)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-orange-600 dark:text-orange-400">
                    {formatCurrency(payment.interest_amount)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment.account_name || '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                    {payment.memo || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface PaymentHistoryCompactProps {
  payments: PaymentRecord[]
  limit?: number
  className?: string
}

export function PaymentHistoryCompact({
  payments,
  limit = 5,
  className,
}: PaymentHistoryCompactProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const displayPayments = payments.slice(0, limit)

  if (payments.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground text-center py-4">
          返済履歴はありません
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {displayPayments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between py-2 border-b last:border-0"
          >
            <div>
              <p className="text-sm font-medium">
                {formatDate(payment.payment_date)}
              </p>
              {payment.account_name && (
                <p className="text-xs text-muted-foreground">
                  {payment.account_name}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-mono font-medium">
                {formatCurrency(payment.total_amount)}
              </p>
              <p className="text-xs text-muted-foreground">
                元本 {formatCurrency(payment.principal_amount)}
              </p>
            </div>
          </div>
        ))}
      </div>
      {payments.length > limit && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          他 {payments.length - limit}件
        </p>
      )}
    </div>
  )
}
