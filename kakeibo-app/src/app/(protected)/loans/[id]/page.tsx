import { getLoanDetail, getPaymentHistory, getAccounts } from '@/lib/actions/loans'
import { notFound } from 'next/navigation'
import { LoanDetailClient } from './schedule-client'

interface LoanDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LoanDetailPage({ params }: LoanDetailPageProps) {
  const { id } = await params

  const [loanDetail, payments, accounts] = await Promise.all([
    getLoanDetail(id),
    getPaymentHistory(id),
    getAccounts(),
  ])

  if (!loanDetail) {
    notFound()
  }

  return (
    <LoanDetailClient
      loan={loanDetail}
      payments={payments}
      accounts={accounts}
    />
  )
}
