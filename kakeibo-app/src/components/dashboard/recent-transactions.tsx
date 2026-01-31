"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: "income" | "expense";
}

// モックデータ
const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "2026-01-30",
    description: "スーパーマーケット",
    category: "食費",
    amount: 3500,
    type: "expense",
  },
  {
    id: "2",
    date: "2026-01-29",
    description: "給与",
    category: "収入",
    amount: 300000,
    type: "income",
  },
  {
    id: "3",
    date: "2026-01-28",
    description: "電気代",
    category: "光熱費",
    amount: 8500,
    type: "expense",
  },
  {
    id: "4",
    date: "2026-01-27",
    description: "ランチ",
    category: "食費",
    amount: 980,
    type: "expense",
  },
  {
    id: "5",
    date: "2026-01-26",
    description: "副業報酬",
    category: "収入",
    amount: 50000,
    type: "income",
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function RecentTransactions() {
  const transactions = mockTransactions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>直近の取引</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{transaction.description}</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formatDate(transaction.date)}</span>
                  <span>•</span>
                  <span>{transaction.category}</span>
                </div>
              </div>
              <span
                className={`font-semibold ${
                  transaction.type === "income"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/transactions">
            もっと見る
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
