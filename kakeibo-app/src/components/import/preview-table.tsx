"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ParseResult, CardParseResult } from "@/lib/csv-parsers";

interface PreviewTableProps {
  result: ParseResult | CardParseResult;
  onImport: () => void;
  onCancel: () => void;
  isImporting: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
  }).format(amount);
}

const bankNames: Record<string, string> = {
  "rakuten-bank": "楽天銀行",
  "mizuho-bank": "みずほ銀行",
  unknown: "不明",
};

const cardNames: Record<string, string> = {
  "rakuten-card": "楽天カード",
  "saison-card": "セゾンカード",
  "unknown-card": "不明",
};

function isBankResult(result: ParseResult | CardParseResult): result is ParseResult {
  return "bankType" in result;
}

export function PreviewTable({
  result,
  onImport,
  onCancel,
  isImporting,
}: PreviewTableProps) {
  const { transactions, errors } = result;
  const isBank = isBankResult(result);

  return (
    <div className="space-y-6">
      {/* サマリー */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {isBank ? "検出された銀行" : "検出されたカード"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {isBank
                ? bankNames[result.bankType] || result.bankType
                : cardNames[result.cardType] || result.cardType}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {isBank ? "取引件数" : "明細件数"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{transactions.length}件</p>
          </CardContent>
        </Card>
        {isBank ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>合計収入</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(result.totalIncome)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>合計支出</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(result.totalExpense)}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>利用合計</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(result.totalExpense)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>返金合計</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(result.totalRefund)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* エラー表示 */}
      {errors.length > 0 && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              パース警告 ({errors.length}件)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="max-h-32 overflow-y-auto space-y-1 text-sm">
              {errors.slice(0, 10).map((error, index) => (
                <li key={index} className="text-muted-foreground">
                  行{error.row}: {error.message}
                </li>
              ))}
              {errors.length > 10 && (
                <li className="text-muted-foreground">
                  ...他{errors.length - 10}件
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 取引プレビュー */}
      {transactions.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{isBank ? "取引プレビュー" : "明細プレビュー"}</CardTitle>
            <CardDescription>
              最初の10件を表示しています（全{transactions.length}件）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">日付</th>
                    <th className="py-2 text-left font-medium">
                      {isBank ? "摘要" : "利用先"}
                    </th>
                    <th className="py-2 text-right font-medium">金額</th>
                    <th className="py-2 text-right font-medium">
                      {isBank ? "残高" : "支払方法"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 10).map((tx, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2">
                        {format(tx.date, "yyyy/MM/dd", { locale: ja })}
                      </td>
                      <td className="py-2 max-w-[200px] truncate">
                        {tx.description}
                      </td>
                      <td
                        className={`py-2 text-right ${
                          tx.type === "income" || tx.type === "refund"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.type === "income" || tx.type === "refund" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {isBank
                          ? "balance" in tx && tx.balance !== undefined
                            ? formatCurrency(tx.balance)
                            : "-"
                          : "paymentMethod" in tx && tx.paymentMethod
                            ? tx.paymentMethod
                            : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-destructive">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-2 text-destructive">
              <XCircle className="h-12 w-12" />
              <p className="font-medium">
                {isBank ? "取引データ" : "明細データ"}が見つかりませんでした
              </p>
              <p className="text-sm text-muted-foreground">
                CSVファイルの形式を確認してください
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* アクションボタン */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isImporting}>
          キャンセル
        </Button>
        <Button
          onClick={onImport}
          disabled={transactions.length === 0 || isImporting}
        >
          {isImporting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              インポート中...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              {transactions.length}件をインポート
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
