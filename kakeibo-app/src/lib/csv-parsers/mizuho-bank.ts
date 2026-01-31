// みずほ銀行 CSVパーサー
// フォーマット: 日付,摘要,お支払金額,お預り金額,残高 または類似形式

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

export const mizuhoBankParser: CSVParser = {
  bankType: "mizuho-bank",
  bankName: "みずほ銀行",

  detect(content: string): boolean {
    const lines = splitCSVLines(content);
    if (lines.length === 0) return false;

    const firstLine = lines[0].toLowerCase();
    // みずほ銀行のヘッダーパターン
    return (
      (firstLine.includes("日付") || firstLine.includes("取引日")) &&
      (firstLine.includes("摘要") || firstLine.includes("お取引内容")) &&
      (firstLine.includes("お支払") ||
        firstLine.includes("お預り") ||
        firstLine.includes("出金") ||
        firstLine.includes("入金"))
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
        bankType: "mizuho-bank",
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    // ヘッダー行をスキップ
    const headerLine = lines[0];
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
      } else if (h.includes("お支払") || h.includes("出金") || h.includes("支払")) {
        withdrawalIndex = index;
      } else if (h.includes("お預り") || h.includes("入金") || h.includes("預入")) {
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

    // データ行をパース
    for (let i = 1; i < lines.length; i++) {
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
