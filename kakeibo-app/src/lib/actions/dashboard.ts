'use server'

import { createClient } from '@/lib/supabase/server'
import { isDevMode } from '@/lib/mock-user'
import { getMockTransactions, mockCategories } from '@/lib/mock-data/transactions'
import { getMockLoans } from '@/lib/mock-data/loans'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface DashboardSummary {
  income: number
  expense: number
  balance: number
  previousMonthIncome: number
  previousMonthExpense: number
  previousMonthBalance: number
  incomeChange: number // percentage
  expenseChange: number // percentage
  balanceChange: number // percentage
}

export interface IncomeExpenseHistory {
  month: string
  income: number
  expense: number
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  color: string
}

export interface UpcomingLoanPayment {
  id: string
  loanName: string
  lenderName: string
  paymentDate: string
  amount: number
  daysUntil: number
}

export interface RecentTransaction {
  id: string
  date: string
  description: string
  category: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
}

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

function getMonthRange(date: Date): { start: string; end: string } {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = new Date(year, month, 1).toISOString().split('T')[0]
  const end = new Date(year, month + 1, 0).toISOString().split('T')[0]
  return { start, end }
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// カテゴリ別の色
const categoryColors: Record<string, string> = {
  '食費': '#ef4444',
  '光熱費': '#f97316',
  '交通費': '#eab308',
  '通信費': '#22c55e',
  '日用品': '#14b8a6',
  '医療費': '#3b82f6',
  '娯楽費': '#8b5cf6',
  '教育費': '#ec4899',
  'その他': '#6b7280',
}

// ═══════════════════════════════════════════════════════════════
// Dashboard Summary
// ═══════════════════════════════════════════════════════════════

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date()
  const currentMonth = getMonthRange(now)
  const previousMonth = getMonthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1))

  if (isDevMode()) {
    // Mock data calculation
    const { data: allTransactions } = getMockTransactions({})

    const currentMonthTxns = allTransactions.filter(
      (t) => t.transaction_date >= currentMonth.start && t.transaction_date <= currentMonth.end
    )
    const previousMonthTxns = allTransactions.filter(
      (t) => t.transaction_date >= previousMonth.start && t.transaction_date <= previousMonth.end
    )

    const income = currentMonthTxns
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expense = currentMonthTxns
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const previousMonthIncome = previousMonthTxns
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const previousMonthExpense = previousMonthTxns
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    // Provide some mock previous month data for demo
    const mockPrevIncome = previousMonthIncome || 320000
    const mockPrevExpense = previousMonthExpense || 260000

    return {
      income,
      expense,
      balance: income - expense,
      previousMonthIncome: mockPrevIncome,
      previousMonthExpense: mockPrevExpense,
      previousMonthBalance: mockPrevIncome - mockPrevExpense,
      incomeChange: calculateChange(income, mockPrevIncome),
      expenseChange: calculateChange(expense, mockPrevExpense),
      balanceChange: calculateChange(income - expense, mockPrevIncome - mockPrevExpense),
    }
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return {
      income: 0,
      expense: 0,
      balance: 0,
      previousMonthIncome: 0,
      previousMonthExpense: 0,
      previousMonthBalance: 0,
      incomeChange: 0,
      expenseChange: 0,
      balanceChange: 0,
    }
  }

  // Current month
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: currentData } = (await supabase
    .from('transactions')
    .select('transaction_type, amount')
    .gte('transaction_date', currentMonth.start)
    .lte('transaction_date', currentMonth.end)) as { data: any[] | null }

  // Previous month
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: previousData } = (await supabase
    .from('transactions')
    .select('transaction_type, amount')
    .gte('transaction_date', previousMonth.start)
    .lte('transaction_date', previousMonth.end)) as { data: any[] | null }

  const income = (currentData || [])
    .filter((t) => t.transaction_type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  const expense = (currentData || [])
    .filter((t) => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const previousMonthIncome = (previousData || [])
    .filter((t) => t.transaction_type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)
  const previousMonthExpense = (previousData || [])
    .filter((t) => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  return {
    income,
    expense,
    balance: income - expense,
    previousMonthIncome,
    previousMonthExpense,
    previousMonthBalance: previousMonthIncome - previousMonthExpense,
    incomeChange: calculateChange(income, previousMonthIncome),
    expenseChange: calculateChange(expense, previousMonthExpense),
    balanceChange: calculateChange(income - expense, previousMonthIncome - previousMonthExpense),
  }
}

// ═══════════════════════════════════════════════════════════════
// Income/Expense History (Past 6 months)
// ═══════════════════════════════════════════════════════════════

export async function getIncomeExpenseHistory(): Promise<IncomeExpenseHistory[]> {
  const result: IncomeExpenseHistory[] = []
  const now = new Date()

  if (isDevMode()) {
    const { data: allTransactions } = getMockTransactions({})

    // Generate data for past 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const { start, end } = getMonthRange(date)
      const monthLabel = `${date.getMonth() + 1}月`

      const monthTxns = allTransactions.filter(
        (t) => t.transaction_date >= start && t.transaction_date <= end
      )

      const income = monthTxns
        .filter((t) => t.transaction_type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)
      const expense = monthTxns
        .filter((t) => t.transaction_type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      // Add some mock history data for months without data
      result.push({
        month: monthLabel,
        income: income || (280000 + Math.random() * 80000),
        expense: expense || (200000 + Math.random() * 80000),
      })
    }

    return result
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return []
  }

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const { start, end } = getMonthRange(date)
    const monthLabel = `${date.getMonth() + 1}月`

    const queryResult = await supabase
      .from('transactions')
      .select('transaction_type, amount')
      .gte('transaction_date', start)
      .lte('transaction_date', end)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txnData = (queryResult.data || []) as any[]

    const income = txnData
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    const expense = txnData
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    result.push({ month: monthLabel, income, expense })
  }

  return result
}

// ═══════════════════════════════════════════════════════════════
// Category Breakdown (Current Month)
// ═══════════════════════════════════════════════════════════════

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const now = new Date()
  const { start, end } = getMonthRange(now)

  if (isDevMode()) {
    const { data: allTransactions } = getMockTransactions({})

    const currentMonthExpenses = allTransactions.filter(
      (t) =>
        t.transaction_type === 'expense' &&
        t.transaction_date >= start &&
        t.transaction_date <= end
    )

    // Group by category
    const categoryTotals: Record<string, number> = {}
    for (const txn of currentMonthExpenses) {
      const categoryName = txn.category_name || 'その他'
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + txn.amount
    }

    // If no data, provide mock data
    if (Object.keys(categoryTotals).length === 0) {
      return [
        { category: '食費', amount: 65000, percentage: 35, color: categoryColors['食費'] },
        { category: '光熱費', amount: 25000, percentage: 13, color: categoryColors['光熱費'] },
        { category: '交通費', amount: 18000, percentage: 10, color: categoryColors['交通費'] },
        { category: '通信費', amount: 12000, percentage: 6, color: categoryColors['通信費'] },
        { category: '日用品', amount: 15000, percentage: 8, color: categoryColors['日用品'] },
        { category: '娯楽費', amount: 30000, percentage: 16, color: categoryColors['娯楽費'] },
        { category: 'その他', amount: 20000, percentage: 12, color: categoryColors['その他'] },
      ]
    }

    const totalExpense = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0)

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / totalExpense) * 100),
        color: categoryColors[category] || categoryColors['その他'],
      }))
      .sort((a, b) => b.amount - a.amount)
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await supabase
    .from('transactions')
    .select('amount, categories(name)')
    .eq('transaction_type', 'expense')
    .gte('transaction_date', start)
    .lte('transaction_date', end)) as { data: any[] | null }

  if (!data || data.length === 0) {
    return []
  }

  const categoryTotals: Record<string, number> = {}
  for (const txn of data) {
    const categoryName = txn.categories?.name || 'その他'
    categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + (txn.amount || 0)
  }

  const totalExpense = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0)

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      color: categoryColors[category] || categoryColors['その他'],
    }))
    .sort((a, b) => b.amount - a.amount)
}

