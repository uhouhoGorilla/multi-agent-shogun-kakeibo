'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from 'lucide-react'
import { getDashboardSummary, type DashboardSummary } from '@/lib/actions/dashboard'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

function ChangeIndicator({ change, label }: { change: number; label: string }) {
  const isPositive = change >= 0
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
        {formatChange(change)}
      </span>
      <span>{label}</span>
    </p>
  )
}

export function SummaryCards() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const summary = await getDashboardSummary()
        setData(summary)
      } catch (error) {
        console.error('Failed to fetch dashboard summary:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 今月の収入 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月の収入</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(data.income)}
          </div>
          <ChangeIndicator change={data.incomeChange} label="先月比" />
        </CardContent>
      </Card>

      {/* 今月の支出 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月の支出</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(data.expense)}
          </div>
          <ChangeIndicator change={-data.expenseChange} label="先月比" />
        </CardContent>
      </Card>

      {/* 今月の残高 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月の残高</CardTitle>
          <Wallet className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${data.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(data.balance)}
          </div>
          <p className="text-xs text-muted-foreground">
            先月: {formatCurrency(data.previousMonthBalance)}
          </p>
        </CardContent>
      </Card>

      {/* 前月比 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">前月比</CardTitle>
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              data.balanceChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatChange(data.balanceChange)}
          </div>
          <p className="text-xs text-muted-foreground">
            {data.balanceChange >= 0 ? '改善' : '悪化'}（残高の変動）
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
