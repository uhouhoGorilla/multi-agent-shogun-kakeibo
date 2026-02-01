'use server'

import { createClient } from '@/lib/supabase/server'
import { isDevMode } from '@/lib/mock-user'
import {
  getMockTransactions,
  mockCategories,
  type MockTransaction,
} from '@/lib/mock-data/transactions'
import {
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
  parseISO,
} from 'date-fns'

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface MonthlyReportSummary {
  month: string
  totalIncome: number
  totalExpense: number
  balance: number
  transactionCount: number
}

export interface CategoryBreakdown {
  categoryId: string | null
  categoryName: string
  type: 'income' | 'expense'
  amount: number
  count: number
  percentage: number
}

export interface DailyBalance {
  date: string
  income: number
  expense: number
  balance: number
}

export interface MonthlyReport {
  summary: MonthlyReportSummary
  categoryBreakdown: CategoryBreakdown[]
  dailyBalances: DailyBalance[]
  topExpenses: { description: string; amount: number; date: string; category: string }[]
}

export interface CategoryReport {
  categoryId: string | null
  categoryName: string
  startDate: string
  endDate: string
  totalAmount: number
  transactionCount: number
  transactions: {
    id: string
    date: string
    description: string
    amount: number
    accountName?: string
  }[]
}

export interface PeriodReport {
  startDate: string
  endDate: string
  summary: {
    totalIncome: number
    totalExpense: number
    balance: number
    transactionCount: number
  }
  categoryBreakdown: CategoryBreakdown[]
  dailyBalances: DailyBalance[]
}

// ═══════════════════════════════════════════════════════════════
// Monthly Report
// ═══════════════════════════════════════════════════════════════

export async function getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
  const startDate = startOfMonth(new Date(year, month - 1))
  const endDate = endOfMonth(new Date(year, month - 1))
  const startStr = format(startDate, 'yyyy-MM-dd')
  const endStr = format(endDate, 'yyyy-MM-dd')

  if (isDevMode()) {
    return getMonthlyReportFromMock(startStr, endStr, year, month)
  }

  return getMonthlyReportFromDB(startStr, endStr, year, month)
}

async function getMonthlyReportFromMock(
  startDate: string,
  endDate: string,
  year: number,
  month: number
): Promise<MonthlyReport> {
  const { data: transactions } = getMockTransactions({
    startDate,
    endDate,
    limit: 1000,
  })

  return buildMonthlyReport(transactions, year, month, startDate, endDate)
}

async function getMonthlyReportFromDB(
  startDate: string,
  endDate: string,
  year: number,
  month: number
): Promise<MonthlyReport> {
  const supabase = await createClient()
  if (!supabase) {
    return buildEmptyMonthlyReport(year, month)
  }

  const { data } = await supabase
    .from('transactions')
    .select('*, categories(name), account:accounts!account_id(name)')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false })

  const transactions = (data || []).map((t: Record<string, unknown>) => ({
    ...t,
    category_name: (t.categories as { name?: string })?.name,
    account_name: (t.account as { name?: string })?.name,
  })) as MockTransaction[]

  return buildMonthlyReport(transactions, year, month, startDate, endDate)
}

