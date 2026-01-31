import type { Category, TransactionType } from "@/types/database"

// Default expense categories
const expenseCategories: Omit<Category, "user_id" | "created_at" | "updated_at">[] = [
  // Food & Dining
  {
    id: "cat-expense-food",
    name: "食費",
    parent_id: null,
    transaction_type: "expense",
    color: "#ef4444",
    icon: "utensils",
    is_system: true,
    sort_order: 1,
  },
  {
    id: "cat-expense-food-groceries",
    name: "食料品",
    parent_id: "cat-expense-food",
    transaction_type: "expense",
    color: "#ef4444",
    icon: "shopping-basket",
    is_system: true,
    sort_order: 1,
  },
  {
    id: "cat-expense-food-dining",
    name: "外食",
    parent_id: "cat-expense-food",
    transaction_type: "expense",
    color: "#ef4444",
    icon: "utensils-crossed",
    is_system: true,
    sort_order: 2,
  },
  // Daily necessities
  {
    id: "cat-expense-daily",
    name: "日用品",
    parent_id: null,
    transaction_type: "expense",
    color: "#f97316",
    icon: "shopping-basket",
    is_system: true,
    sort_order: 2,
  },
  // Transportation
  {
    id: "cat-expense-transport",
    name: "交通費",
    parent_id: null,
    transaction_type: "expense",
    color: "#eab308",
    icon: "train-front",
    is_system: true,
    sort_order: 3,
  },
  {
    id: "cat-expense-transport-train",
    name: "電車・バス",
    parent_id: "cat-expense-transport",
    transaction_type: "expense",
    color: "#eab308",
    icon: "train-front",
    is_system: true,
    sort_order: 1,
  },
  {
    id: "cat-expense-transport-car",
    name: "車・ガソリン",
    parent_id: "cat-expense-transport",
    transaction_type: "expense",
    color: "#eab308",
    icon: "car",
    is_system: true,
    sort_order: 2,
  },
  // Housing
  {
    id: "cat-expense-housing",
    name: "住居費",
    parent_id: null,
    transaction_type: "expense",
    color: "#22c55e",
    icon: "home",
    is_system: true,
    sort_order: 4,
  },
  // Utilities
  {
    id: "cat-expense-utilities",
    name: "水道光熱費",
    parent_id: null,
    transaction_type: "expense",
    color: "#14b8a6",
    icon: "lightbulb",
    is_system: true,
    sort_order: 5,
  },
  {
    id: "cat-expense-utilities-electric",
    name: "電気",
    parent_id: "cat-expense-utilities",
    transaction_type: "expense",
    color: "#14b8a6",
    icon: "zap",
    is_system: true,
    sort_order: 1,
  },
  {
    id: "cat-expense-utilities-gas",
    name: "ガス",
    parent_id: "cat-expense-utilities",
    transaction_type: "expense",
    color: "#14b8a6",
    icon: "flame",
    is_system: true,
    sort_order: 2,
  },
  {
    id: "cat-expense-utilities-water",
    name: "水道",
    parent_id: "cat-expense-utilities",
    transaction_type: "expense",
    color: "#14b8a6",
    icon: "droplets",
    is_system: true,
    sort_order: 3,
  },
  // Communication
  {
    id: "cat-expense-communication",
    name: "通信費",
    parent_id: null,
    transaction_type: "expense",
    color: "#3b82f6",
    icon: "smartphone",
    is_system: true,
    sort_order: 6,
  },
  // Medical
  {
    id: "cat-expense-medical",
    name: "医療費",
    parent_id: null,
    transaction_type: "expense",
    color: "#8b5cf6",
    icon: "heart-pulse",
    is_system: true,
    sort_order: 7,
  },
  // Education
  {
    id: "cat-expense-education",
    name: "教育費",
    parent_id: null,
    transaction_type: "expense",
    color: "#ec4899",
    icon: "graduation-cap",
    is_system: true,
    sort_order: 8,
  },
  // Entertainment
  {
    id: "cat-expense-entertainment",
    name: "娯楽費",
    parent_id: null,
    transaction_type: "expense",
    color: "#f43f5e",
    icon: "gamepad-2",
    is_system: true,
    sort_order: 9,
  },
  // Clothing
  {
    id: "cat-expense-clothing",
    name: "衣服・美容",
    parent_id: null,
    transaction_type: "expense",
    color: "#d946ef",
    icon: "shirt",
    is_system: true,
    sort_order: 10,
  },
  // Insurance
  {
    id: "cat-expense-insurance",
    name: "保険",
    parent_id: null,
    transaction_type: "expense",
    color: "#6366f1",
    icon: "shield",
    is_system: true,
    sort_order: 11,
  },
  // Loan
  {
    id: "cat-expense-loan",
    name: "ローン返済",
    parent_id: null,
    transaction_type: "expense",
    color: "#64748b",
    icon: "credit-card",
    is_system: true,
    sort_order: 12,
  },
  // Other
  {
    id: "cat-expense-other",
    name: "その他支出",
    parent_id: null,
    transaction_type: "expense",
    color: "#94a3b8",
    icon: "ellipsis",
    is_system: true,
    sort_order: 99,
  },
]

