'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loginSchema, signupSchema } from '@/lib/validations/auth'

export type AuthActionState = {
  error?: string
  success?: boolean
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  // Validate input
  const validatedData = loginSchema.safeParse(rawData)
  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message }
  }

  const supabase = await createClient()

  // Check if Supabase is configured
  if (!supabase) {
    return { error: 'Supabaseが設定されていません。.env.localを確認してください。' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: validatedData.data.email,
    password: validatedData.data.password,
  })

  if (error) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  redirect('/dashboard')
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  // Validate input
  const validatedData = signupSchema.safeParse(rawData)
  if (!validatedData.success) {
    return { error: validatedData.error.issues[0].message }
  }

  const supabase = await createClient()

  // Check if Supabase is configured
  if (!supabase) {
    return { error: 'Supabaseが設定されていません。.env.localを確認してください。' }
  }

  const { error } = await supabase.auth.signUp({
    email: validatedData.data.email,
    password: validatedData.data.password,
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'このメールアドレスは既に登録されています' }
    }
    return { error: 'アカウント作成に失敗しました。もう一度お試しください' }
  }

  return { success: true }
}

export async function logout(): Promise<void> {
  const supabase = await createClient()

  // Check if Supabase is configured
  if (supabase) {
    await supabase.auth.signOut()
  }

  redirect('/login')
}
