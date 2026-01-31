'use server'

import { createClient } from '@/lib/supabase/server'
import { isDevMode } from '@/lib/mock-user'
import {
  getMockTransactions,
  mockTransactions,
  mockCategories,
  mockAccounts,
  type MockTransaction,
} from '@/lib/mock-data/transactions'
import { transactionSchema, type TransactionInput } from '@/lib/validations/transaction'
import { revalidatePath } from 'next/cache'

export type TransactionActionState = {
  error?: string
  success?: boolean
}

export type TransactionsFilter = {
  type?: 'income' | 'expense' | 'transfer'
  startDate?: string
  endDate?: string
  categoryId?: string
  page?: number
  limit?: number
}

// Mutable mock data for development
let devMockTransactions = [...mockTransactions]

// Convert empty strings to null for UUID fields
function sanitizeUuidFields(data: TransactionInput) {
  return {
    ...data,
    category_id: data.category_id || null,
    to_account_id: data.to_account_id || null,
  }
}

export async function getTransactions(filters?: TransactionsFilter) {
  // Development mode: use mock data
  if (isDevMode()) {
    const result = getMockTransactions({
      type: filters?.type,
      startDate: filters?.startDate,
      endDate: filters?.endDate,
      categoryId: filters?.categoryId,
      limit: filters?.limit || 20,
      offset: ((filters?.page || 1) - 1) * (filters?.limit || 20),
    })
    return {
      data: result.data,
      total: result.total,
      page: filters?.page || 1,
      limit: filters?.limit || 20,
    }
  }

  // Production mode: use Supabase
  const supabase = await createClient()
  if (!supabase) {
    return { data: [], total: 0, page: 1, limit: 20 }
  }

  let query = supabase
    .from('transactions')
    .select('*, categories(name), account:accounts!account_id(name), to_account:accounts!to_account_id(name)', { count: 'exact' })
    .order('transaction_date', { ascending: false })

  if (filters?.type) {
    query = query.eq('transaction_type', filters.type)
  }
  if (filters?.startDate) {
    query = query.gte('transaction_date', filters.startDate)
  }
  if (filters?.endDate) {
    query = query.lte('transaction_date', filters.endDate)
  }
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
  }

  const limit = filters?.limit || 20
  const page = filters?.page || 1
  const offset = (page - 1) * limit

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching transactions:', error)
    return { data: [], total: 0, page, limit }
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
  }
}

export async function getCategories() {
  if (isDevMode()) {
    return mockCategories
  }

  const supabase = await createClient()
  if (!supabase) return []

  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')

  return data || []
}

export async function getAccounts() {
  if (isDevMode()) {
    return mockAccounts
  }

  const supabase = await createClient()
  if (!supabase) return []

  const { data } = await supabase
    .from('accounts')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  return data || []
}

export async function createTransaction(
  input: TransactionInput
): Promise<TransactionActionState> {
  const validated = transactionSchema.safeParse(input)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Development mode
  if (isDevMode()) {
    const category = mockCategories.find(c => c.id === input.category_id)
    const account = mockAccounts.find(a => a.id === input.account_id)

    const newTransaction: MockTransaction = {
      id: `txn-${Date.now()}`,
      transaction_type: input.transaction_type,
      amount: input.amount,
      currency: 'JPY',
      description: input.description || null,
      memo: input.memo || null,
      transaction_date: input.transaction_date,
      account_id: input.account_id,
      to_account_id: input.to_account_id || null,
      credit_card_id: null,
      category_id: input.category_id || null,
      shopping_loan_id: null,
      is_recurring: false,
      recurring_rule: null,
      receipt_url: null,
      location: null,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      category_name: category?.name,
      account_name: account?.name,
    }

    devMockTransactions.unshift(newTransaction)
    revalidatePath('/transactions')
    return { success: true }
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return { error: 'データベースに接続できません' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: '認証が必要です' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('transactions') as any).insert({
    user_id: user.id,
    ...sanitizeUuidFields(validated.data),
    currency: 'JPY',
  })

  if (error) {
    return { error: '取引の登録に失敗しました' }
  }

  revalidatePath('/transactions')
  return { success: true }
}

export async function updateTransaction(
  id: string,
  input: TransactionInput
): Promise<TransactionActionState> {
  const validated = transactionSchema.safeParse(input)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Development mode
  if (isDevMode()) {
    const index = devMockTransactions.findIndex(t => t.id === id)
    if (index === -1) {
      return { error: '取引が見つかりません' }
    }

    const category = mockCategories.find(c => c.id === input.category_id)
    const account = mockAccounts.find(a => a.id === input.account_id)

    devMockTransactions[index] = {
      ...devMockTransactions[index],
      ...validated.data,
      updated_at: new Date().toISOString(),
      category_name: category?.name,
      account_name: account?.name,
    }

    revalidatePath('/transactions')
    return { success: true }
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return { error: 'データベースに接続できません' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('transactions') as any)
    .update(sanitizeUuidFields(validated.data))
    .eq('id', id)

  if (error) {
    return { error: '取引の更新に失敗しました' }
  }

  revalidatePath('/transactions')
  return { success: true }
}

export async function deleteTransaction(
  id: string
): Promise<TransactionActionState> {
  // Development mode
  if (isDevMode()) {
    const index = devMockTransactions.findIndex(t => t.id === id)
    if (index === -1) {
      return { error: '取引が見つかりません' }
    }

    devMockTransactions.splice(index, 1)
    revalidatePath('/transactions')
    return { success: true }
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return { error: 'データベースに接続できません' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('transactions') as any)
    .delete()
    .eq('id', id)

  if (error) {
    return { error: '取引の削除に失敗しました' }
  }

  revalidatePath('/transactions')
  return { success: true }
}
