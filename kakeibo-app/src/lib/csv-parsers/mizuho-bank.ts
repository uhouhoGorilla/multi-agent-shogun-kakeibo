// みずほ銀行 CSVパーサー
// フォーマット: 日付,摘要,お支払金額,お預り金額,残高 または類似形式
// 注意: みずほダイレクトからダウンロードしたCSVは先頭にメタデータ行がある

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

// みずほ銀行のヘッダー行を検出するパターン
const MIZUHO_HEADER_PATTERNS = [
  "明細通番",
  "取引日",
  "日付",
];

// ヘッダー行を見つける（メタデータをスキップ）
// 複合条件（日付+摘要+金額カラム）を満たす行を探す
function findHeaderLineIndex(lines: string[]): number {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // isMizuhoHeader と同じ複合条件でチェック
    // これにより「照会期間開始日付」等のメタデータ行を誤検出しない
    if (isMizuhoHeader(line)) {
      return i;
    }
  }
  return -1;
}

// ヘッダー行かどうか判定
function isMizuhoHeader(line: string): boolean {
  // 日本語文字列はlowerCaseで変化しないが、一貫性のため維持
  const checkLine = line;
  return (
    (checkLine.includes("日付") || checkLine.includes("取引日") || checkLine.includes("明細通番")) &&
    (checkLine.includes("摘要") || checkLine.includes("お取引内容") || checkLine.includes("内容")) &&
    (checkLine.includes("お支払") ||
      checkLine.includes("お預り") ||
      checkLine.includes("お引出") ||
      checkLine.includes("お預入") ||
      checkLine.includes("出金") ||
      checkLine.includes("入金"))
  );
}

export const mizuhoBankParser: CSVParser = {
  bankType: "mizuho-bank",
  bankName: "みずほ銀行",

  detect(content: string): boolean {
    const lines = splitCSVLines(content);
    if (lines.length === 0) return false;

    // 先頭行がヘッダーの場合（シンプルなCSV）
    if (isMizuhoHeader(lines[0])) {
      return true;
    }

    // メタデータ付きCSVの場合、ヘッダー行を検索
    const headerIndex = findHeaderLineIndex(lines);
    if (headerIndex !== -1 && headerIndex < lines.length) {
      return isMizuhoHeader(lines[headerIndex]);
    }

    return false;
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
        bankType: "mizuho-bank",
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    // ヘッダー行を検索（メタデータをスキップ）
    let headerLineIndex = 0;
    if (!isMizuhoHeader(lines[0])) {
      headerLineIndex = findHeaderLineIndex(lines);
      if (headerLineIndex === -1) {
        return {
          success: false,
          transactions: [],
          errors: [{ row: 0, message: "ヘッダー行が見つかりません" }],
          bankType: "mizuho-bank",
          totalIncome: 0,
          totalExpense: 0,
        };
      }
    }

    const headerLine = lines[headerLineIndex];
    const headers = parseCSVLine(headerLine);

    // カラムインデックスを特定
    let dateIndex = -1;
    let descriptionIndex = -1;
    let withdrawalIndex = -1; // 出金（お支払）
    let depositIndex = -1; // 入金（お預り）
    let balanceIndex = -1;

    headers.forEach((header, index) => {
      const h = header.toLowerCase();
      if (h.includes("日付") || h.includes("取引日")) {
        dateIndex = index;
      } else if (h.includes("摘要") || h.includes("お取引内容") || h.includes("内容")) {
        descriptionIndex = index;
      } else if (h.includes("お支払") || h.includes("出金") || h.includes("支払") || h.includes("お引出")) {
        withdrawalIndex = index;
      } else if (h.includes("お預り") || h.includes("入金") || h.includes("預入") || h.includes("お預入")) {
        depositIndex = index;
      } else if (h.includes("残高")) {
        balanceIndex = index;
      }
    });

    // 必須カラムの確認
    if (dateIndex === -1) {
      return {
        success: false,
        transactions: [],
        errors: [
          {
            row: 0,
            message: "必須カラム（日付）が見つかりません",
            rawLine: headerLine,
          },
        ],
        bankType: "mizuho-bank",
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    // 入金/出金カラムが両方見つからない場合
    if (withdrawalIndex === -1 && depositIndex === -1) {
      return {
        success: false,
        transactions: [],
        errors: [
          {
            row: 0,
            message: "入金・出金カラムが見つかりません",
            rawLine: headerLine,
          },
        ],
        bankType: "mizuho-bank",
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    // データ行をパース（ヘッダー行の次から開始）
    for (let i = headerLineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      const fields = parseCSVLine(line);

      try {
        const dateStr = fields[dateIndex] || "";
        const description =
          descriptionIndex !== -1 ? fields[descriptionIndex] : "";
        const withdrawalStr =
          withdrawalIndex !== -1 ? fields[withdrawalIndex] : "";
        const depositStr = depositIndex !== -1 ? fields[depositIndex] : "";
        const balanceStr = balanceIndex !== -1 ? fields[balanceIndex] : "";

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

        // 金額パース（出金と入金を別々に処理）
        const withdrawal = parseAmount(withdrawalStr);
        const deposit = parseAmount(depositStr);

        // どちらか一方に値がある行のみ処理
        if (withdrawal === 0 && deposit === 0) {
          // 両方空の場合はスキップ（ヘッダー行の可能性など）
          continue;
        }

        let amount: number;
        let type: "income" | "expense";

        if (deposit > 0) {
          amount = deposit;
          type = "income";
          totalIncome += deposit;
        } else {
          amount = withdrawal;
          type = "expense";
          totalExpense += withdrawal;
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
          amount,
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
      bankType: "mizuho-bank",
      totalIncome,
      totalExpense,
    };
  },
};
