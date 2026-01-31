"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FileUploadProps {
  onFileSelect: (content: string, fileName: string) => void;
  accept?: string;
  maxSize?: number; // bytes
}

export function FileUpload({
  onFileSelect,
  accept = ".csv",
  maxSize = 5 * 1024 * 1024, // 5MB
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      // ファイルサイズチェック
      if (file.size > maxSize) {
        setError(
          `ファイルサイズが大きすぎます（最大${Math.round(maxSize / 1024 / 1024)}MB）`
        );
        return;
      }

      // 拡張子チェック
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setError("CSVファイルを選択してください");
        return;
      }

      setIsLoading(true);
      setSelectedFile(file);

      try {
        // ファイル読み込み（Shift_JIS対応）
        const content = await readFileWithEncoding(file);
        onFileSelect(content, file.name);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "ファイルの読み込みに失敗しました"
        );
        setSelectedFile(null);
      } finally {
        setIsLoading(false);
      }
    },
    [maxSize, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
      >
        <CardContent className="p-8">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="flex flex-col items-center justify-center gap-4"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">読み込み中...</p>
              </div>
            ) : selectedFile ? (
              <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-lg font-medium">
                    CSVファイルをドラッグ＆ドロップ
                  </p>
                  <p className="text-sm text-muted-foreground">
                    または下のボタンからファイルを選択
                  </p>
                </div>
                <label>
                  <input
                    type="file"
                    accept={accept}
                    onChange={handleInputChange}
                    className="hidden"
                  />
                  <Button type="button" variant="outline" asChild>
                    <span>ファイルを選択</span>
                  </Button>
                </label>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

// Shift_JIS/UTF-8対応のファイル読み込み
async function readFileWithEncoding(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(buffer);

  // まずUTF-8として読み込みを試行
  try {
    const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
    return utf8Decoder.decode(uint8Array);
  } catch {
    // UTF-8で失敗したらShift_JISとして読み込み
    try {
      const sjisDecoder = new TextDecoder("shift_jis");
      return sjisDecoder.decode(uint8Array);
    } catch {
      // それでも失敗したらUTF-8（エラー無視）
      const fallbackDecoder = new TextDecoder("utf-8", { fatal: false });
      return fallbackDecoder.decode(uint8Array);
    }
  }
}
