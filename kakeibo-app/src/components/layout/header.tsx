"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Wallet, User, LogOut, Settings } from "lucide-react"
import { logout } from "@/lib/actions/auth"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"

interface HeaderProps {
  user?: {
    email?: string
    displayName?: string
    avatarUrl?: string
  }
}

export function Header({ user }: HeaderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return "U"
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile menu button */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">メニューを開く</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="flex h-14 items-center border-b px-4">
            <SheetTitle className="flex items-center gap-2">
              <Wallet className="h-6 w-6" />
              <span>家計簿</span>
            </SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setIsSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Mobile logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 font-semibold lg:hidden"
      >
        <Wallet className="h-6 w-6" />
        <span>家計簿</span>
      </Link>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={user?.avatarUrl}
                alt={user?.displayName || user?.email || "User"}
              />
              <AvatarFallback>
                {getInitials(user?.displayName, user?.email)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              {user?.displayName && (
                <p className="text-sm font-medium leading-none">
                  {user.displayName}
                </p>
              )}
              {user?.email && (
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings/profile" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              プロフィール
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              設定
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
