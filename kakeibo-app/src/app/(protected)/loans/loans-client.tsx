'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Plus, Pencil, Trash2, MoreHorizontal, Wallet, TrendingDown, CreditCard, Calendar, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LoanForm } from '@/components/loans/loan-form'
import { DeleteDialog } from '@/components/loans/delete-dialog'
import {
  createLoan,
  updateLoan,
  deleteLoan,
  getLoans,
} from '@/lib/actions/loans'
import type { LoanFormInput } from '@/lib/validations/loan'
import type { MockLoan, LoanStatus } from '@/lib/mock-data/loans'

type LoanData = MockLoan & {
  account?: { name: string } | null
}

interface LoansClientProps {
  initialData: {
    data: LoanData[]
    total: number
    page: number
    limit: number
  }
  accounts: { id: string; name: string }[]
  summary: {
    totalLoans: number
    activeLoans: number
    totalBalance: number
    monthlyPayments: number
  }
}

const statusLabels: Record<LoanStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  active: { label: '返済中', variant: 'default' },
  completed: { label: '完済', variant: 'secondary' },
  defaulted: { label: '延滞', variant: 'destructive' },
}

export function LoansClient({
  initialData,
  accounts,
  summary,
}: LoansClientProps) {
  const [data, setData] = useState(initialData)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedLoan, setSelectedLoan] = useState<LoanData | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  const handleCreate = async (input: LoanFormInput) => {
    const result = await createLoan({
      ...input,
      principal_amount: parseFloat(input.principal_amount),
      interest_rate: parseFloat(input.interest_rate),
      monthly_payment: parseFloat(input.monthly_payment),
      current_balance: parseFloat(input.current_balance),
    })

    if (result.success) {
      startTransition(async () => {
        const newData = await getLoans({
          page: 1,
          limit: 20,
          status: statusFilter === 'all' ? undefined : statusFilter as LoanStatus,
        })
        setData(newData)
      })
    }
    return result
  }

  const handleEdit = (loan: LoanData) => {
    setSelectedLoan(loan)
    setIsFormOpen(true)
  }

  const handleUpdate = async (input: LoanFormInput) => {
    if (!selectedLoan) return { error: 'ローンが選択されていません' }

    const result = await updateLoan(selectedLoan.id, {
      ...input,
      principal_amount: parseFloat(input.principal_amount),
      interest_rate: parseFloat(input.interest_rate),
      monthly_payment: parseFloat(input.monthly_payment),
      current_balance: parseFloat(input.current_balance),
    })

    if (result.success) {
      setSelectedLoan(null)
      startTransition(async () => {
        const newData = await getLoans({
          page: 1,
          limit: 20,
          status: statusFilter === 'all' ? undefined : statusFilter as LoanStatus,
        })
        setData(newData)
      })
    }
    return result
  }

  const handleDeleteClick = (loan: LoanData) => {
    setSelectedLoan(loan)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedLoan) return

    const result = await deleteLoan(selectedLoan.id)

    if (result.success) {
      setIsDeleteOpen(false)
      setSelectedLoan(null)
      startTransition(async () => {
        const newData = await getLoans({
          page: 1,
          limit: 20,
          status: statusFilter === 'all' ? undefined : statusFilter as LoanStatus,
        })
        setData(newData)
      })
    }
  }

  const handleFilterChange = (value: string) => {
    setStatusFilter(value)
    startTransition(async () => {
      const newData = await getLoans({
        page: 1,
        limit: 20,
        status: value === 'all' ? undefined : value as LoanStatus,
      })
      setData(newData)
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)
  }

  const formatPercent = (rate: number) => {
    return `${rate.toFixed(2)}%`
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総ローン数</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLoans}件</div>
            <p className="text-xs text-muted-foreground">
              うち返済中: {summary.activeLoans}件
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">総残高</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              返済中のローン合計
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">月々の返済額</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.monthlyPayments)}</div>
            <p className="text-xs text-muted-foreground">
              毎月の支払い合計
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">完済予定</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalBalance > 0
                ? `約${Math.ceil(summary.totalBalance / (summary.monthlyPayments || 1))}ヶ月`
                : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              現在のペースで計算
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ローン一覧</h1>
          <p className="text-muted-foreground">
            {data.total}件のローン
          </p>
        </div>
        <Button onClick={() => {
          setSelectedLoan(null)
          setIsFormOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          ローンを追加
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="ステータスで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="active">返済中</SelectItem>
            <SelectItem value="completed">完済</SelectItem>
            <SelectItem value="defaulted">延滞</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ローン名</TableHead>
              <TableHead>貸主</TableHead>
              <TableHead className="text-right">元本</TableHead>
              <TableHead className="text-right">残高</TableHead>
              <TableHead className="text-right">月々返済</TableHead>
              <TableHead className="text-right">金利</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  ローンがありません
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((loan) => {
                const statusInfo = statusLabels[loan.status]
                const progress = loan.principal_amount > 0
                  ? ((loan.principal_amount - loan.current_balance) / loan.principal_amount) * 100
                  : 0
                return (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/loans/${loan.id}`}
                        className="hover:underline text-primary"
                      >
                        {loan.loan_name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(loan.start_date), 'yyyy/MM/dd', { locale: ja })} 〜{' '}
                        {format(new Date(loan.end_date), 'yyyy/MM/dd', { locale: ja })}
                      </div>
                    </TableCell>
                    <TableCell>{loan.lender_name}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(loan.principal_amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div>{formatCurrency(loan.current_balance)}</div>
                      <div className="text-xs text-muted-foreground">
                        {progress.toFixed(1)}% 返済済
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(loan.monthly_payment)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(loan.interest_rate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/loans/${loan.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              詳細
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(loan)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            編集
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteClick(loan)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination info */}
      <div className="text-sm text-muted-foreground">
        {data.total}件中 {(data.page - 1) * data.limit + 1} - {Math.min(data.page * data.limit, data.total)}件を表示
      </div>

      {/* Form Dialog */}
      <LoanForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSelectedLoan(null)
        }}
        accounts={accounts}
        defaultValues={
          selectedLoan
            ? {
                loan_name: selectedLoan.loan_name,
                lender_name: selectedLoan.lender_name,
                principal_amount: String(selectedLoan.principal_amount),
                interest_rate: String(selectedLoan.interest_rate),
                start_date: selectedLoan.start_date,
                end_date: selectedLoan.end_date,
                monthly_payment: String(selectedLoan.monthly_payment),
                current_balance: String(selectedLoan.current_balance),
                account_id: selectedLoan.account_id || '',
                status: selectedLoan.status,
                memo: selectedLoan.memo || '',
              }
            : undefined
        }
        onSubmit={selectedLoan ? handleUpdate : handleCreate}
        isEditing={!!selectedLoan}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onConfirm={handleDelete}
        isDeleting={isPending}
      />
    </div>
  )
}
