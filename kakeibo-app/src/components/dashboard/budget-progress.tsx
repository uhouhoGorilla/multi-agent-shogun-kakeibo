"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  color: string;
}

// モックデータ
const mockBudgets: BudgetCategory[] = [
  {
    id: "1",
    name: "食費",
    budget: 50000,
    spent: 35000,
    color: "bg-orange-500",
  },
  {
    id: "2",
    name: "光熱費",
    budget: 20000,
    spent: 18500,
    color: "bg-yellow-500",
  },
  {
    id: "3",
    name: "交通費",
    budget: 15000,
    spent: 8000,
    color: "bg-blue-500",
  },
  {
    id: "4",
    name: "娯楽",
    budget: 30000,
    spent: 12000,
    color: "bg-purple-500",
  },
  {
    id: "5",
    name: "日用品",
    budget: 10000,
    spent: 6500,
    color: "bg-green-500",
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

export function BudgetProgress() {
  const budgets = mockBudgets;

  return (
    <Card>
      <CardHeader>
        <CardTitle>予算進捗</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {budgets.map((budget) => {
            const percentage = Math.min(
              Math.round((budget.spent / budget.budget) * 100),
              100
            );
            const isOverBudget = budget.spent > budget.budget;

            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{budget.name}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.budget)}
                  </span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOverBudget ? "bg-red-500" : budget.color
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{percentage}% 消化</span>
                  {isOverBudget ? (
                    <span className="text-red-500 font-medium">
                      {formatCurrency(budget.spent - budget.budget)} 超過
                    </span>
                  ) : (
                    <span>
                      残り {formatCurrency(budget.budget - budget.spent)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
