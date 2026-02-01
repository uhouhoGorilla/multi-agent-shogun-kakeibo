export type LoanStatus = 'active' | 'completed' | 'defaulted'

export interface MockLoan {
  id: string
  loan_name: string
  lender_name: string
  principal_amount: number
  interest_rate: number
  start_date: string
  end_date: string
  monthly_payment: number
  current_balance: number
  account_id: string | null
  status: LoanStatus
  memo: string | null
  created_at: string
  updated_at: string
  // Extended for display
  account_name?: string
}

// Sample loans
const sampleLoans: MockLoan[] = [
  {
    id: 'loan-001',
    loan_name: '住宅ローン',
    lender_name: 'みずほ銀行',
    principal_amount: 35000000,
    interest_rate: 0.85,
    start_date: '2020-04-01',
    end_date: '2055-03-31',
    monthly_payment: 95000,
    current_balance: 32500000,
    account_id: 'acc-2',
    status: 'active',
    memo: '35年固定金利',
    created_at: '2020-04-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    account_name: 'みずほ銀行',
  },
  {
    id: 'loan-002',
    loan_name: 'カーローン',
    lender_name: '楽天銀行',
    principal_amount: 3000000,
    interest_rate: 2.5,
    start_date: '2024-06-01',
    end_date: '2029-05-31',
    monthly_payment: 54000,
    current_balance: 2160000,
    account_id: 'acc-1',
    status: 'active',
    memo: '5年ローン',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    account_name: '楽天銀行',
  },
  {
    id: 'loan-003',
    loan_name: '奨学金',
    lender_name: '日本学生支援機構',
    principal_amount: 2400000,
    interest_rate: 0.5,
    start_date: '2015-04-01',
    end_date: '2035-03-31',
    monthly_payment: 12000,
    current_balance: 960000,
    account_id: 'acc-2',
    status: 'active',
    memo: '第二種奨学金',
    created_at: '2015-04-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    account_name: 'みずほ銀行',
  },
  {
    id: 'loan-004',
    loan_name: '家電ローン',
    lender_name: 'ビックカメラ',
    principal_amount: 200000,
    interest_rate: 0,
    start_date: '2025-10-01',
    end_date: '2026-09-30',
    monthly_payment: 16700,
    current_balance: 66800,
    account_id: 'acc-1',
    status: 'active',
    memo: '12回無金利',
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    account_name: '楽天銀行',
  },
  {
    id: 'loan-005',
    loan_name: 'PC分割払い',
    lender_name: 'Apple',
    principal_amount: 180000,
    interest_rate: 0,
    start_date: '2025-01-01',
    end_date: '2025-12-31',
    monthly_payment: 15000,
    current_balance: 0,
    account_id: 'acc-1',
    status: 'completed',
    memo: '完済済み',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-12-31T00:00:00Z',
    account_name: '楽天銀行',
  },
]

// Mutable copy for development
const devMockLoans = [...sampleLoans]

export const mockLoans = sampleLoans

export function getMockLoans(filters?: {
  status?: LoanStatus
  limit?: number
  offset?: number
}): { data: MockLoan[]; total: number } {
  let filtered = [...devMockLoans]

  if (filters?.status) {
    filtered = filtered.filter((l) => l.status === filters.status)
  }

  // Sort by current_balance descending
  filtered.sort((a, b) => b.current_balance - a.current_balance)

  const total = filtered.length
  const offset = filters?.offset || 0
  const limit = filters?.limit || 20

  return {
    data: filtered.slice(offset, offset + limit),
    total,
  }
}

export function addMockLoan(loan: MockLoan): void {
  devMockLoans.unshift(loan)
}

export function updateMockLoan(id: string, updates: Partial<MockLoan>): boolean {
  const index = devMockLoans.findIndex((l) => l.id === id)
  if (index === -1) return false
  devMockLoans[index] = { ...devMockLoans[index], ...updates }
  return true
}

export function deleteMockLoan(id: string): boolean {
  const index = devMockLoans.findIndex((l) => l.id === id)
  if (index === -1) return false
  devMockLoans.splice(index, 1)
  return true
}

export function getMockLoanById(id: string): MockLoan | undefined {
  return devMockLoans.find((l) => l.id === id)
}

// ═══════════════════════════════════════════════════════════════
// 返済履歴
// ═══════════════════════════════════════════════════════════════

export interface MockLoanPayment {
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
  // Extended for display
  loan_name?: string
  account_name?: string
}

const samplePayments: MockLoanPayment[] = [
  {
    id: 'payment-001',
    loan_id: 'loan-001',
    payment_date: '2026-01-27',
    total_amount: 95000,
    principal_amount: 70000,
    interest_amount: 25000,
    account_id: 'acc-2',
    transaction_id: 'txn-loan-001',
    memo: null,
    created_at: '2026-01-27T10:00:00Z',
    loan_name: '住宅ローン',
    account_name: 'みずほ銀行',
  },
  {
    id: 'payment-002',
    loan_id: 'loan-002',
    payment_date: '2026-01-15',
    total_amount: 54000,
    principal_amount: 50000,
    interest_amount: 4000,
    account_id: 'acc-1',
    transaction_id: 'txn-loan-002',
    memo: null,
    created_at: '2026-01-15T10:00:00Z',
    loan_name: 'カーローン',
    account_name: '楽天銀行',
  },
  {
    id: 'payment-003',
    loan_id: 'loan-003',
    payment_date: '2026-01-26',
    total_amount: 12000,
    principal_amount: 11500,
    interest_amount: 500,
    account_id: 'acc-2',
    transaction_id: 'txn-loan-003',
    memo: null,
    created_at: '2026-01-26T10:00:00Z',
    loan_name: '奨学金',
    account_name: 'みずほ銀行',
  },
]

const devMockPayments = [...samplePayments]

export function getMockPayments(loanId?: string): MockLoanPayment[] {
  let payments = [...devMockPayments]
  if (loanId) {
    payments = payments.filter((p) => p.loan_id === loanId)
  }
  // Sort by payment_date descending
  return payments.sort((a, b) =>
    new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  )
}

export function addMockPayment(payment: MockLoanPayment): void {
  devMockPayments.unshift(payment)
}

export function getMockPaymentById(id: string): MockLoanPayment | undefined {
  return devMockPayments.find((p) => p.id === id)
}
