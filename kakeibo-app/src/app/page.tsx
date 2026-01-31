import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">家計簿アプリ</CardTitle>
          <CardDescription className="text-base">
            シンプルで使いやすい家計簿管理
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-center text-sm text-muted-foreground">
            <p>収支を記録して、お金の流れを把握しましょう</p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/login" className="w-full">
              <Button className="w-full" size="lg">
                ログイン
              </Button>
            </Link>
            <Link href="/signup" className="w-full">
              <Button variant="outline" className="w-full" size="lg">
                新規登録
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
