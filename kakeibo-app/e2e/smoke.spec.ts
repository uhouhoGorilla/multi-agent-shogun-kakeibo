import { test, expect } from '@playwright/test'

const pages = [
  { path: '/', title: '家計簿アプリ', label: 'トップページ' },
  { path: '/login', label: 'ログインページ' },
  { path: '/signup', label: '新規登録ページ' },
  { path: '/dashboard', label: 'ダッシュボード' },
  { path: '/transactions', label: '取引一覧' },
  { path: '/categories', label: 'カテゴリ管理' },
  { path: '/loans', label: 'ローン管理' },
  { path: '/import', label: 'CSVインポート' },
  { path: '/reports', label: 'レポート' },
]

for (const page of pages) {
  test(`${page.label} (${page.path}) が正常に表示される`, async ({ page: p }) => {
    const response = await p.goto(page.path)
    expect(response).not.toBeNull()
    expect(response!.status()).toBeLessThan(500)

    if (page.title) {
      await expect(p.getByText(page.title)).toBeVisible()
    }

    // JSエラーがないことを確認
    const errors: string[] = []
    p.on('pageerror', (err) => errors.push(err.message))
    await p.waitForTimeout(500)
    expect(errors).toEqual([])
  })
}