// Default income categories
const incomeCategories: Omit<Category, "user_id" | "created_at" | "updated_at">[] = [
  {
    id: "cat-income-salary",
    name: "給与",
    parent_id: null,
    transaction_type: "income",
    color: "#22c55e",
    icon: "briefcase",
    is_system: true,
    sort_order: 1,
  },
  {
    id: "cat-income-bonus",
    name: "賞与",
    parent_id: null,
    transaction_type: "income",
    color: "#16a34a",
    icon: "gift",
    is_system: true,
    sort_order: 2,
  },
  {
    id: "cat-income-sidejob",
    name: "副業",
    parent_id: null,
    transaction_type: "income",
    color: "#15803d",
    icon: "laptop",
    is_system: true,
    sort_order: 3,
  },
  {
    id: "cat-income-investment",
    name: "投資収益",
    parent_id: null,
    transaction_type: "income",
    color: "#166534",
    icon: "trending-up",
    is_system: true,
    sort_order: 4,
  },
  {
    id: "cat-income-temporary",
    name: "臨時収入",
    parent_id: null,
    transaction_type: "income",
    color: "#14532d",
    icon: "sparkles",
    is_system: true,
    sort_order: 5,
  },
  {
    id: "cat-income-other",
    name: "その他収入",
    parent_id: null,
    transaction_type: "income",
    color: "#94a3b8",
    icon: "ellipsis",
    is_system: true,
    sort_order: 99,
  },
]

// Mock user categories (custom categories)
const userCategories: Omit<Category, "created_at" | "updated_at">[] = [
  {
    id: "cat-user-1",
    user_id: "mock-user-id",
    name: "コーヒー",
    parent_id: "cat-expense-food",
    transaction_type: "expense",
    color: "#78350f",
    icon: "coffee",
    is_system: false,
    sort_order: 3,
  },
  {
    id: "cat-user-2",
    user_id: "mock-user-id",
    name: "サブスク",
    parent_id: null,
    transaction_type: "expense",
    color: "#7c3aed",
    icon: "repeat",
    is_system: false,
    sort_order: 13,
  },
]

// Helper function to add timestamps
const now = new Date().toISOString()

function addTimestamps<T extends object>(
  items: T[]
): (T & { created_at: string; updated_at: string })[] {
  return items.map((item) => ({
    ...item,
    created_at: now,
    updated_at: now,
  }))
}

// All mock categories with user_id set to null for system categories
export const mockCategories: Category[] = [
  ...addTimestamps(
    expenseCategories.map((c) => ({ ...c, user_id: null }))
  ) as Category[],
  ...addTimestamps(
    incomeCategories.map((c) => ({ ...c, user_id: null }))
  ) as Category[],
  ...addTimestamps(userCategories) as Category[],
]

// Get categories by type
export function getCategoriesByType(type: TransactionType): Category[] {
  return mockCategories.filter((c) => c.transaction_type === type)
}

// Get root categories (no parent)
export function getRootCategories(type: TransactionType): Category[] {
  return mockCategories.filter(
    (c) => c.transaction_type === type && c.parent_id === null
  )
}

// Get child categories
export function getChildCategories(parentId: string): Category[] {
  return mockCategories.filter((c) => c.parent_id === parentId)
}

// Build category tree
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

export function buildCategoryTree(type: TransactionType): CategoryTreeNode[] {
  const rootCategories = getRootCategories(type)

  function buildNode(category: Category): CategoryTreeNode {
    const children = getChildCategories(category.id)
    return {
      ...category,
      children: children.map(buildNode),
    }
  }

  return rootCategories.map(buildNode)
}

// Available icons for category selection
export const categoryIcons = [
  "utensils",
  "shopping-basket",
  "utensils-crossed",
  "train-front",
  "car",
  "bus",
  "plane",
  "home",
  "lightbulb",
  "zap",
  "flame",
  "droplets",
  "smartphone",
  "wifi",
  "heart-pulse",
  "pill",
  "graduation-cap",
  "book",
  "gamepad-2",
  "music",
  "film",
  "shirt",
  "scissors",
  "shield",
  "credit-card",
  "banknote",
  "briefcase",
  "gift",
  "laptop",
  "trending-up",
  "sparkles",
  "coffee",
  "beer",
  "cake",
  "baby",
  "dog",
  "cat",
  "flower-2",
  "dumbbell",
  "repeat",
  "ellipsis",
] as const

export type CategoryIcon = (typeof categoryIcons)[number]

// Available colors for category selection
export const categoryColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#64748b", // slate
  "#78350f", // brown
  "#7c3aed", // purple
] as const
