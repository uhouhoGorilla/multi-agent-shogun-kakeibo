import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/layout/header"
import { SidebarDesktop } from "@/components/layout/sidebar"
import { mockUser, isDevMode } from "@/lib/mock-user"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Development mode: Supabase not configured
  if (!supabase || isDevMode()) {
    const devUserData = {
      email: mockUser.email,
      displayName: mockUser.displayName,
      avatarUrl: mockUser.avatarUrl,
    }

    return (
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <SidebarDesktop />

        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          {/* Header with mock user */}
          <Header user={devUserData} />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {/* Development mode warning */}
            <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔧</span>
                <div>
                  <strong>開発モード</strong>
                  <p className="mt-1 text-xs">
                    Supabase未設定のため、認証なしで表示しています。
                    本番環境では .env.local に環境変数を設定してください。
                  </p>
                </div>
              </div>
            </div>
            {children}
          </main>
        </div>
      </div>
    )
  }

  // Production mode: Supabase configured
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user profile (table may not exist yet during development)
  type UserProfile = { display_name: string | null; avatar_url: string | null }
  let displayName: string | undefined
  let avatarUrl: string | undefined

  try {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .single()
    const profile = data as UserProfile | null
    displayName = profile?.display_name ?? undefined
    avatarUrl = profile?.avatar_url ?? undefined
  } catch {
    // Profile table may not exist yet
  }

  const userData = {
    email: user.email,
    displayName,
    avatarUrl,
  }

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <SidebarDesktop />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <Header user={userData} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
