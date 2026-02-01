import { Suspense } from 'react'
import { getLoans, getAccounts, getLoanSummary } from '@/lib/actions/loans'
import { LoansClient } from './loans-client'

export default async function LoansPage() {
  const [loansResult, accounts, summary] = await Promise.all([
    getLoans({ page: 1, limit: 20 }),
    getAccounts(),
    getLoanSummary(),
  ])

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div>読み込み中...</div>}>
        <LoansClient
          initialData={loansResult}
          accounts={accounts}
          summary={summary}
        />
      </Suspense>
    </div>
  )
}
