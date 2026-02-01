import { z } from 'zod'

export const loanStatuses = ['active', 'completed', 'defaulted'] as const
export type LoanStatusValue = (typeof loanStatuses)[number]

export const loanSchema = z.object({
  loan_name: z.string().min(1, 'ローン名を入力してください'),
  lender_name: z.string().min(1, '貸主名を入力してください'),
  principal_amount: z
    .number({ message: '元本を入力してください' })
    .positive('元本は1円以上で入力してください'),
  interest_rate: z
    .number({ message: '金利を入力してください' })
    .min(0, '金利は0%以上で入力してください')
    .max(100, '金利は100%以下で入力してください'),
  start_date: z.string().min(1, '開始日を選択してください'),
  end_date: z.string().min(1, '終了日を選択してください'),
  monthly_payment: z
    .number({ message: '月々の返済額を入力してください' })
    .positive('月々の返済額は1円以上で入力してください'),
  current_balance: z
    .number({ message: '現在残高を入力してください' })
    .min(0, '現在残高は0円以上で入力してください'),
  account_id: z.string().optional(),
  status: z.enum(loanStatuses, {
    message: 'ステータスを選択してください',
  }),
  memo: z.string().optional(),
})

export type LoanInput = z.infer<typeof loanSchema>

// Form schema with string amounts (for input handling)
export const loanFormSchema = z
  .object({
    loan_name: z.string().min(1, 'ローン名を入力してください'),
    lender_name: z.string().min(1, '貸主名を入力してください'),
    principal_amount: z.string().min(1, '元本を入力してください'),
    interest_rate: z.string().min(1, '金利を入力してください'),
    start_date: z.string().min(1, '開始日を選択してください'),
    end_date: z.string().min(1, '終了日を選択してください'),
    monthly_payment: z.string().min(1, '月々の返済額を入力してください'),
    current_balance: z.string().min(1, '現在残高を入力してください'),
    account_id: z.string().optional(),
    status: z.enum(loanStatuses, {
      message: 'ステータスを選択してください',
    }),
    memo: z.string().optional(),
  })
  .refine(
    (data) => {
      const amount = parseFloat(data.principal_amount)
      return !isNaN(amount) && amount > 0
    },
    {
      message: '元本は1円以上の数値で入力してください',
      path: ['principal_amount'],
    }
  )
  .refine(
    (data) => {
      const rate = parseFloat(data.interest_rate)
      return !isNaN(rate) && rate >= 0 && rate <= 100
    },
    {
      message: '金利は0〜100%の範囲で入力してください',
      path: ['interest_rate'],
    }
  )
  .refine(
    (data) => {
      const start = new Date(data.start_date)
      const end = new Date(data.end_date)
      return end > start
    },
    {
      message: '終了日は開始日より後の日付を選択してください',
      path: ['end_date'],
    }
  )

export type LoanFormInput = z.infer<typeof loanFormSchema>
