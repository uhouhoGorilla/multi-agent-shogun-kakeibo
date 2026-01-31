// CSVパーサー エントリポイント

import { rakutenBankParser } from "./rakuten-bank";
import { mizuhoBankParser } from "./mizuho-bank";
import { rakutenCardParser } from "./rakuten-card";
import { saisonCardParser } from "./saison-card";
import type {
  CSVParser,
  ParseResult,
  BankType,
  CardCSVParser,
  CardParseResult,
  CardType,
} from "./types";

export * from "./types";
export { rakutenCardParser } from "./rakuten-card";
export { saisonCardParser } from "./saison-card";

// 利用可能なパーサー一覧
export const parsers: CSVParser[] = [rakutenBankParser, mizuhoBankParser];

// 銀行タイプからパーサーを取得
export function getParser(bankType: BankType): CSVParser | undefined {
  return parsers.find((p) => p.bankType === bankType);
}

// CSVコンテンツから自動で銀行タイプを検出してパース
export function autoParseCSV(content: string): ParseResult {
  for (const parser of parsers) {
    if (parser.detect(content)) {
      return parser.parse(content);
    }
  }

  // どのパーサーにもマッチしない場合
  return {
    success: false,
    transactions: [],
    errors: [
      {
        row: 0,
        message:
          "対応する銀行フォーマットを検出できませんでした。楽天銀行またはみずほ銀行のCSVファイルをご使用ください。",
      },
    ],
    bankType: "unknown",
    totalIncome: 0,
    totalExpense: 0,
  };
}

// 指定した銀行タイプでパース
export function parseCSV(content: string, bankType: BankType): ParseResult {
  const parser = getParser(bankType);
  if (!parser) {
    return {
      success: false,
      transactions: [],
      errors: [{ row: 0, message: `未対応の銀行タイプ: ${bankType}` }],
      bankType,
      totalIncome: 0,
      totalExpense: 0,
    };
  }
  return parser.parse(content);
}

// 利用可能な銀行一覧
export const availableBanks = parsers.map((p) => ({
  type: p.bankType,
  name: p.bankName,
}));

// ============================================================
// クレジットカード用パーサー
// ============================================================

// 利用可能なカードパーサー一覧
export const cardParsers: CardCSVParser[] = [rakutenCardParser, saisonCardParser];

// カードタイプからパーサーを取得
export function getCardParser(cardType: CardType): CardCSVParser | undefined {
  return cardParsers.find((p) => p.cardType === cardType);
}

// CSVコンテンツから自動でカードタイプを検出してパース
export function autoParseCardCSV(content: string): CardParseResult {
  for (const parser of cardParsers) {
    if (parser.detect(content)) {
      return parser.parse(content);
    }
  }

  // どのパーサーにもマッチしない場合
  return {
    success: false,
    transactions: [],
    errors: [
      {
        row: 0,
        message:
          "対応するカードフォーマットを検出できませんでした。楽天カードまたはセゾンカードのCSVファイルをご使用ください。",
      },
    ],
    cardType: "unknown-card",
    totalExpense: 0,
    totalRefund: 0,
  };
}

// 指定したカードタイプでパース
export function parseCardCSV(content: string, cardType: CardType): CardParseResult {
  const parser = getCardParser(cardType);
  if (!parser) {
    return {
      success: false,
      transactions: [],
      errors: [{ row: 0, message: `未対応のカードタイプ: ${cardType}` }],
      cardType,
      totalExpense: 0,
      totalRefund: 0,
    };
  }
  return parser.parse(content);
}

// 利用可能なカード一覧
export const availableCards = cardParsers.map((p) => ({
  type: p.cardType,
  name: p.cardName,
}));
