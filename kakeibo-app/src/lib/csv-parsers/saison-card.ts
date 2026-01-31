// セゾンカード CSVパーサー
// フォーマット: ご利用日,ご利用店名,ご利用金額,支払区分,今回お支払金額,返金金額 等
// 文字コード: Shift_JIS または UTF-8
// ダウンロード元: Netアンサー / セゾンPortal

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

export const saisonCardParser: CardCSVParser = {
  cardType: "saison-card",
  cardName: "セゾンカード",

  detect(content: string): boolean {
    const lines = splitCSVLines(content);
    if (lines.length === 0) return false;

    const firstLine = lines[0].toLowerCase();
    // セゾンカードのヘッダーパターン
    // 「利用日」「利用店」「利用金額」があり、「楽天」を含まない
    const hasDate = firstLine.includes("利用日") || firstLine.includes("ご利用日");
    const hasStore = firstLine.includes("利用店") || firstLine.includes("ご利用店");
    const hasAmount = firstLine.includes("利用金額") || firstLine.includes("ご利用金額");
    const isNotRakuten = !firstLine.includes("楽天") && !firstLine.includes("e-navi");

    // セゾン特有のキーワードがあればより確実
    const hasSaisonKeyword =
      firstLine.includes("支払区分") ||
      firstLine.includes("今回お支払") ||
      firstLine.includes("ご請求");

    return hasDate && hasStore && hasAmount && isNotRakuten && hasSaisonKeyword;
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
        cardType: "saison-card",
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
    let amountIndex = -1;
    let refundIndex = -1;
    let paymentTypeIndex = -1;

    headers.forEach((header, index) => {
      const h = header.replace(/\s/g, "").toLowerCase();
      if (h.includes("利用日") || h.includes("ご利用日")) {
        dateIndex = index;
      } else if (h.includes("利用店") || h.includes("ご利用店")) {
        descriptionIndex = index;
      } else if (
        (h.includes("利用金額") || h.includes("ご利用金額")) &&
        !h.includes("返金")
      ) {
        amountIndex = index;
      } else if (h.includes("返金")) {
        refundIndex = index;
      } else if (h.includes("支払区分") || h.includes("お支払区分")) {
        paymentTypeIndex = index;
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
        cardType: "saison-card",
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
        const refundStr = refundIndex !== -1 ? fields[refundIndex] : "";
        const paymentType = paymentTypeIndex !== -1 ? fields[paymentTypeIndex] : "";

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
        const refund = parseAmount(refundStr);

        // 金額も返金も0の行はスキップ
        if (amount === 0 && refund === 0) {
          continue;
        }

        // rawDataを構築
        const rawData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rawData[header] = fields[index] || "";
        });

        // 返金がある場合は返金として処理
        if (refund > 0) {
          totalRefund += refund;
          transactions.push({
            date,
            description: description || "（利用店名なし）",
            amount: refund,
            type: "refund",
            paymentMethod: paymentType || undefined,
            rawData,
          });
        }

        // 利用金額がある場合は支出として処理
        if (amount > 0) {
          totalExpense += amount;
          transactions.push({
            date,
            description: description || "（利用店名なし）",
            amount,
            type: "expense",
            paymentMethod: paymentType || undefined,
            rawData,
          });
        }
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
      cardType: "saison-card",
      totalExpense,
      totalRefund,
    };
  },
};