function buildMonthlyReport(
  transactions: MockTransaction[],
  year: number,
  month: number,
  startDate: string,
  endDate: string
): MonthlyReport {
  // Calculate summary
  let totalIncome = 0
  let totalExpense = 0

  transactions.forEach((t) => {
    if (t.transaction_type === 'income') {
      totalIncome += t.amount
    } else if (t.transaction_type === 'expense') {
      totalExpense += t.amount
    }
  })

  const summary: MonthlyReportSummary = {
    month: format(new Date(year, month - 1), 'yyyy年M月'),
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: transactions.length,
  }

  // Category breakdown
  const categoryMap = new Map<string, { amount: number; count: number; type: string; name: string }>()

  transactions.forEach((t) => {
    if (t.transaction_type === 'transfer') return
    const key = t.category_id || 'uncategorized'
    const existing = categoryMap.get(key) || {
      amount: 0,
      count: 0,
      type: t.transaction_type,
      name: t.category_name || '未分類',
    }
    existing.amount += t.amount
    existing.count += 1
    categoryMap.set(key, existing)
  })

  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId: categoryId === 'uncategorized' ? null : categoryId,
      categoryName: data.name,
      type: data.type as 'income' | 'expense',
      amount: data.amount,
      count: data.count,
      percentage: data.type === 'expense' && totalExpense > 0
        ? Math.round((data.amount / totalExpense) * 1000) / 10
        : data.type === 'income' && totalIncome > 0
        ? Math.round((data.amount / totalIncome) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Daily balances
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  })

  const dailyMap = new Map<string, { income: number; expense: number }>()
  days.forEach((d) => {
    dailyMap.set(format(d, 'yyyy-MM-dd'), { income: 0, expense: 0 })
  })

  transactions.forEach((t) => {
    const day = dailyMap.get(t.transaction_date)
    if (day) {
      if (t.transaction_type === 'income') {
        day.income += t.amount
      } else if (t.transaction_type === 'expense') {
        day.expense += t.amount
      }
    }
  })

  const dailyBalances: DailyBalance[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    income: data.income,
    expense: data.expense,
    balance: data.income - data.expense,
  }))

  // Top expenses
  const topExpenses = transactions
    .filter((t) => t.transaction_type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((t) => ({
      description: t.description || '',
      amount: t.amount,
      date: t.transaction_date,
      category: t.category_name || '未分類',
    }))

  return {
    summary,
    categoryBreakdown,
    dailyBalances,
    topExpenses,
  }
}

function buildEmptyMonthlyReport(year: number, month: number): MonthlyReport {
  return {
    summary: {
      month: format(new Date(year, month - 1), 'yyyy年M月'),
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
    },
    categoryBreakdown: [],
    dailyBalances: [],
    topExpenses: [],
  }
}

// ═══════════════════════════════════════════════════════════════
// Category Report
// ═══════════════════════════════════════════════════════════════

export async function getCategoryReport(
  categoryId: string | null,
  startDate: string,
  endDate: string
): Promise<CategoryReport> {
  if (isDevMode()) {
    return getCategoryReportFromMock(categoryId, startDate, endDate)
  }

  return getCategoryReportFromDB(categoryId, startDate, endDate)
}

async function getCategoryReportFromMock(
  categoryId: string | null,
  startDate: string,
  endDate: string
): Promise<CategoryReport> {
  const { data: allTransactions } = getMockTransactions({
    startDate,
    endDate,
    limit: 1000,
  })

  const transactions = categoryId
    ? allTransactions.filter((t) => t.category_id === categoryId)
    : allTransactions.filter((t) => !t.category_id)

  const category = categoryId
    ? mockCategories.find((c) => c.id === categoryId)
    : null

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)

  return {
    categoryId,
    categoryName: category?.name || '未分類',
    startDate,
    endDate,
    totalAmount,
    transactionCount: transactions.length,
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.transaction_date,
      description: t.description || '',
      amount: t.amount,
      accountName: t.account_name,
    })),
  }
}

async function getCategoryReportFromDB(
  categoryId: string | null,
  startDate: string,
  endDate: string
): Promise<CategoryReport> {
  const supabase = await createClient()
  if (!supabase) {
    return {
      categoryId,
      categoryName: '未分類',
      startDate,
      endDate,
      totalAmount: 0,
      transactionCount: 0,
      transactions: [],
    }
  }

  let query = supabase
    .from('transactions')
    .select('*, categories(name), account:accounts!account_id(name)')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  } else {
    query = query.is('category_id', null)
  }

  const { data } = await query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions = (data || []) as any[]
  const categoryName = transactions[0]?.categories?.name || '未分類'
  const totalAmount = transactions.reduce((sum: number, t: Record<string, unknown>) =>
    sum + (t.amount as number), 0)

  return {
    categoryId,
    categoryName,
    startDate,
    endDate,
    totalAmount,
    transactionCount: transactions.length,
    transactions: transactions.map((t: Record<string, unknown>) => ({
      id: t.id as string,
      date: t.transaction_date as string,
      description: (t.description as string) || '',
      amount: t.amount as number,
      accountName: (t.account as { name?: string })?.name,
    })),
  }
}

