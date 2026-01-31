"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  Upload,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"

const navigationItems = [
  {
    title: "ダッシュボード",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "取引一覧",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    title: "カテゴリ管理",
    href: "/categories",
    icon: Tags,
  },
  {
    title: "データインポート",
    href: "/import",
    icon: Upload,
  },
  // TODO: Phase 4以降で実装
  // { title: "口座管理", href: "/accounts", icon: Wallet },
  // { title: "クレジットカード", href: "/credit-cards", icon: CreditCard },
  // { title: "ローン管理", href: "/loans", icon: Receipt },
  // { title: "予算設定", href: "/budgets", icon: PiggyBank },
  // { title: "レポート", href: "/reports", icon: BarChart3 },
  // { title: "設定", href: "/settings", icon: Settings },
]

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex flex-col gap-1 p-4", className)}>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}

export function SidebarDesktop() {
  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Wallet className="h-6 w-6" />
          <span>家計簿</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Sidebar />
      </div>
    </aside>
  )
}
