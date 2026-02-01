'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoanProgressBar } from '@/components/loans/progress-bar'
import { RepaymentSchedule, RepaymentSummary } from '@/components/loans/repayment-schedule'
import { PaymentHistory } from '@/components/loans/payment-history'
import {
  formatCurrency,
  formatPercent,
  getExpectedCompletionDate,
} from '@/lib/utils/loan-calculator'
import { markLoanCompleted } from '@/lib/actions/loans'
import type { LoanWithSchedule, PaymentRecord } from '@/lib/actions/loans'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  CreditCard,
  Edit,
  Percent,
  Wallet,
} from 'lucide-react'

interface Account {
  id: string
  name: string
}

interface LoanDetailClientProps {
  loan: LoanWithSchedule
  payments: PaymentRecord[]
  accounts: Account[]
}

export function LoanDetailClient({
  loan,
  payments,
}: LoanDetailClientProps) {
  const router = useRouter()
  const [isCompleting, setIsCompleting] = useState(false)

  const completionInfo = getExpectedCompletionDate(loan.end_date)
  const isCompleted = loan.status === 'completed'

  const handleMarkCompleted = async () => {
    setIsCompleting(true)
    try {
      const result = await markLoanCompleted(loan.id)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error || '完済処理に失敗しました')
      }
    } finally {
      setIsCompleting(false)
    }
  }

  const statusBadge = {
    active: <Badge variant="default">返済中</Badge>,
    completed: <Badge variant="secondary" className="bg-green-100 text-green-800">完済</Badge>,
    defaulted: <Badge variant="destructive">延滞</Badge>,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/loans">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {loan.loan_name}
              {statusBadge[loan.status]}
            </h1>
            <p className="text-muted-foreground">{loan.lender_name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/loans?edit=${loan.id}`}>
              <Edit className="h-4 w-4 mr-2" />
              編集
            </Link>
          </Button>
          {!isCompleted && loan.current_balance === 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  完済処理
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>完済処理を行いますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    「{loan.loan_name}」を完済済みとしてマークします。
                    この操作は取り消せます（編集から）。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleMarkCompleted}
                    disabled={isCompleting}
                  >
                    {isCompleting ? '処理中...' : '完済にする'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle>返済進捗</CardTitle>
          <CardDescription>
            {isCompleted
              ? '完済おめでとうございます！'
              : `完済予定: ${completionInfo.formatted}（残り${completionInfo.monthsRemaining}ヶ月）`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoanProgressBar
            principalAmount={loan.principal_amount}
            currentBalance={loan.current_balance}
            size="lg"
          />
        </CardContent>
      </Card>

      {/* Loan Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">借入額</p>
                <p className="text-xl font-bold">
                  {formatCurrency(loan.principal_amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900">
                <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">現在残高</p>
                <p className="text-xl font-bold">
                  {formatCurrency(loan.current_balance)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <Percent className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">金利</p>
                <p className="text-xl font-bold">
                  {formatPercent(loan.interest_rate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">月々返済額</p>
                <p className="text-xl font-bold">
                  {formatCurrency(loan.monthly_payment)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">借入先</p>
                <p className="font-medium">{loan.lender_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">借入期間</p>
                <p className="font-medium">
                  {loan.start_date.replace(/-/g, '/')} 〜 {loan.end_date.replace(/-/g, '/')}
                </p>
              </div>
            </div>
            {loan.account_name && (
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">引落口座</p>
                  <p className="font-medium">{loan.account_name}</p>
                </div>
              </div>
            )}
          </div>
          {loan.memo && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">メモ</p>
              <p className="mt-1">{loan.memo}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs: Schedule & History */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">返済スケジュール</TabsTrigger>
          <TabsTrigger value="history">返済履歴</TabsTrigger>
          <TabsTrigger value="summary">サマリー</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <RepaymentSchedule
            items={loan.schedule.items}
            maxHeight="500px"
          />
        </TabsContent>

        <TabsContent value="history">
          <PaymentHistory
            payments={payments}
            maxHeight="500px"
          />
        </TabsContent>

        <TabsContent value="summary">
          <RepaymentSummary
            totalPayment={loan.schedule.totalPayment}
            totalInterest={loan.schedule.totalInterest}
            completedPayments={loan.schedule.completedPayments}
            remainingPayments={loan.schedule.remainingPayments}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