// ═══════════════════════════════════════════════════════════════
// Upcoming Loan Payments
// ═══════════════════════════════════════════════════════════════

export async function getUpcomingLoanPayments(): Promise<UpcomingLoanPayment[]> {
  const today = new Date()
  const dayOfMonth = today.getDate()

  if (isDevMode()) {
    const { data: loans } = getMockLoans({ status: 'active' })

    // For each active loan, calculate the next payment date
    const upcomingPayments: UpcomingLoanPayment[] = []

    for (const loan of loans) {
      // Assume monthly payment on the 27th (common in Japan)
      const paymentDay = 27
      let nextPaymentDate: Date

      if (dayOfMonth <= paymentDay) {
        // This month
        nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay)
      } else {
        // Next month
        nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, paymentDay)
      }

      const daysUntil = Math.ceil(
        (nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      upcomingPayments.push({
        id: loan.id,
        loanName: loan.loan_name,
        lenderName: loan.lender_name,
        paymentDate: nextPaymentDate.toISOString().split('T')[0],
        amount: loan.monthly_payment,
        daysUntil,
      })
    }

    return upcomingPayments.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 3)
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: loans } = (await supabase
    .from('loans')
    .select('id, loan_name, lender_name, monthly_payment')
    .eq('status', 'active')) as { data: any[] | null }

  if (!loans || loans.length === 0) {
    return []
  }

  const upcomingPayments: UpcomingLoanPayment[] = []

  for (const loan of loans) {
    const paymentDay = 27
    let nextPaymentDate: Date

    if (dayOfMonth <= paymentDay) {
      nextPaymentDate = new Date(today.getFullYear(), today.getMonth(), paymentDay)
    } else {
      nextPaymentDate = new Date(today.getFullYear(), today.getMonth() + 1, paymentDay)
    }

    const daysUntil = Math.ceil(
      (nextPaymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )

    upcomingPayments.push({
      id: loan.id,
      loanName: loan.loan_name,
      lenderName: loan.lender_name,
      paymentDate: nextPaymentDate.toISOString().split('T')[0],
      amount: loan.monthly_payment,
      daysUntil,
    })
  }

  return upcomingPayments.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 3)
}

// ═══════════════════════════════════════════════════════════════
// Recent Transactions
// ═══════════════════════════════════════════════════════════════

export async function getRecentTransactions(limit: number = 10): Promise<RecentTransaction[]> {
  if (isDevMode()) {
    const { data: transactions } = getMockTransactions({ limit })

    return transactions.map((t) => ({
      id: t.id,
      date: t.transaction_date,
      description: t.description || '',
      category: t.category_name || 'その他',
      amount: t.amount,
      type: t.transaction_type,
    }))
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await supabase
    .from('transactions')
    .select('id, transaction_date, description, amount, transaction_type, categories(name)')
    .order('transaction_date', { ascending: false })
    .limit(limit)) as { data: any[] | null }

  if (!data) {
    return []
  }

  return data.map((t) => ({
    id: t.id,
    date: t.transaction_date,
    description: t.description || '',
    category: t.categories?.name || 'その他',
    amount: t.amount || 0,
    type: t.transaction_type as 'income' | 'expense' | 'transfer',
  }))
}
