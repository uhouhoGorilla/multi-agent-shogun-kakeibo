'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { BarChart3, PieChart as PieChartIcon } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  getIncomeExpenseHistory,
  getCategoryBreakdown,
  type IncomeExpenseHistory,
  type CategoryBreakdown,
} from '@/lib/actions/dashboard'

function formatCurrency(value: number): string {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(0)}万`
  }
  return `¥${value.toLocaleString()}`
}

function IncomeExpenseChart({ data }: { data: IncomeExpenseHistory[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={formatCurrency}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [`¥${(value as number).toLocaleString()}`, '']}
          labelStyle={{ fontWeight: 'bold' }}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Bar
          dataKey="income"
          name="収入"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name="支出"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

function CategoryPieChart({ data }: { data: CategoryBreakdown[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="amount"
          nameKey="category"
          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            `¥${(value as number).toLocaleString()}`,
            name,
          ]}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function CategoryLegend({ data }: { data: CategoryBreakdown[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {data.slice(0, 6).map((item) => (
        <div key={item.category} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground truncate">{item.category}</span>
          <span className="font-medium ml-auto">{item.percentage}%</span>
        </div>
      ))}
    </div>
  )
}

function LoadingChart() {
  return (
    <div className="flex h-[250px] items-center justify-center">
      <div className="animate-pulse text-muted-foreground">読み込み中...</div>
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[250px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function ChartsPlaceholder() {
  const [historyData, setHistoryData] = useState<IncomeExpenseHistory[]>([])
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [history, categories] = await Promise.all([
          getIncomeExpenseHistory(),
          getCategoryBreakdown(),
        ])
        setHistoryData(history)
        setCategoryData(categories)
      } catch (error) {
        console.error('Failed to fetch chart data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 収支推移グラフ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            収支推移
          </CardTitle>
          <CardDescription>過去6ヶ月の収入・支出の推移</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingChart />
          ) : historyData.length > 0 ? (
            <IncomeExpenseChart data={historyData} />
          ) : (
            <EmptyChart message="データがありません" />
          )}
        </CardContent>
      </Card>

      {/* カテゴリ別円グラフ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            カテゴリ別支出
          </CardTitle>
          <CardDescription>今月のカテゴリ別支出割合</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingChart />
          ) : categoryData.length > 0 ? (
            <>
              <CategoryPieChart data={categoryData} />
              <CategoryLegend data={categoryData} />
            </>
          ) : (
            <EmptyChart message="データがありません" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
