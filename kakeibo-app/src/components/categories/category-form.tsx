"use client"

import { useActionState, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createCategory,
  updateCategory,
  type CategoryActionState,
} from "@/lib/actions/categories"
import { categoryIcons, categoryColors } from "@/lib/mock-data/categories"
import type { Category, TransactionType } from "@/types/database"
import * as LucideIcons from "lucide-react"

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  transactionType: TransactionType
  parentCategories: Category[]
}

const initialState: CategoryActionState = {}

export function CategoryForm({
  open,
  onOpenChange,
  category,
  transactionType,
  parentCategories,
}: CategoryFormProps) {
  const isEditing = !!category

  const [state, formAction, isPending] = useActionState(
    isEditing ? updateCategory : createCategory,
    initialState
  )

  const [selectedIcon, setSelectedIcon] = useState(category?.icon || "ellipsis")
  const [selectedColor, setSelectedColor] = useState(category?.color || "#64748b")
  const [selectedParent, setSelectedParent] = useState<string>(
    category?.parent_id || ""
  )

  // Reset form when dialog opens with new category
  useEffect(() => {
    if (open) {
      setSelectedIcon(category?.icon || "ellipsis")
      setSelectedColor(category?.color || "#64748b")
      setSelectedParent(category?.parent_id || "")
    }
  }, [open, category])

  // Close dialog on success
  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

  // Render icon component
  const renderIcon = (iconName: string, className?: string) => {
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
      iconName
        .split("-")
        .map((part, i) =>
          i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
        )
        .join("")
        .replace(/^./, (c) => c.toUpperCase())
    ]
    if (!IconComponent) return null
    return <IconComponent className={className} />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "カテゴリを編集" : "新規カテゴリ"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "カテゴリの情報を編集します"
              : "新しいカテゴリを作成します"}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {isEditing && <input type="hidden" name="id" value={category.id} />}
          <input type="hidden" name="transaction_type" value={transactionType} />
          <input type="hidden" name="icon" value={selectedIcon} />
          <input type="hidden" name="color" value={selectedColor} />
          <input
            type="hidden"
            name="parent_id"
            value={selectedParent || ""}
          />

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">カテゴリ名</Label>
            <Input
              id="name"
              name="name"
              defaultValue={category?.name || ""}
              placeholder="カテゴリ名を入力"
              required
            />
          </div>

          {/* Parent category */}
          <div className="space-y-2">
            <Label>親カテゴリ</Label>
            <Select value={selectedParent} onValueChange={setSelectedParent}>
              <SelectTrigger>
                <SelectValue placeholder="なし（トップレベル）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">なし（トップレベル）</SelectItem>
                {parentCategories
                  .filter((c) => c.id !== category?.id && !c.parent_id)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Icon selection */}
          <div className="space-y-2">
            <Label>アイコン</Label>
            <div className="grid grid-cols-8 gap-2 rounded-lg border p-2 max-h-32 overflow-y-auto">
              {categoryIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                    selectedIcon === icon
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  {renderIcon(icon, "h-4 w-4")}
                </button>
              ))}
            </div>
          </div>

          {/* Color selection */}
          <div className="space-y-2">
            <Label>色</Label>
            <div className="flex flex-wrap gap-2">
              {categoryColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    selectedColor === color
                      ? "ring-2 ring-primary ring-offset-2 scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Error message */}
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "保存中..." : isEditing ? "更新" : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
