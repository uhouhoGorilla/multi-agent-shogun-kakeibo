'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Plus, Pencil, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { TransactionForm } from '@/components/transactions/transaction-form'
import { DeleteDialog } from '@/components/transactions/delete-dialog'
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactions,
} from '@/lib/actions/transactions'
import type { TransactionFormInput } from '@/lib/validations/transaction'
import type { MockTransaction } from '@/lib/mock-data/transactions'

type TransactionData = MockTransaction & {
  categories?: { name: string } | null
  accounts?: { name: string } | null
}

interface TransactionsClientProps {
  initialData: {
    data: TransactionData[]
    total: number
    page: number
    limit: number
  }
  categories: { id: string; name: string; type?: string }[]
  accounts: { id: string; name: string }[]
}

const typeLabels: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  income: { label: '収入', variant: 'default' },
  expense: { label: '支出', variant: 'destructive' },
  transfer: { label: '振替', variant: 'secondary' },
}

export function TransactionsClient({
  initialData,
  categories,
  accounts,
}: TransactionsClientProps) {
  const [data, setData] = useState(initialData)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isPending, startTransition] = useTransition()

  const handleCreate = async (input: TransactionFormInput) => {
    const result = await createTransaction({
      ...input,
      amount: parseInt(input.amount, 10),
    })

    if (result.success) {
      // Refresh data with current filter
      startTransition(async () => {
        const newData = await getTransactions({
          page: 1,
          limit: 20,
          type: typeFilter === 'all' ? undefined : typeFilter as 'income' | 'expense' | 'transfer',
        })
        setData(newData)
      })
    }
    return result
  }

  const handleEdit = (transaction: TransactionData) => {
    setSelectedTransaction(transaction)
    setIsFormOpen(true)
  }

  const handleUpdate = async (input: TransactionFormInput) => {
    if (!selectedTransaction) return { error: '取引が選択されていません' }

    const result = await updateTransaction(selectedTransaction.id, {
      ...input,
      amount: parseInt(input.amount, 10),
    })

    if (result.success) {
      setSelectedTransaction(null)
      // Refresh data with current filter
      startTransition(async () => {
        const newData = await getTransactions({
          page: 1,
          limit: 20,
          type: typeFilter === 'all' ? undefined : typeFilter as 'income' | 'expense' | 'transfer',
        })
        setData(newData)
      })
    }
    return result
  }

  const handleDeleteClick = (transaction: TransactionData) => {
    setSelectedTransaction(transaction)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedTransaction) return

    const result = await deleteTransaction(selectedTransaction.id)

    if (result.success) {
      setIsDeleteOpen(false)
      setSelectedTransaction(null)
      // Refresh data with current filter
      startTransition(async () => {
        const newData = await getTransactions({
          page: 1,
          limit: 20,
          type: typeFilter === 'all' ? undefined : typeFilter as 'income' | 'expense' | 'transfer',
        })
        setData(newData)
      })
    }
  }

  const handleFilterChange = (value: string) => {
    setTypeFilter(value)
    startTransition(async () => {
      const newData = await getTransactions({
        page: 1,
        limit: 20,
        type: value === 'all' ? undefined : value as 'income' | 'expense' | 'transfer',
      })
      setData(newData)
    })
  }

  const formatAmount = (amount: number, type: string) => {
    const formatted = new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amount)

    if (type === 'income') return `+${formatted}`
    if (type === 'expense') return `-${formatted}`
    return formatted
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">取引一覧</h1>
          <p className="text-muted-foreground">
            {data.total}件の取引
          </p>
        </div>
        <Button onClick={() => {
          setSelectedTransaction(null)
          setIsFormOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          取引を追加
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={typeFilter} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="タイプで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="income">収入</SelectItem>
            <SelectItem value="expense">支出</SelectItem>
            <SelectItem value="transfer">振替</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">日付</TableHead>
              <TableHead className="w-[80px]">タイプ</TableHead>
              <TableHead>説明</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>口座</TableHead>
              <TableHead className="text-right">金額</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  取引がありません
                </TableCell>
              </TableRow>
            ) : (
              data.data.map((transaction) => {
                const typeInfo = typeLabels[transaction.transaction_type]
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.transaction_date), 'MM/dd', {
                        locale: ja,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                    <TableCell>
                      {transaction.category_name ||
                        (transaction as { categories?: { name: string } }).categories?.name ||
                        '-'}
                    </TableCell>
                    <TableCell>
                      {transaction.account_name ||
                        (transaction as { account?: { name: string } }).account?.name ||
                        (transaction as { accounts?: { name: string } }).accounts?.name ||
                        '-'}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        transaction.transaction_type === 'income'
                          ? 'text-green-600'
                          : transaction.transaction_type === 'expense'
                          ? 'text-red-600'
                          : ''
                      }`}
                    >
                      {formatAmount(transaction.amount, transaction.transaction_type)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            編集
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDeleteClick(transaction)}
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
      <TransactionForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setSelectedTransaction(null)
        }}
        categories={categories}
        accounts={accounts}
        defaultValues={
          selectedTransaction
            ? {
                transaction_type: selectedTransaction.transaction_type,
                amount: String(selectedTransaction.amount),
                transaction_date: selectedTransaction.transaction_date,
                description: selectedTransaction.description || '',
                memo: selectedTransaction.memo || '',
                account_id: selectedTransaction.account_id || '',
                to_account_id: selectedTransaction.to_account_id || '',
                category_id: selectedTransaction.category_id || '',
              }
            : undefined
        }
        onSubmit={selectedTransaction ? handleUpdate : handleCreate}
        isEditing={!!selectedTransaction}
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
