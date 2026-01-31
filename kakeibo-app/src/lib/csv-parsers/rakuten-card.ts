// 楽天カード CSVパーサー
// フォーマット: 利用日,利用店名・商品名,利用者,支払方法,利用金額,支払手数料,支払総額
// 文字コード: UTF-8
// ダウンロード元: 楽天e-NAVI

import {
  CardCSVParser,
  CardParseResult,
  ParsedCardTransaction,
  ParseError,
  parseJapaneseDate,
  parseAmount,
  splitCSVLines,
  parseCSVLine,
} from "./types";

export const rakutenCardParser: CardCSVParser = {
  cardType: "rakuten-card",
  cardName: "楽天カード",

  detect(content: string): boolean {
    const lines = splitCSVLines(content);
    if (lines.length === 0) return false;

    const firstLine = lines[0].toLowerCase();
    // 楽天カードのヘッダーパターン
    return (
      (firstLine.includes("利用日") || firstLine.includes("ご利用日")) &&
      (firstLine.includes("利用店") || firstLine.includes("ご利用店")) &&
      (firstLine.includes("利用金額") || firstLine.includes("ご利用金額"))
    );
  },

  parse(content: string): CardParseResult {
    const lines = splitCSVLines(content);
    const transactions: ParsedCardTransaction[] = [];
    const errors: ParseError[] = [];
    let totalExpense = 0;
    let totalRefund = 0;

    if (lines.length === 0) {
      return {
        success: false,
        transactions: [],
        errors: [{ row: 0, message: "CSVファイルが空です" }],
        cardType: "rakuten-card",
        totalExpense: 0,
        totalRefund: 0,
      };
    }

    // ヘッダー行をパース
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine);

    // カラムインデックスを特定
    let dateIndex = -1;
    let descriptionIndex = -1;
    let userIndex = -1;
    let paymentMethodIndex = -1;
    let amountIndex = -1;

    headers.forEach((header, index) => {
      const h = header.replace(/\s/g, "").toLowerCase();
      if (h.includes("利用日") || h.includes("ご利用日")) {
        dateIndex = index;
      } else if (h.includes("利用店") || h.includes("ご利用店") || h.includes("商品名")) {
        descriptionIndex = index;
      } else if (h.includes("利用者") || h.includes("ご利用者")) {
        userIndex = index;
      } else if (h.includes("支払方法") || h.includes("お支払方法")) {
        paymentMethodIndex = index;
      } else if (h.includes("利用金額") || h.includes("ご利用金額")) {
        // 「支払総額」より先に「利用金額」を取得
        if (amountIndex === -1) {
          amountIndex = index;
        }
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
            message: "必須カラム（利用日、利用金額）が見つかりません",
            rawLine: headerLine,
          },
        ],
        cardType: "rakuten-card",
        totalExpense: 0,
        totalRefund: 0,
      };
    }

    // データ行をパース
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      // 空行やコメント行をスキップ
      if (!line.trim() || line.startsWith("#")) {
        continue;
      }

      const fields = parseCSVLine(line);

      try {
        const dateStr = fields[dateIndex] || "";
        const description = descriptionIndex !== -1 ? fields[descriptionIndex] : "";
        const amountStr = fields[amountIndex] || "";
        const paymentMethod = paymentMethodIndex !== -1 ? fields[paymentMethodIndex] : "";

        // 日付パース
        const date = parseJapaneseDate(dateStr);
        if (!date) {
          // 日付がない行はスキップ（合計行など）
          if (dateStr.trim() === "") {
            continue;
          }
          errors.push({
            row: i + 1,
            message: `無効な日付形式: ${dateStr}`,
            rawLine: line,
          });
          continue;
        }

        // 金額パース
        const amount = parseAmount(amountStr);
        if (amount === 0 && amountStr.trim() !== "0" && amountStr.trim() !== "") {
          errors.push({
            row: i + 1,
            message: `無効な金額: ${amountStr}`,
            rawLine: line,
          });
          continue;
        }

        // 金額が0の行はスキップ
        if (amount === 0) {
          continue;
        }

        // 返金/支出判定（マイナスは返金）
        const type = amount < 0 ? "refund" : "expense";
        const absAmount = Math.abs(amount);

        if (type === "refund") {
          totalRefund += absAmount;
        } else {
          totalExpense += absAmount;
        }

        // rawDataを構築
        const rawData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rawData[header] = fields[index] || "";
        });

        transactions.push({
          date,
          description: description || "（利用店名なし）",
          amount: absAmount,
          type,
          paymentMethod: paymentMethod || undefined,
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
      cardType: "rakuten-card",
      totalExpense,
      totalRefund,
    };
  },
};
