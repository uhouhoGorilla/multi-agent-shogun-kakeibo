/**
 * Loan Calculator Utilities
 * 元利均等返済のスケジュール計算
 */

export interface RepaymentScheduleItem {
  month: number
  date: string
  payment: number
  principal: number
  interest: number
  balance: number
  isPaid: boolean
}

export interface RepaymentSchedule {
  items: RepaymentScheduleItem[]
  totalPayment: number
  totalInterest: number
  completedPayments: number
  remainingPayments: number
  progressPercentage: number
}

export interface LoanCalculatorInput {
  principalAmount: number     // 元本
  interestRate: number        // 年利率（%）
  startDate: string           // 開始日
  endDate: string             // 終了日
  monthlyPayment: number      // 月々の返済額
  currentBalance: number      // 現在の残高
}

/**
 * 月利率を計算
 */
function getMonthlyRate(annualRate: number): number {
  return annualRate / 100 / 12
}

/**
 * 2つの日付間の月数を計算
 */
function getMonthsBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const yearDiff = end.getFullYear() - start.getFullYear()
  const monthDiff = end.getMonth() - start.getMonth()

  return yearDiff * 12 + monthDiff + 1
}

/**
 * 月を加算した日付を取得
 */
function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() + months)
  return date.toISOString().split('T')[0]
}

/**
 * 元利均等返済のスケジュールを計算
 */
export function calculateRepaymentSchedule(
  input: LoanCalculatorInput
): RepaymentSchedule {
  const {
    principalAmount,
    interestRate,
    startDate,
    endDate,
    monthlyPayment,
    currentBalance,
  } = input

  const monthlyRate = getMonthlyRate(interestRate)
  const totalMonths = getMonthsBetween(startDate, endDate)
  const today = new Date()

  const items: RepaymentScheduleItem[] = []
  let balance = principalAmount
  let totalPayment = 0
  let totalInterest = 0
  let completedPayments = 0

  for (let month = 1; month <= totalMonths; month++) {
    const paymentDate = addMonths(startDate, month - 1)
    const paymentDateObj = new Date(paymentDate)

    // Calculate interest for this month
    const interestForMonth = balance * monthlyRate

    // Calculate principal portion (payment - interest)
    // For the last payment, adjust to pay off remaining balance
    let principalForMonth: number
    let actualPayment: number

    if (month === totalMonths || balance <= monthlyPayment) {
      // Final payment
      principalForMonth = balance
      actualPayment = principalForMonth + interestForMonth
    } else {
      actualPayment = monthlyPayment
      principalForMonth = actualPayment - interestForMonth
    }

    // Update balance
    balance = Math.max(0, balance - principalForMonth)

    // Track if payment is made (before today)
    const isPaid = paymentDateObj < today

    if (isPaid) {
      completedPayments++
    }

    totalPayment += actualPayment
    totalInterest += interestForMonth

    items.push({
      month,
      date: paymentDate,
      payment: Math.round(actualPayment),
      principal: Math.round(principalForMonth),
      interest: Math.round(interestForMonth),
      balance: Math.round(balance),
      isPaid,
    })

    // Stop if balance is zero
    if (balance <= 0) break
  }

  const remainingPayments = items.filter(item => !item.isPaid).length
  const paidAmount = principalAmount - currentBalance
  const progressPercentage = (paidAmount / principalAmount) * 100

  return {
    items,
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    completedPayments,
    remainingPayments,
    progressPercentage: Math.round(progressPercentage * 10) / 10,
  }
}

/**
 * 残高推移を計算（グラフ用）
 */
export function calculateBalanceHistory(
  input: LoanCalculatorInput
): { date: string; balance: number }[] {
  const schedule = calculateRepaymentSchedule(input)

  const history = [
    { date: input.startDate, balance: input.principalAmount }
  ]

  for (const item of schedule.items) {
    history.push({
      date: item.date,
      balance: item.balance,
    })
  }

  return history
}

/**
 * 元利均等返済の月々の返済額を計算（逆算）
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  months: number
): number {
  if (annualRate === 0) {
    return Math.ceil(principal / months)
  }

  const r = annualRate / 100 / 12
  const payment = principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1)

  return Math.ceil(payment)
}

/**
 * 完済予定日を取得
 */
export function getExpectedCompletionDate(endDate: string): {
  date: string
  formatted: string
  monthsRemaining: number
} {
  const end = new Date(endDate)
  const now = new Date()

  const yearDiff = end.getFullYear() - now.getFullYear()
  const monthDiff = end.getMonth() - now.getMonth()
  const monthsRemaining = Math.max(0, yearDiff * 12 + monthDiff)

  const formatted = `${end.getFullYear()}年${end.getMonth() + 1}月`

  return {
    date: endDate,
    formatted,
    monthsRemaining,
  }
}

/**
 * 金額をフォーマット
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * パーセントをフォーマット
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}
