"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BarChart3, PieChart } from "lucide-react";

export function ChartsPlaceholder() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* 収支推移グラフ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            収支推移
          </CardTitle>
          <CardDescription>過去6ヶ月の収入・支出の推移</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                グラフはPhase 5で実装予定
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* カテゴリ別円グラフ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            カテゴリ別支出
          </CardTitle>
          <CardDescription>今月のカテゴリ別支出割合</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
            <div className="text-center">
              <PieChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                グラフはPhase 5で実装予定
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
