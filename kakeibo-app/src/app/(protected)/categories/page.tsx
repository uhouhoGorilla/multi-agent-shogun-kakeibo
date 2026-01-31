"use client"

import { useEffect, useState, useTransition } from "react"
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown } from "lucide-react"
import * as LucideIcons from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CategoryForm } from "@/components/categories/category-form"
import {
  getCategories,
  getCategoriesFlat,
  deleteCategory,
  type CategoryActionState,
} from "@/lib/actions/categories"
import type { CategoryTreeNode } from "@/lib/mock-data/categories"
import type { Category, TransactionType } from "@/types/database"

export default function CategoriesPage() {
  const [expenseCategories, setExpenseCategories] = useState<CategoryTreeNode[]>([])
  const [incomeCategories, setIncomeCategories] = useState<CategoryTreeNode[]>([])
  const [flatCategories, setFlatCategories] = useState<Category[]>([])
  const [activeTab, setActiveTab] = useState<TransactionType>("expense")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // Load categories
  const loadCategories = async () => {
    const [expense, income, flat] = await Promise.all([
      getCategories("expense"),
      getCategories("income"),
      getCategoriesFlat(),
    ])
    setExpenseCategories(expense)
    setIncomeCategories(income)
    setFlatCategories(flat)
    // Expand all root categories by default
    const allRootIds = new Set([
      ...expense.map((c) => c.id),
      ...income.map((c) => c.id),
    ])
    setExpandedCategories(allRootIds)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  // Handle form close and refresh
  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingCategory(null)
      loadCategories()
    }
  }

  // Handle edit
  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return

    startTransition(async () => {
      const result = await deleteCategory(deletingCategory.id)
      if (result.error) {
        setDeleteError(result.error)
      } else {
        setDeletingCategory(null)
        setDeleteError(null)
        loadCategories()
      }
    })
  }

  // Toggle category expansion
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  // Render icon component
  const renderIcon = (iconName: string | null, className?: string) => {
    if (!iconName) return null
    const pascalCase = iconName
      .split("-")
      .map((part, i) =>
        i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
      )
      .join("")
      .replace(/^./, (c) => c.toUpperCase())
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[pascalCase]
    if (!IconComponent) return null
    return <IconComponent className={className} />
  }

  // Render category item
  const renderCategoryItem = (category: CategoryTreeNode, depth: number = 0) => {
    const hasChildren = category.children.length > 0
    const isExpanded = expandedCategories.has(category.id)

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-2 rounded-lg p-2 hover:bg-accent/50 ${
            depth > 0 ? "ml-6" : ""
          }`}
        >
          {/* Expand/collapse button */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className="p-1 hover:bg-accent rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Icon and color */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: category.color || "#64748b" }}
          >
            {renderIcon(category.icon, "h-4 w-4 text-white")}
          </div>

          {/* Name */}
          <span className="flex-1 font-medium">{category.name}</span>

          {/* System badge */}
          {category.is_system && (
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              システム
            </span>
          )}

          {/* Actions */}
          {!category.is_system && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(category)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setDeletingCategory(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {category.children.map((child) => renderCategoryItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const currentCategories = activeTab === "expense" ? expenseCategories : incomeCategories
  const currentFlatCategories = flatCategories.filter(
    (c) => c.transaction_type === activeTab
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">カテゴリ管理</h1>
          <p className="text-muted-foreground">
            収入・支出のカテゴリを管理します
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新規カテゴリ
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>カテゴリ一覧</CardTitle>
          <CardDescription>
            カテゴリは階層構造で管理できます。システムカテゴリは編集・削除できません。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as TransactionType)}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="expense">支出</TabsTrigger>
              <TabsTrigger value="income">収入</TabsTrigger>
            </TabsList>

            <TabsContent value="expense" className="space-y-1">
              {expenseCategories.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  カテゴリがありません
                </p>
              ) : (
                expenseCategories.map((category) => renderCategoryItem(category))
              )}
            </TabsContent>

            <TabsContent value="income" className="space-y-1">
              {incomeCategories.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  カテゴリがありません
                </p>
              ) : (
                incomeCategories.map((category) => renderCategoryItem(category))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <CategoryForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        category={editingCategory}
        transactionType={activeTab}
        parentCategories={currentFlatCategories}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCategory(null)
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリを削除</AlertDialogTitle>
            <AlertDialogDescription>
              「{deletingCategory?.name}」を削除してもよろしいですか？
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
