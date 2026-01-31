/**
 * Mock User for Development Mode
 * Used when Supabase is not configured
 */

export interface MockUser {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
}

export const mockUser: MockUser = {
  id: 'dev-user-001',
  email: 'dev@example.com',
  displayName: '開発ユーザー',
  avatarUrl: undefined,
}

/**
 * Check if running in development mode (Supabase not configured)
 */
export function isDevMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
