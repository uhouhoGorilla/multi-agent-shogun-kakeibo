'use server'

import { createClient } from '@/lib/supabase/server'
import { isDevMode } from '@/lib/mock-user'
import {
  getMockLoans,
  getMockLoanById,
  getMockPayments,
  addMockLoan,
  addMockPayment,
  updateMockLoan,
  deleteMockLoan,
  type MockLoan,
  type MockLoanPayment,
  type LoanStatus,
} from '@/lib/mock-data/loans'
import { mockAccounts } from '@/lib/mock-data/transactions'
import { loanSchema, type LoanInput } from '@/lib/validations/loan'
import { revalidatePath } from 'next/cache'
import {
  calculateRepaymentSchedule,
  type RepaymentSchedule,
  type LoanCalculatorInput,
} from '@/lib/utils/loan-calculator'

export type LoanActionState = {
  error?: string
  success?: boolean
}

export type LoansFilter = {
  status?: LoanStatus
  page?: number
  limit?: number
}

export async function getLoans(filters?: LoansFilter) {
  // Development mode: use mock data
  if (isDevMode()) {
    const result = getMockLoans({
      status: filters?.status,
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
    .from('loans')
    .select('*, account:accounts!account_id(name)', { count: 'exact' })
    .order('current_balance', { ascending: false })

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  const limit = filters?.limit || 20
  const page = filters?.page || 1
  const offset = (page - 1) * limit

  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching loans:', error)
    return { data: [], total: 0, page, limit }
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    limit,
  }
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

// Convert empty strings to null for UUID fields
function sanitizeInput(data: LoanInput) {
  return {
    ...data,
    account_id: data.account_id || null,
    memo: data.memo || null,
  }
}

export async function createLoan(
  input: LoanInput
): Promise<LoanActionState> {
  const validated = loanSchema.safeParse(input)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Development mode
  if (isDevMode()) {
    const account = mockAccounts.find((a) => a.id === input.account_id)

    const newLoan: MockLoan = {
      id: `loan-${Date.now()}`,
      ...sanitizeInput(validated.data),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      account_name: account?.name,
    }

    addMockLoan(newLoan)
    revalidatePath('/loans')
    return { success: true }
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return { error: 'データベースに接続できません' }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: '認証が必要です' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('loans') as any).insert({
    user_id: user.id,
    ...sanitizeInput(validated.data),
  })

  if (error) {
    return { error: 'ローンの登録に失敗しました' }
  }

  revalidatePath('/loans')
  return { success: true }
}

export async function updateLoan(
  id: string,
  input: LoanInput
): Promise<LoanActionState> {
  const validated = loanSchema.safeParse(input)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  // Development mode
  if (isDevMode()) {
    const account = mockAccounts.find((a) => a.id === input.account_id)

    const success = updateMockLoan(id, {
      ...sanitizeInput(validated.data),
      updated_at: new Date().toISOString(),
      account_name: account?.name,
    })

    if (!success) {
      return { error: 'ローンが見つかりません' }
    }

    revalidatePath('/loans')
    return { success: true }
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return { error: 'データベースに接続できません' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('loans') as any)
    .update(sanitizeInput(validated.data))
    .eq('id', id)

  if (error) {
    return { error: 'ローンの更新に失敗しました' }
  }

  revalidatePath('/loans')
  return { success: true }
}

export async function deleteLoan(id: string): Promise<LoanActionState> {
  // Development mode
  if (isDevMode()) {
    const success = deleteMockLoan(id)
    if (!success) {
      return { error: 'ローンが見つかりません' }
    }

    revalidatePath('/loans')
    return { success: true }
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return { error: 'データベースに接続できません' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('loans') as any).delete().eq('id', id)

  if (error) {
    return { error: 'ローンの削除に失敗しました' }
  }

  revalidatePath('/loans')
  return { success: true }
}

// Get loan summary statistics
export async function getLoanSummary() {
  if (isDevMode()) {
    const { data: loans } = getMockLoans({})
    const activeLoans = loans.filter((l) => l.status === 'active')

    return {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      totalBalance: activeLoans.reduce((sum, l) => sum + l.current_balance, 0),
      monthlyPayments: activeLoans.reduce((sum, l) => sum + l.monthly_payment, 0),
    }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { totalLoans: 0, activeLoans: 0, totalBalance: 0, monthlyPayments: 0 }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await supabase.from('loans').select('*') as { data: any[] | null }

  if (!data) {
    return { totalLoans: 0, activeLoans: 0, totalBalance: 0, monthlyPayments: 0 }
  }

  const activeLoans = data.filter((l) => l.status === 'active')

  return {
    totalLoans: data.length,
    activeLoans: activeLoans.length,
    totalBalance: activeLoans.reduce((sum, l) => sum + (l.current_balance || 0), 0),
    monthlyPayments: activeLoans.reduce((sum, l) => sum + (l.monthly_payment || 0), 0),
  }
}

// ═══════════════════════════════════════════════════════════════
// Payment Record Types
// ═══════════════════════════════════════════════════════════════

export interface RecordPaymentInput {
  loan_id: string
  payment_date: string
  total_amount: number
  principal_amount?: number
  interest_amount?: number
  account_id: string
  memo?: string
}

export interface PaymentRecord {
  id: string
  loan_id: string
  payment_date: string
  total_amount: number
  principal_amount: number
  interest_amount: number
  account_id: string
  transaction_id: string | null
  memo: string | null
  created_at: string
  loan_name?: string
  account_name?: string
}

// ═══════════════════════════════════════════════════════════════
// Get Loan by ID
// ═══════════════════════════════════════════════════════════════

export async function getLoan(id: string): Promise<MockLoan | null> {
  if (isDevMode()) {
    return getMockLoanById(id) || null
  }

  const supabase = await createClient()
  if (!supabase) return null

  const { data } = await supabase
    .from('loans')
    .select('*, account:accounts(name)')
    .eq('id', id)
    .single()

  return data
}

// ═══════════════════════════════════════════════════════════════
// Get Payment History
// ═══════════════════════════════════════════════════════════════

export async function getPaymentHistory(loanId?: string): Promise<PaymentRecord[]> {
  if (isDevMode()) {
    return getMockPayments(loanId)
  }

  const supabase = await createClient()
  if (!supabase) return []

  let query = supabase
    .from('loan_payments')
    .select('*, loan:loans(loan_name), account:accounts(name)')
    .order('payment_date', { ascending: false })

  if (loanId) {
    query = query.eq('loan_id', loanId)
  }

  const { data } = await query

  return (data || []).map((p: Record<string, unknown>) => ({
    ...p,
    loan_name: (p.loan as { loan_name?: string })?.loan_name,
    account_name: (p.account as { name?: string })?.name,
  })) as PaymentRecord[]
}

// ═══════════════════════════════════════════════════════════════
// Record Loan Payment
// ═══════════════════════════════════════════════════════════════

export async function recordLoanPayment(
  input: RecordPaymentInput
): Promise<LoanActionState & { payment?: PaymentRecord }> {
  // Validate input
  if (!input.loan_id) {
    return { error: 'ローンIDが必要です' }
  }
  if (!input.payment_date) {
    return { error: '返済日が必要です' }
  }
  if (!input.total_amount || input.total_amount <= 0) {
    return { error: '返済金額は0より大きい必要があります' }
  }
  if (!input.account_id) {
    return { error: '引き落とし口座を選択してください' }
  }

  // Calculate principal and interest if not provided
  const principalAmount = input.principal_amount ?? input.total_amount
  const interestAmount = input.interest_amount ?? 0

  // Development mode
  if (isDevMode()) {
    const loan = getMockLoanById(input.loan_id)
    if (!loan) {
      return { error: 'ローンが見つかりません' }
    }

    const account = mockAccounts.find((a) => a.id === input.account_id)

    // Generate IDs
    const paymentId = `payment-${Date.now()}`
    const transactionId = `txn-loan-${Date.now()}`

    // Create payment record
    const payment: MockLoanPayment = {
      id: paymentId,
      loan_id: input.loan_id,
      payment_date: input.payment_date,
      total_amount: input.total_amount,
      principal_amount: principalAmount,
      interest_amount: interestAmount,
      account_id: input.account_id,
      transaction_id: transactionId,
      memo: input.memo || null,
      created_at: new Date().toISOString(),
      loan_name: loan.loan_name,
      account_name: account?.name,
    }

    addMockPayment(payment)

    // Update loan balance
    const newBalance = Math.max(0, loan.current_balance - principalAmount)
    const newStatus = newBalance === 0 ? 'completed' : loan.status

    updateMockLoan(input.loan_id, {
      current_balance: newBalance,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })

    // Note: In dev mode, we don't actually create a transaction
    // The transaction creation would be done via createTransaction in production

    revalidatePath('/loans')
    revalidatePath('/transactions')

    return {
      success: true,
      payment,
    }
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

  // Get loan info
   
  const { data: loan } = (await supabase
    .from('loans')
    .select('*')
    .eq('id', input.loan_id)
    .single()) as { data: any }

  if (!loan) {
    return { error: 'ローンが見つかりません' }
  }

  // 1. Create transaction (expense)
   
  const { data: transaction, error: txError } = await (supabase
    .from('transactions') as any)
    .insert({
      user_id: user.id,
      transaction_type: 'expense',
      amount: input.total_amount,
      currency: 'JPY',
      transaction_date: input.payment_date,
      account_id: input.account_id,
      description: `${loan.loan_name} 返済`,
      memo: input.memo || `元本: ¥${principalAmount.toLocaleString()}, 利息: ¥${interestAmount.toLocaleString()}`,
      category_id: null, // TODO: Link to "ローン返済" category
    })
    .select()
    .single()

  if (txError) {
    return { error: '取引の作成に失敗しました' }
  }

  // 2. Create payment record
   
  const { data: payment, error: paymentError } = await (supabase
    .from('loan_payments') as any)
    .insert({
      loan_id: input.loan_id,
      payment_date: input.payment_date,
      total_amount: input.total_amount,
      principal_amount: principalAmount,
      interest_amount: interestAmount,
      account_id: input.account_id,
      transaction_id: transaction.id,
      memo: input.memo,
    })
    .select()
    .single()

  if (paymentError) {
    // Rollback transaction
    await supabase.from('transactions').delete().eq('id', transaction.id)
    return { error: '返済記録の作成に失敗しました' }
  }

  // 3. Update loan balance
  const newBalance = Math.max(0, loan.current_balance - principalAmount)
  const newStatus = newBalance === 0 ? 'completed' : loan.status

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase.from('loans') as any)
    .update({
      current_balance: newBalance,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.loan_id)

  if (updateError) {
    return { error: 'ローン残高の更新に失敗しました（返済は記録されました）' }
  }

  revalidatePath('/loans')
  revalidatePath('/transactions')

  return {
    success: true,
    payment: {
      ...payment,
      loan_name: loan.loan_name,
    },
  }
}

// ═══════════════════════════════════════════════════════════════
// Get Loan Detail with Schedule
// ═══════════════════════════════════════════════════════════════

export interface LoanWithSchedule extends MockLoan {
  schedule: RepaymentSchedule
}

export async function getLoanDetail(id: string): Promise<LoanWithSchedule | null> {
  const loan = await getLoan(id)
  if (!loan) return null

  const calculatorInput: LoanCalculatorInput = {
    principalAmount: loan.principal_amount,
    interestRate: loan.interest_rate,
    startDate: loan.start_date,
    endDate: loan.end_date,
    monthlyPayment: loan.monthly_payment,
    currentBalance: loan.current_balance,
  }

  const schedule = calculateRepaymentSchedule(calculatorInput)

  return {
    ...loan,
    schedule,
  }
}

// ═══════════════════════════════════════════════════════════════
// Get Repayment Schedule Only
// ═══════════════════════════════════════════════════════════════

export async function getRepaymentSchedule(id: string): Promise<RepaymentSchedule | null> {
  const loan = await getLoan(id)
  if (!loan) return null

  const calculatorInput: LoanCalculatorInput = {
    principalAmount: loan.principal_amount,
    interestRate: loan.interest_rate,
    startDate: loan.start_date,
    endDate: loan.end_date,
    monthlyPayment: loan.monthly_payment,
    currentBalance: loan.current_balance,
  }

  return calculateRepaymentSchedule(calculatorInput)
}

// ═══════════════════════════════════════════════════════════════
// Mark Loan as Completed
// ═══════════════════════════════════════════════════════════════

export async function markLoanCompleted(id: string): Promise<LoanActionState> {
  // Development mode
  if (isDevMode()) {
    const loan = getMockLoanById(id)
    if (!loan) {
      return { error: 'ローンが見つかりません' }
    }

    const success = updateMockLoan(id, {
      status: 'completed',
      current_balance: 0,
      updated_at: new Date().toISOString(),
    })

    if (!success) {
      return { error: 'ローンの更新に失敗しました' }
    }

    revalidatePath('/loans')
    revalidatePath(`/loans/${id}`)
    return { success: true }
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return { error: 'データベースに接続できません' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('loans') as any)
    .update({
      status: 'completed',
      current_balance: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: '完済処理に失敗しました' }
  }

  revalidatePath('/loans')
  revalidatePath(`/loans/${id}`)
  return { success: true }
}

// ═══════════════════════════════════════════════════════════════
// Update Loan Balance
// ═══════════════════════════════════════════════════════════════

export async function updateLoanBalance(
  id: string,
  newBalance: number
): Promise<LoanActionState> {
  if (newBalance < 0) {
    return { error: '残高は0以上である必要があります' }
  }

  // Development mode
  if (isDevMode()) {
    const loan = getMockLoanById(id)
    if (!loan) {
      return { error: 'ローンが見つかりません' }
    }

    const newStatus = newBalance === 0 ? 'completed' : loan.status

    const success = updateMockLoan(id, {
      current_balance: newBalance,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })

    if (!success) {
      return { error: 'ローン残高の更新に失敗しました' }
    }

    revalidatePath('/loans')
    revalidatePath(`/loans/${id}`)
    return { success: true }
  }

  // Production mode
  const supabase = await createClient()
  if (!supabase) {
    return { error: 'データベースに接続できません' }
  }

  // Get current loan to determine status
   
  const { data: loan } = await supabase
    .from('loans')
    .select('status')
    .eq('id', id)
    .single() as { data: { status: string } | null }

  if (!loan) {
    return { error: 'ローンが見つかりません' }
  }

  const newStatus = newBalance === 0 ? 'completed' : loan.status

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('loans') as any)
    .update({
      current_balance: newBalance,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: 'ローン残高の更新に失敗しました' }
  }

  revalidatePath('/loans')
  revalidatePath(`/loans/${id}`)
  return { success: true }
}
