import { SummaryCards } from '@/components/dashboard/summary-cards'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { BudgetProgress } from '@/components/dashboard/budget-progress'
import { ChartsPlaceholder } from '@/components/dashboard/charts-placeholder'
import { UpcomingLoanPayments } from '@/components/dashboard/upcoming-loan-payments'

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground">
            今月の家計状況を確認できます
          </p>
        </div>
      </div>

      {/* サマリーカード */}
      <SummaryCards />

      {/* グラフ */}
      <ChartsPlaceholder />

      {/* メインコンテンツ: 3カラムレイアウト */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 直近の取引 */}
        <RecentTransactions />

        {/* ローン返済予定 */}
        <UpcomingLoanPayments />

        {/* 予算進捗 */}
        <BudgetProgress />
      </div>
    </div>
  )
}
