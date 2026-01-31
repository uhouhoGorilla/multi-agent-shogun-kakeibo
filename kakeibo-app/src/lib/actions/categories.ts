"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isDevMode } from "@/lib/mock-user"
import {
  mockCategories,
  buildCategoryTree,
  type CategoryTreeNode,
} from "@/lib/mock-data/categories"
import type { Category, TransactionType } from "@/types/database"

// In-memory store for mock data mutations
let mockCategoriesStore = [...mockCategories]
let mockIdCounter = 100

export type CategoryActionState = {
  error?: string
  success?: boolean
}

// Get all categories as a tree structure
export async function getCategories(
  type: TransactionType
): Promise<CategoryTreeNode[]> {
  if (isDevMode()) {
    return buildCategoryTreeFromArray(
      mockCategoriesStore.filter((c) => c.transaction_type === type)
    )
  }

  const supabase = await createClient()
  if (!supabase) {
    return buildCategoryTreeFromArray(
      mockCategoriesStore.filter((c) => c.transaction_type === type)
    )
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("transaction_type", type)
    .order("sort_order")

  if (error) {
    console.error("Failed to fetch categories:", error)
    return []
  }

  return buildCategoryTreeFromArray(data as Category[])
}

// Get flat list of categories
export async function getCategoriesFlat(
  type?: TransactionType
): Promise<Category[]> {
  if (isDevMode()) {
    if (type) {
      return mockCategoriesStore.filter((c) => c.transaction_type === type)
    }
    return mockCategoriesStore
  }

  const supabase = await createClient()
  if (!supabase) {
    if (type) {
      return mockCategoriesStore.filter((c) => c.transaction_type === type)
    }
    return mockCategoriesStore
  }

  let query = supabase.from("categories").select("*").order("sort_order")

  if (type) {
    query = query.eq("transaction_type", type)
  }

  const { data, error } = await query

  if (error) {
    console.error("Failed to fetch categories:", error)
    return []
  }

  return data as Category[]
}

// Create a new category
export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const name = formData.get("name") as string
  const transactionType = formData.get("transaction_type") as TransactionType
  const parentId = formData.get("parent_id") as string | null
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string

  if (!name || name.trim() === "") {
    return { error: "カテゴリ名を入力してください" }
  }

  if (isDevMode()) {
    const now = new Date().toISOString()
    const newCategory: Category = {
      id: `cat-mock-${++mockIdCounter}`,
      user_id: "mock-user-id",
      name: name.trim(),
      parent_id: parentId || null,
      transaction_type: transactionType,
      color: color || "#64748b",
      icon: icon || "ellipsis",
      is_system: false,
      sort_order: mockCategoriesStore.length + 1,
      created_at: now,
      updated_at: now,
    }
    mockCategoriesStore.push(newCategory)
    revalidatePath("/categories")
    return { success: true }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { error: "データベース接続に失敗しました" }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "ログインが必要です" }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any).insert({
    user_id: user.id,
    name: name.trim(),
    parent_id: parentId || null,
    transaction_type: transactionType,
    color: color || "#64748b",
    icon: icon || "ellipsis",
    is_system: false,
    sort_order: 0,
  })

  if (error) {
    console.error("Failed to create category:", error)
    return { error: "カテゴリの作成に失敗しました" }
  }

  revalidatePath("/categories")
  return { success: true }
}

// Update a category
export async function updateCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const parentId = formData.get("parent_id") as string | null
  const icon = formData.get("icon") as string
  const color = formData.get("color") as string

  if (!id) {
    return { error: "カテゴリIDが必要です" }
  }

  if (!name || name.trim() === "") {
    return { error: "カテゴリ名を入力してください" }
  }

  if (isDevMode()) {
    const index = mockCategoriesStore.findIndex((c) => c.id === id)
    if (index === -1) {
      return { error: "カテゴリが見つかりません" }
    }

    const category = mockCategoriesStore[index]
    if (category.is_system) {
      return { error: "システムカテゴリは編集できません" }
    }

    mockCategoriesStore[index] = {
      ...category,
      name: name.trim(),
      parent_id: parentId || null,
      icon: icon || category.icon,
      color: color || category.color,
      updated_at: new Date().toISOString(),
    }

    revalidatePath("/categories")
    return { success: true }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { error: "データベース接続に失敗しました" }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any)
    .update({
      name: name.trim(),
      parent_id: parentId || null,
      icon: icon,
      color: color,
    })
    .eq("id", id)
    .eq("is_system", false)

  if (error) {
    console.error("Failed to update category:", error)
    return { error: "カテゴリの更新に失敗しました" }
  }

  revalidatePath("/categories")
  return { success: true }
}

// Delete a category
export async function deleteCategory(
  id: string
): Promise<CategoryActionState> {
  if (!id) {
    return { error: "カテゴリIDが必要です" }
  }

  if (isDevMode()) {
    const category = mockCategoriesStore.find((c) => c.id === id)
    if (!category) {
      return { error: "カテゴリが見つかりません" }
    }

    if (category.is_system) {
      return { error: "システムカテゴリは削除できません" }
    }

    // Check for child categories
    const hasChildren = mockCategoriesStore.some((c) => c.parent_id === id)
    if (hasChildren) {
      return { error: "子カテゴリが存在するため削除できません。先に子カテゴリを削除してください" }
    }

    mockCategoriesStore = mockCategoriesStore.filter((c) => c.id !== id)
    revalidatePath("/categories")
    return { success: true }
  }

  const supabase = await createClient()
  if (!supabase) {
    return { error: "データベース接続に失敗しました" }
  }

  // Check if category is system category
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: category } = await (supabase.from("categories") as any)
    .select("is_system")
    .eq("id", id)
    .single() as { data: { is_system: boolean } | null }

  if (category?.is_system) {
    return { error: "システムカテゴリは削除できません" }
  }

  // Check for child categories
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: children } = await (supabase.from("categories") as any)
    .select("id")
    .eq("parent_id", id)
    .limit(1) as { data: { id: string }[] | null }

  if (children && children.length > 0) {
    return { error: "子カテゴリが存在するため削除できません。先に子カテゴリを削除してください" }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("categories") as any)
    .delete()
    .eq("id", id)
    .eq("is_system", false)

  if (error) {
    console.error("Failed to delete category:", error)
    return { error: "カテゴリの削除に失敗しました" }
  }

  revalidatePath("/categories")
  return { success: true }
}

// Helper function to build tree from flat array
function buildCategoryTreeFromArray(categories: Category[]): CategoryTreeNode[] {
  const rootCategories = categories.filter((c) => c.parent_id === null)

  function buildNode(category: Category): CategoryTreeNode {
    const children = categories.filter((c) => c.parent_id === category.id)
    return {
      ...category,
      children: children.map(buildNode).sort((a, b) => a.sort_order - b.sort_order),
    }
  }

  return rootCategories
    .map(buildNode)
    .sort((a, b) => a.sort_order - b.sort_order)
}
