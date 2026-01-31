"use client";

import { useState, useCallback } from "react";
import { Upload, CreditCard, Building2, CheckCircle } from "lucide-react";
import { FileUpload } from "@/components/import/file-upload";
import { PreviewTable } from "@/components/import/preview-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { previewCSV, importBankCSV, type ImportResult } from "@/lib/actions/import";
import type { ParseResult } from "@/lib/csv-parsers";

type ImportStep = "select" | "preview" | "complete";
type ImportType = "bank" | "card";

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("select");
  const [importType, setImportType] = useState<ImportType>("bank");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = useCallback(
    async (content: string, name: string) => {
      setCsvContent(content);
      setFileName(name);

      // プレビュー用にパース
      const result = await previewCSV(content);
      setParseResult(result);
      setStep("preview");
    },
    []
  );

  const handleImport = useCallback(async () => {
    if (!csvContent) return;

    setIsImporting(true);
    try {
      const result = await importBankCSV(csvContent);
      setImportResult(result);
      if (result.success) {
        setStep("complete");
      }
    } finally {
      setIsImporting(false);
    }
  }, [csvContent]);

  const handleCancel = useCallback(() => {
    setStep("select");
    setParseResult(null);
    setCsvContent("");
    setFileName("");
  }, []);

  const handleReset = useCallback(() => {
    setStep("select");
    setParseResult(null);
    setImportResult(null);
    setCsvContent("");
    setFileName("");
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          CSVインポート
        </h1>
        <p className="text-muted-foreground">
          銀行やクレジットカードの明細CSVファイルをインポートします
        </p>
      </div>

      {/* ステップ1: ファイル選択 */}
      {step === "select" && (
        <Tabs
          value={importType}
          onValueChange={(v) => setImportType(v as ImportType)}
        >
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="bank" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              銀行
            </TabsTrigger>
            <TabsTrigger value="card" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              クレジットカード
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bank" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <FileUpload onFileSelect={handleFileSelect} />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">対応銀行</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        楽天銀行
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        みずほ銀行
                      </li>
                    </ul>
                    <p className="mt-4 text-xs text-muted-foreground">
                      ※銀行のオンラインバンキングからダウンロードしたCSVファイルに対応しています
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">使い方</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        1
                      </span>
                      <span>
                        楽天銀行またはみずほ銀行のオンラインバンキングにログイン
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        2
                      </span>
                      <span>
                        入出金明細画面からCSVファイルをダウンロード
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        3
                      </span>
                      <span>
                        上のエリアにCSVファイルをドラッグ＆ドロップ
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        4
                      </span>
                      <span>
                        プレビューを確認してインポートを実行
                      </span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="card" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <FileUpload onFileSelect={handleFileSelect} />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">対応カード</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        楽天カード
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        セゾンカード
                      </li>
                    </ul>
                    <p className="mt-4 text-xs text-muted-foreground">
                      ※カード会社のWebサイトからダウンロードしたCSVファイルに対応しています
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">使い方</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        1
                      </span>
                      <span>
                        カード会社のWebサイト（楽天e-NAVI、Netアンサー等）にログイン
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        2
                      </span>
                      <span>
                        利用明細画面からCSVファイルをダウンロード
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        3
                      </span>
                      <span>
                        上のエリアにCSVファイルをドラッグ＆ドロップ
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        4
                      </span>
                      <span>
                        プレビューを確認してインポートを実行
                      </span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* ステップ2: プレビュー */}
      {step === "preview" && parseResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            <span>{fileName}</span>
          </div>
          <PreviewTable
            result={parseResult}
            onImport={handleImport}
            onCancel={handleCancel}
            isImporting={isImporting}
          />
        </div>
      )}

      {/* ステップ3: 完了 */}
      {step === "complete" && importResult && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">インポート完了</h2>
              <p className="text-muted-foreground">{importResult.message}</p>

              <div className="mt-4 grid gap-4 text-center md:grid-cols-3">
                <div>
                  <p className="text-3xl font-bold">{importResult.importedCount}</p>
                  <p className="text-sm text-muted-foreground">件の取引</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">
                    +¥{importResult.totalIncome.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">収入合計</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-red-600">
                    -¥{importResult.totalExpense.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">支出合計</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Upload className="h-4 w-4" />
                  別のファイルをインポート
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
