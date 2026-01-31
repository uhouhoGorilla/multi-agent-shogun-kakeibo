// 楽天銀行 CSVパーサー
// フォーマット: 取引日,入出金(円),残高(円),入出金先内容

import {
  CSVParser,
  ParseResult,
  ParsedTransaction,
  ParseError,
  parseJapaneseDate,
  parseAmount,
  splitCSVLines,
  parseCSVLine,
} from "./types";

export const rakutenBankParser: CSVParser = {
  bankType: "rakuten-bank",
  bankName: "楽天銀行",

  detect(content: string): boolean {
    const lines = splitCSVLines(content);
    if (lines.length === 0) return false;

    const firstLine = lines[0].toLowerCase();
    // 楽天銀行のヘッダーパターン
    return (
      firstLine.includes("取引日") &&
      firstLine.includes("入出金") &&
      (firstLine.includes("残高") || firstLine.includes("入出金先"))
    );
  },

  parse(content: string): ParseResult {
    const lines = splitCSVLines(content);
    const transactions: ParsedTransaction[] = [];
    const errors: ParseError[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    if (lines.length === 0) {
      return {
        success: false,
        transactions: [],
        errors: [{ row: 0, message: "CSVファイルが空です" }],
        bankType: "rakuten-bank",
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    // ヘッダー行をスキップ（最初の行がヘッダーと仮定）
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    // カラムインデックスを特定
    let dateIndex = -1;
    let amountIndex = -1;
    let balanceIndex = -1;
    let descriptionIndex = -1;

    headers.forEach((header, index) => {
      const h = header.toLowerCase();
      if (h.includes("取引日") || h.includes("日付")) {
        dateIndex = index;
      } else if (h.includes("入出金") && !h.includes("先")) {
        amountIndex = index;
      } else if (h.includes("残高")) {
        balanceIndex = index;
      } else if (h.includes("入出金先") || h.includes("摘要") || h.includes("内容")) {
        descriptionIndex = index;
      }
    });

    // 必須カラムの確認
    if (dateIndex === -1 || amountIndex === -1) {
      return {
        success: false,
        transactions: [],
        errors: [
          {
            row: 0,
            message: "必須カラム（取引日、入出金）が見つかりません",
            rawLine: headerLine,
          },
        ],
        bankType: "rakuten-bank",
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    // データ行をパース
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const fields = parseCSVLine(line);

      try {
        const dateStr = fields[dateIndex] || "";
        const amountStr = fields[amountIndex] || "";
        const balanceStr = balanceIndex !== -1 ? fields[balanceIndex] : "";
        const description = descriptionIndex !== -1 ? fields[descriptionIndex] : "";

        // 日付パース
        const date = parseJapaneseDate(dateStr);
        if (!date) {
          errors.push({
            row: i + 1,
            message: `無効な日付形式: ${dateStr}`,
            rawLine: line,
          });
          continue;
        }

        // 金額パース
        const amount = parseAmount(amountStr);
        if (amount === 0 && amountStr.trim() !== "0") {
          errors.push({
            row: i + 1,
            message: `無効な金額: ${amountStr}`,
            rawLine: line,
          });
          continue;
        }

        // 収入/支出判定
        const type = amount >= 0 ? "income" : "expense";
        const absAmount = Math.abs(amount);

        if (type === "income") {
          totalIncome += absAmount;
        } else {
          totalExpense += absAmount;
        }

        // 残高
        const balance = balanceStr ? parseAmount(balanceStr) : undefined;

        // rawDataを構築
        const rawData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rawData[header] = fields[index] || "";
        });

        transactions.push({
          date,
          description: description || "（摘要なし）",
          amount: absAmount,
          type,
          balance,
          rawData,
        });
      } catch (error) {
        errors.push({
          row: i + 1,
          message: `パースエラー: ${error instanceof Error ? error.message : "不明なエラー"}`,
          rawLine: line,
        });
      }
    }

    return {
      success: errors.length === 0 || transactions.length > 0,
      transactions,
      errors,
      bankType: "rakuten-bank",
      totalIncome,
      totalExpense,
    };
  },
};
