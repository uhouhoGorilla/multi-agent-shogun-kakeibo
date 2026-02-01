'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CreditCard, Calendar, AlertCircle } from 'lucide-react'
import {
  getUpcomingLoanPayments,
  type UpcomingLoanPayment,
} from '@/lib/actions/dashboard'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getDaysLabel(days: number): { text: string; variant: 'default' | 'secondary' | 'destructive' } {
  if (days <= 0) {
    return { text: '本日', variant: 'destructive' }
  }
  if (days === 1) {
    return { text: '明日', variant: 'destructive' }
  }
  if (days <= 7) {
    return { text: `${days}日後`, variant: 'default' }
  }
  return { text: `${days}日後`, variant: 'secondary' }
}

export function UpcomingLoanPayments() {
  const [payments, setPayments] = useState<UpcomingLoanPayment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getUpcomingLoanPayments()
        setPayments(data)
      } catch (error) {
        console.error('Failed to fetch upcoming loan payments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            次回ローン返済
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          次回ローン返済
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              返済予定のローンはありません
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => {
              const daysInfo = getDaysLabel(payment.daysUntil)
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{payment.loanName}</span>
                      <Badge variant={daysInfo.variant} className="text-xs">
                        {daysInfo.text}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(payment.paymentDate)}</span>
                      <span>•</span>
                      <span>{payment.lenderName}</span>
                    </div>
                  </div>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
        {payments.length > 0 && payments.some((p) => p.daysUntil <= 7) && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                1週間以内に返済予定があります
              </span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/loans">
            ローン管理へ
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
