// CSVパーサー共通型定義

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense";
  balance?: number;
  rawData: Record<string, string>;
}

export interface ParseResult {
  success: boolean;
  transactions: ParsedTransaction[];
  errors: ParseError[];
  bankType: BankType;
  totalIncome: number;
  totalExpense: number;
}

export interface ParseError {
  row: number;
  message: string;
  rawLine?: string;
}

export type BankType = "rakuten-bank" | "mizuho-bank" | "unknown";

export type CardType = "rakuten-card" | "saison-card" | "unknown-card";

export interface ParsedCardTransaction {
  date: Date;
  description: string;
  amount: number;
  type: "expense" | "refund";
  paymentMethod?: string;
  rawData: Record<string, string>;
}

export interface CardParseResult {
  success: boolean;
  transactions: ParsedCardTransaction[];
  errors: ParseError[];
  cardType: CardType;
  totalExpense: number;
  totalRefund: number;
}

export interface CardCSVParser {
  cardType: CardType;
  cardName: string;
  parse(content: string): CardParseResult;
  detect(content: string): boolean;
}

export interface CSVParser {
  bankType: BankType;
  bankName: string;
  parse(content: string): ParseResult;
  detect(content: string): boolean;
}

// 日付フォーマット変換
export function parseJapaneseDate(dateStr: string): Date | null {
  // YYYY/MM/DD or YYYY-MM-DD or YYYY.MM.DD or YYYYMMDD
  const patterns = [
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/,  // みずほ銀行形式: 2025.10.23
    /^(\d{4})(\d{2})(\d{2})$/,           // 楽天銀行形式: 20240418
  ];

  for (const pattern of patterns) {
    const match = dateStr.match(pattern);
    if (match) {
      const [, year, month, day] = match;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }

  return null;
}

// 金額パース（カンマ、マイナス記号対応）
export function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === "") return 0;
  // カンマ、円記号、スペースを除去
  const cleaned = amountStr.replace(/[,¥￥\s]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

// CSVを行ごとに分割（クォート対応）
export function splitCSVLines(content: string): string[] {
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !inQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = "";
      if (char === "\r") i++;
    } else if (char !== "\r") {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  return lines;
}

// CSV行をフィールドに分割（クォート対応）
export function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(currentField.trim());
      currentField = "";
    } else {
      currentField += char;
    }
  }

  fields.push(currentField.trim());
  return fields;
}
