import type { Transaction, TransactionType } from '@/types/database'

export interface MockTransaction extends Omit<Transaction, 'user_id'> {
  category_name?: string
  account_name?: string
}

// Mock categories
export const mockCategories = [
  { id: 'cat-1', name: '食費', type: 'expense' as TransactionType, icon: '🍽️' },
  { id: 'cat-2', name: '交通費', type: 'expense' as TransactionType, icon: '🚃' },
  { id: 'cat-3', name: '住居費', type: 'expense' as TransactionType, icon: '🏠' },
  { id: 'cat-4', name: '光熱費', type: 'expense' as TransactionType, icon: '💡' },
  { id: 'cat-5', name: '通信費', type: 'expense' as TransactionType, icon: '📱' },
  { id: 'cat-6', name: '娯楽費', type: 'expense' as TransactionType, icon: '🎮' },
  { id: 'cat-7', name: '給与', type: 'income' as TransactionType, icon: '💰' },
  { id: 'cat-8', name: '副業', type: 'income' as TransactionType, icon: '💼' },
  { id: 'cat-9', name: '投資収益', type: 'income' as TransactionType, icon: '📈' },
]

// Mock accounts
export const mockAccounts = [
  { id: 'acc-1', name: '楽天銀行', type: 'bank', balance: 350000 },
  { id: 'acc-2', name: 'みずほ銀行', type: 'bank', balance: 520000 },
  { id: 'acc-3', name: '現金', type: 'cash', balance: 25000 },
  { id: 'acc-4', name: 'PayPay', type: 'e_money', balance: 8500 },
]

// Generate mock transactions
function generateMockTransactions(): MockTransaction[] {
  const today = new Date()
  const transactions: MockTransaction[] = []

  // Sample transactions for the current month
  const sampleData = [
    { days: 0, type: 'expense', amount: 1280, category: 'cat-1', desc: 'スーパーで買い物', account: 'acc-3' },
    { days: 1, type: 'expense', amount: 350, category: 'cat-2', desc: '電車代', account: 'acc-4' },
    { days: 2, type: 'expense', amount: 890, category: 'cat-1', desc: 'ランチ', account: 'acc-3' },
    { days: 3, type: 'income', amount: 280000, category: 'cat-7', desc: '1月分給与', account: 'acc-1' },
    { days: 5, type: 'expense', amount: 85000, category: 'cat-3', desc: '家賃', account: 'acc-2' },
    { days: 5, type: 'expense', amount: 8500, category: 'cat-4', desc: '電気代', account: 'acc-2' },
    { days: 7, type: 'expense', amount: 4980, category: 'cat-5', desc: 'スマホ代', account: 'acc-1' },
    { days: 8, type: 'expense', amount: 2500, category: 'cat-6', desc: '映画', account: 'acc-3' },
    { days: 10, type: 'transfer', amount: 50000, category: null, desc: '生活費移動', account: 'acc-1', toAccount: 'acc-3' },
    { days: 12, type: 'expense', amount: 3200, category: 'cat-1', desc: '食材まとめ買い', account: 'acc-4' },
    { days: 14, type: 'income', amount: 15000, category: 'cat-8', desc: '副業収入', account: 'acc-1' },
    { days: 15, type: 'expense', amount: 1500, category: 'cat-2', desc: 'バス代', account: 'acc-4' },
    { days: 18, type: 'expense', amount: 6800, category: 'cat-4', desc: 'ガス代', account: 'acc-2' },
    { days: 20, type: 'expense', amount: 980, category: 'cat-1', desc: 'コンビニ', account: 'acc-3' },
    { days: 22, type: 'income', amount: 5000, category: 'cat-9', desc: '配当金', account: 'acc-1' },
  ]

  sampleData.forEach((item, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - item.days)

    const category = mockCategories.find(c => c.id === item.category)
    const account = mockAccounts.find(a => a.id === item.account)

    transactions.push({
      id: `txn-${String(index + 1).padStart(3, '0')}`,
      transaction_type: item.type as TransactionType,
      amount: item.amount,
      currency: 'JPY',
      description: item.desc,
      memo: null,
      transaction_date: date.toISOString().split('T')[0],
      account_id: item.account,
      to_account_id: (item as { toAccount?: string }).toAccount || null,
      credit_card_id: null,
      category_id: item.category || null,
      shopping_loan_id: null,
      is_recurring: false,
      recurring_rule: null,
      receipt_url: null,
      location: null,
      tags: [],
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
      // Extended fields for display
      category_name: category?.name,
      account_name: account?.name,
    })
  })

  // Sort by date descending
  return transactions.sort((a, b) =>
    new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  )
}

export const mockTransactions = generateMockTransactions()

// Helper to get transactions with filters
export function getMockTransactions(filters?: {
  type?: TransactionType
  startDate?: string
  endDate?: string
  categoryId?: string
  limit?: number
  offset?: number
}): { data: MockTransaction[]; total: number } {
  let filtered = [...mockTransactions]

  if (filters?.type) {
    filtered = filtered.filter(t => t.transaction_type === filters.type)
  }

  if (filters?.startDate) {
    filtered = filtered.filter(t => t.transaction_date >= filters.startDate!)
  }

  if (filters?.endDate) {
    filtered = filtered.filter(t => t.transaction_date <= filters.endDate!)
  }

  if (filters?.categoryId) {
    filtered = filtered.filter(t => t.category_id === filters.categoryId)
  }

  const total = filtered.length
  const offset = filters?.offset || 0
  const limit = filters?.limit || 20

  return {
    data: filtered.slice(offset, offset + limit),
    total,
  }
}
