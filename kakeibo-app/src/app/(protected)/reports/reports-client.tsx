'use client'

import { useState, useTransition } from 'react'
import { format, subMonths, addMonths } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  FileText,
  Calendar as CalendarIcon,
  Printer,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  getMonthlyReport,
  getCategoryReport,
  getPeriodReport,
  type MonthlyReport,
  type CategoryReport,
  type PeriodReport,
} from '@/lib/actions/reports'

interface ReportsClientProps {
  initialMonthlyReport: MonthlyReport
  categories: { id: string; name: string; type: string }[]
  initialYear: number
  initialMonth: number
}

const COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ReportsClient({
  initialMonthlyReport,
  categories,
  initialYear,
  initialMonth,
}: ReportsClientProps) {
  const [isPending, startTransition] = useTransition()

  // Monthly report state
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const [monthlyReport, setMonthlyReport] = useState(initialMonthlyReport)

  // Category report state
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [categoryStartDate, setCategoryStartDate] = useState<Date>(
    subMonths(new Date(), 1)
  )
  const [categoryEndDate, setCategoryEndDate] = useState<Date>(new Date())
  const [categoryReport, setCategoryReport] = useState<CategoryReport | null>(null)

  // Period report state
  const [periodStartDate, setPeriodStartDate] = useState<Date>(
    subMonths(new Date(), 1)
  )
  const [periodEndDate, setPeriodEndDate] = useState<Date>(new Date())
  const [periodReport, setPeriodReport] = useState<PeriodReport | null>(null)

  // Monthly navigation
  const handlePrevMonth = () => {
    const newDate = subMonths(new Date(year, month - 1), 1)
    const newYear = newDate.getFullYear()
    const newMonth = newDate.getMonth() + 1
    setYear(newYear)
    setMonth(newMonth)
    startTransition(async () => {
      const report = await getMonthlyReport(newYear, newMonth)
      setMonthlyReport(report)
    })
  }

  const handleNextMonth = () => {
    const newDate = addMonths(new Date(year, month - 1), 1)
    const newYear = newDate.getFullYear()
    const newMonth = newDate.getMonth() + 1
    setYear(newYear)
    setMonth(newMonth)
    startTransition(async () => {
      const report = await getMonthlyReport(newYear, newMonth)
      setMonthlyReport(report)
    })
  }

  // Category report
  const handleCategorySearch = () => {
    if (!selectedCategory) return
    startTransition(async () => {
      const report = await getCategoryReport(
        selectedCategory === 'uncategorized' ? null : selectedCategory,
        format(categoryStartDate, 'yyyy-MM-dd'),
        format(categoryEndDate, 'yyyy-MM-dd')
      )
      setCategoryReport(report)
    })
  }

  // Period report
  const handlePeriodSearch = () => {
    startTransition(async () => {
      const report = await getPeriodReport(
        format(periodStartDate, 'yyyy-MM-dd'),
        format(periodEndDate, 'yyyy-MM-dd')
      )
      setPeriodReport(report)
    })
  }

  // Print
  const handlePrint = () => {
    window.print()
  }

  // Chart data for daily balances
  const dailyChartData = monthlyReport.dailyBalances.map((d) => ({
    date: format(new Date(d.date), 'd日'),
    収入: d.income,
    支出: d.expense,
  }))

  // Pie chart data for categories
  const expenseCategories = monthlyReport.categoryBreakdown.filter(
    (c) => c.type === 'expense'
  )

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">レポート</h1>
          <p className="text-muted-foreground">収支の分析・集計</p>
        </div>
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" />
          印刷
        </Button>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList className="print:hidden">
          <TabsTrigger value="monthly">月次レポート</TabsTrigger>
          <TabsTrigger value="category">カテゴリ別</TabsTrigger>
          <TabsTrigger value="period">期間指定</TabsTrigger>
        </TabsList>

        {/* Monthly Report Tab */}
        <TabsContent value="monthly" className="space-y-4">
          {/* Month Selector */}
          <div className="flex items-center justify-center gap-4 print:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevMonth}
              disabled={isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold min-w-[150px] text-center">
              {format(new Date(year, month - 1), 'yyyy年M月', { locale: ja })}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              disabled={isPending}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Print header */}
          <div className="hidden print:block text-center mb-4">
            <h2 className="text-xl font-bold">{monthlyReport.summary.month} 収支レポート</h2>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">収入</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(monthlyReport.summary.totalIncome)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">支出</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(monthlyReport.summary.totalExpense)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">収支</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    monthlyReport.summary.balance >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  )}
                >
                  {formatCurrency(monthlyReport.summary.balance)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Daily Chart */}
          <Card className="print:break-inside-avoid">
            <CardHeader>
              <CardTitle>日別収支</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Bar dataKey="収入" fill="#22c55e" />
                    <Bar dataKey="支出" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Category Breakdown Pie Chart */}
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle>支出カテゴリ内訳</CardTitle>
              </CardHeader>
              <CardContent>
                {expenseCategories.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseCategories}
                          dataKey="amount"
                          nameKey="categoryName"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name} (${((percent || 0) * 100).toFixed(1)}%)`
                          }
                          labelLine={false}
                        >
                          {expenseCategories.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => formatCurrency(value as number)}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    データがありません
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Breakdown Table */}
            <Card className="print:break-inside-avoid">
              <CardHeader>
                <CardTitle>カテゴリ別集計</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                      <TableHead className="text-right">割合</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyReport.categoryBreakdown.map((cat) => (
                      <TableRow key={cat.categoryId || 'uncategorized'}>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-block w-2 h-2 rounded-full mr-2',
                              cat.type === 'income'
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            )}
                          />
                          {cat.categoryName}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(cat.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {cat.percentage}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Top Expenses */}
          <Card className="print:break-inside-avoid">
            <CardHeader>
              <CardTitle>高額支出 TOP5</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead>カテゴリ</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyReport.topExpenses.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {format(new Date(expense.date), 'M/d')}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Report Tab */}
        <TabsContent value="category" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>カテゴリ別レポート</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">カテゴリ</label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="カテゴリを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">未分類</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">開始日</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[150px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(categoryStartDate, 'yyyy/MM/dd')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={categoryStartDate}
                        onSelect={(date) => date && setCategoryStartDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">終了日</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[150px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(categoryEndDate, 'yyyy/MM/dd')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={categoryEndDate}
                        onSelect={(date) => date && setCategoryEndDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button onClick={handleCategorySearch} disabled={isPending || !selectedCategory}>
                  <FileText className="mr-2 h-4 w-4" />
                  集計
                </Button>
              </div>
            </CardContent>
          </Card>

          {categoryReport && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {categoryReport.categoryName} の集計結果
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">期間</p>
                      <p className="text-lg font-medium">
                        {format(new Date(categoryReport.startDate), 'yyyy/MM/dd')} 〜{' '}
                        {format(new Date(categoryReport.endDate), 'yyyy/MM/dd')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">取引件数</p>
                      <p className="text-lg font-medium">
                        {categoryReport.transactionCount}件
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">合計金額</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(categoryReport.totalAmount)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>取引一覧</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>日付</TableHead>
                        <TableHead>内容</TableHead>
                        <TableHead>口座</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryReport.transactions.map((txn) => (
                        <TableRow key={txn.id}>
                          <TableCell>
                            {format(new Date(txn.date), 'yyyy/MM/dd')}
                          </TableCell>
                          <TableCell>{txn.description}</TableCell>
                          <TableCell>{txn.accountName || '-'}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(txn.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Period Report Tab */}
        <TabsContent value="period" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>期間指定レポート</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium">開始日</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[150px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(periodStartDate, 'yyyy/MM/dd')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={periodStartDate}
                        onSelect={(date) => date && setPeriodStartDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">終了日</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[150px]">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(periodEndDate, 'yyyy/MM/dd')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={periodEndDate}
                        onSelect={(date) => date && setPeriodEndDate(date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button onClick={handlePeriodSearch} disabled={isPending}>
                  <FileText className="mr-2 h-4 w-4" />
                  集計
                </Button>
              </div>
            </CardContent>
          </Card>

          {periodReport && (
            <>
              {/* Period Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">期間</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {format(new Date(periodReport.startDate), 'yyyy/MM/dd')}
                      <br />〜 {format(new Date(periodReport.endDate), 'yyyy/MM/dd')}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">収入</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(periodReport.summary.totalIncome)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">支出</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-red-600">
                      {formatCurrency(periodReport.summary.totalExpense)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">収支</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p
                      className={cn(
                        'text-xl font-bold',
                        periodReport.summary.balance >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {formatCurrency(periodReport.summary.balance)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Period Daily Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>日別収支</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={periodReport.dailyBalances.map((d) => ({
                          date: format(new Date(d.date), 'M/d'),
                          収入: d.income,
                          支出: d.expense,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          formatter={(value) => formatCurrency(value as number)}
                        />
                        <Bar dataKey="収入" fill="#22c55e" />
                        <Bar dataKey="支出" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Period Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>カテゴリ別集計</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>カテゴリ</TableHead>
                        <TableHead>タイプ</TableHead>
                        <TableHead className="text-right">件数</TableHead>
                        <TableHead className="text-right">金額</TableHead>
                        <TableHead className="text-right">割合</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periodReport.categoryBreakdown.map((cat) => (
                        <TableRow key={cat.categoryId || 'uncategorized'}>
                          <TableCell>{cat.categoryName}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'px-2 py-1 rounded text-xs',
                                cat.type === 'income'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              )}
                            >
                              {cat.type === 'income' ? '収入' : '支出'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{cat.count}件</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(cat.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {cat.percentage}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:space-y-4 > * + * {
            margin-top: 1rem;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
