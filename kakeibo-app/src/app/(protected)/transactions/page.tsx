import { Suspense } from 'react'
import { getTransactions, getCategories, getAccounts } from '@/lib/actions/transactions'
import { TransactionsClient } from './transactions-client'

export default async function TransactionsPage() {
  const [transactionsResult, categories, accounts] = await Promise.all([
    getTransactions({ page: 1, limit: 20 }),
    getCategories(),
    getAccounts(),
  ])

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div>読み込み中...</div>}>
        <TransactionsClient
          initialData={transactionsResult}
          categories={categories}
          accounts={accounts}
        />
      </Suspense>
    </div>
  )
}
