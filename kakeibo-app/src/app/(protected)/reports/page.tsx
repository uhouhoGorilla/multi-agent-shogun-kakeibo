import { Suspense } from 'react'
import {
  getMonthlyReport,
  getReportCategories,
} from '@/lib/actions/reports'
import { ReportsClient } from './reports-client'

export default async function ReportsPage() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1

  const [monthlyReport, categories] = await Promise.all([
    getMonthlyReport(year, month),
    getReportCategories(),
  ])

  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div>読み込み中...</div>}>
        <ReportsClient
          initialMonthlyReport={monthlyReport}
          categories={categories}
          initialYear={year}
          initialMonth={month}
        />
      </Suspense>
    </div>
  )
}
