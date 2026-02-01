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
import { ArrowRight, Receipt } from 'lucide-react'
import {
  getRecentTransactions,
  type RecentTransaction,
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

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getRecentTransactions(10)
        setTransactions(data)
      } catch (error) {
        console.error('Failed to fetch recent transactions:', error)
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
          <CardTitle>直近の取引</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b pb-3">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-5 w-20 bg-muted animate-pulse rounded" />
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
        <CardTitle>直近の取引</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Receipt className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              取引がありません
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">
                    {transaction.description || '(説明なし)'}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatDate(transaction.date)}</span>
                    <span>•</span>
                    <span>{transaction.category}</span>
                  </div>
                </div>
                <span
                  className={`font-semibold ${
                    transaction.type === 'income'
                      ? 'text-green-600'
                      : transaction.type === 'expense'
                      ? 'text-red-600'
                      : 'text-blue-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/transactions">
            もっと見る
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
