import { z } from 'zod'

export const transactionTypes = ['income', 'expense', 'transfer'] as const
export type TransactionTypeValue = (typeof transactionTypes)[number]

export const transactionSchema = z.object({
  transaction_type: z.enum(transactionTypes, {
    message: '取引タイプを選択してください',
  }),
  amount: z
    .number({ message: '金額を入力してください' })
    .positive('金額は1円以上で入力してください'),
  transaction_date: z.string().min(1, '日付を選択してください'),
  description: z.string().optional(),
  memo: z.string().optional(),
  account_id: z.string().min(1, '口座を選択してください'),
  to_account_id: z.string().optional(),
  category_id: z.string().optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>

// Form schema with string amount (for input handling)
export const transactionFormSchema = z
  .object({
    transaction_type: z.enum(transactionTypes, {
      message: '取引タイプを選択してください',
    }),
    amount: z.string().min(1, '金額を入力してください'),
    transaction_date: z.string().min(1, '日付を選択してください'),
    description: z.string().optional(),
    memo: z.string().optional(),
    account_id: z.string().min(1, '口座を選択してください'),
    to_account_id: z.string().optional(),
    category_id: z.string().optional(),
  })
  .refine(
    (data) => {
      const amount = parseInt(data.amount, 10)
      return !isNaN(amount) && amount > 0
    },
    {
      message: '金額は1円以上の数値で入力してください',
      path: ['amount'],
    }
  )
  .refine(
    (data) => {
      if (data.transaction_type === 'transfer') {
        return !!data.to_account_id
      }
      return true
    },
    {
      message: '振替先口座を選択してください',
      path: ['to_account_id'],
    }
  )

export type TransactionFormInput = z.infer<typeof transactionFormSchema>