// ═══════════════════════════════════════════════════════════════
// Period Report
// ═══════════════════════════════════════════════════════════════

export async function getPeriodReport(
  startDate: string,
  endDate: string
): Promise<PeriodReport> {
  if (isDevMode()) {
    return getPeriodReportFromMock(startDate, endDate)
  }

  return getPeriodReportFromDB(startDate, endDate)
}

async function getPeriodReportFromMock(
  startDate: string,
  endDate: string
): Promise<PeriodReport> {
  const { data: transactions } = getMockTransactions({
    startDate,
    endDate,
    limit: 1000,
  })

  return buildPeriodReport(transactions, startDate, endDate)
}

async function getPeriodReportFromDB(
  startDate: string,
  endDate: string
): Promise<PeriodReport> {
  const supabase = await createClient()
  if (!supabase) {
    return buildEmptyPeriodReport(startDate, endDate)
  }

  const { data } = await supabase
    .from('transactions')
    .select('*, categories(name), account:accounts!account_id(name)')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false })

  const transactions = (data || []).map((t: Record<string, unknown>) => ({
    ...t,
    category_name: (t.categories as { name?: string })?.name,
    account_name: (t.account as { name?: string })?.name,
  })) as MockTransaction[]

  return buildPeriodReport(transactions, startDate, endDate)
}

function buildPeriodReport(
  transactions: MockTransaction[],
  startDate: string,
  endDate: string
): PeriodReport {
  let totalIncome = 0
  let totalExpense = 0

  transactions.forEach((t) => {
    if (t.transaction_type === 'income') {
      totalIncome += t.amount
    } else if (t.transaction_type === 'expense') {
      totalExpense += t.amount
    }
  })

  // Category breakdown
  const categoryMap = new Map<string, { amount: number; count: number; type: string; name: string }>()

  transactions.forEach((t) => {
    if (t.transaction_type === 'transfer') return
    const key = t.category_id || 'uncategorized'
    const existing = categoryMap.get(key) || {
      amount: 0,
      count: 0,
      type: t.transaction_type,
      name: t.category_name || '未分類',
    }
    existing.amount += t.amount
    existing.count += 1
    categoryMap.set(key, existing)
  })

  const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([categoryId, data]) => ({
      categoryId: categoryId === 'uncategorized' ? null : categoryId,
      categoryName: data.name,
      type: data.type as 'income' | 'expense',
      amount: data.amount,
      count: data.count,
      percentage: data.type === 'expense' && totalExpense > 0
        ? Math.round((data.amount / totalExpense) * 1000) / 10
        : data.type === 'income' && totalIncome > 0
        ? Math.round((data.amount / totalIncome) * 1000) / 10
        : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  // Daily balances
  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  })

  const dailyMap = new Map<string, { income: number; expense: number }>()
  days.forEach((d) => {
    dailyMap.set(format(d, 'yyyy-MM-dd'), { income: 0, expense: 0 })
  })

  transactions.forEach((t) => {
    const day = dailyMap.get(t.transaction_date)
    if (day) {
      if (t.transaction_type === 'income') {
        day.income += t.amount
      } else if (t.transaction_type === 'expense') {
        day.expense += t.amount
      }
    }
  })

  const dailyBalances: DailyBalance[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    income: data.income,
    expense: data.expense,
    balance: data.income - data.expense,
  }))

  return {
    startDate,
    endDate,
    summary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length,
    },
    categoryBreakdown,
    dailyBalances,
  }
}

function buildEmptyPeriodReport(startDate: string, endDate: string): PeriodReport {
  return {
    startDate,
    endDate,
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      transactionCount: 0,
    },
    categoryBreakdown: [],
    dailyBalances: [],
  }
}

// ═══════════════════════════════════════════════════════════════
// Get Categories for Selection
// ═══════════════════════════════════════════════════════════════

export async function getReportCategories(): Promise<{ id: string; name: string; type: string }[]> {
  if (isDevMode()) {
    return mockCategories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    }))
  }

  const supabase = await createClient()
  if (!supabase) return []

  const { data } = await supabase
    .from('categories')
    .select('id, name, type')
    .order('name')

  return data || []
}
