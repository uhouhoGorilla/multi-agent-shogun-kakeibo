"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ArrowUpDown } from "lucide-react";

interface SummaryData {
  income: number;
  expense: number;
  balance: number;
  previousMonthDiff: number;
}

// モックデータ
const mockData: SummaryData = {
  income: 350000,
  expense: 245000,
  balance: 105000,
  previousMonthDiff: 12.5,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

export function SummaryCards() {
  const data = mockData;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 今月の収入 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月の収入</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(data.income)}
          </div>
          <p className="text-xs text-muted-foreground">給与・副収入など</p>
        </CardContent>
      </Card>

      {/* 今月の支出 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月の支出</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(data.expense)}
          </div>
          <p className="text-xs text-muted-foreground">食費・光熱費など</p>
        </CardContent>
      </Card>

      {/* 今月の残高 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">今月の残高</CardTitle>
          <Wallet className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(data.balance)}
          </div>
          <p className="text-xs text-muted-foreground">収入 - 支出</p>
        </CardContent>
      </Card>

      {/* 前月比 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">前月比</CardTitle>
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              data.previousMonthDiff >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {data.previousMonthDiff >= 0 ? "+" : ""}
            {data.previousMonthDiff.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">残高の変動率</p>
        </CardContent>
      </Card>
    </div>
  );
}
