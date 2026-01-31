"use server";

import {
  autoParseCSV,
  parseCSV,
  autoParseCardCSV,
  parseCardCSV,
  type BankType,
  type ParseResult,
  type CardType,
  type CardParseResult,
} from "@/lib/csv-parsers";

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  totalIncome: number;
  totalExpense: number;
  errors: string[];
}

// CSVファイルをパースしてプレビュー用データを返す
export async function previewCSV(
  content: string,
  bankType?: BankType
): Promise<ParseResult> {
  if (bankType && bankType !== "unknown") {
    return parseCSV(content, bankType);
  }
  return autoParseCSV(content);
}

// CSVから取引データをインポート
export async function importBankCSV(
  content: string,
  bankType?: BankType
): Promise<ImportResult> {
  try {
    // パース
    const result = bankType ? parseCSV(content, bankType) : autoParseCSV(content);

    if (!result.success && result.transactions.length === 0) {
      return {
        success: false,
        message: "CSVのパースに失敗しました",
        importedCount: 0,
        totalIncome: 0,
        totalExpense: 0,
        errors: result.errors.map((e) => `行${e.row}: ${e.message}`),
      };
    }

    // TODO: 実際のデータベース保存処理
    // 現時点ではモックとして成功を返す
    // 将来的にはSupabaseに保存

    /*
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "認証が必要です",
        importedCount: 0,
        totalIncome: 0,
        totalExpense: 0,
        errors: ["ログインしてください"],
      };
    }

    // 取引データを変換してバルクインサート
    const transactionsToInsert = result.transactions.map((t) => ({
      user_id: user.id,
      date: t.date.toISOString().split("T")[0],
      description: t.description,
      amount: t.amount,
      type: t.type,
      category_id: null, // 後でカテゴリ推定
      source: result.bankType,
    }));

    const { error } = await supabase
      .from("transactions")
      .insert(transactionsToInsert);

    if (error) {
      return {
        success: false,
        message: "データベースへの保存に失敗しました",
        importedCount: 0,
        totalIncome: 0,
        totalExpense: 0,
        errors: [error.message],
      };
    }
    */

    return {
      success: true,
      message: `${result.transactions.length}件の取引をインポートしました`,
      importedCount: result.transactions.length,
      totalIncome: result.totalIncome,
      totalExpense: result.totalExpense,
      errors: result.errors.map((e) => `行${e.row}: ${e.message}`),
    };
  } catch (error) {
    return {
      success: false,
      message: "インポート処理中にエラーが発生しました",
      importedCount: 0,
      totalIncome: 0,
      totalExpense: 0,
      errors: [error instanceof Error ? error.message : "不明なエラー"],
    };
  }
}

// ============================================================
// クレジットカードCSVインポート
// ============================================================

export interface CardImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  totalExpense: number;
  totalRefund: number;
  errors: string[];
}

// カードCSVファイルをパースしてプレビュー用データを返す
export async function previewCardCSV(
  content: string,
  cardType?: CardType
): Promise<CardParseResult> {
  if (cardType && cardType !== "unknown-card") {
    return parseCardCSV(content, cardType);
  }
  return autoParseCardCSV(content);
}

// カードCSVから取引データをインポート
export async function importCardCSV(
  content: string,
  cardType?: CardType
): Promise<CardImportResult> {
  try {
    // パース
    const result = cardType
      ? parseCardCSV(content, cardType)
      : autoParseCardCSV(content);

    if (!result.success && result.transactions.length === 0) {
      return {
        success: false,
        message: "CSVのパースに失敗しました",
        importedCount: 0,
        totalExpense: 0,
        totalRefund: 0,
        errors: result.errors.map((e) => `行${e.row}: ${e.message}`),
      };
    }

    // TODO: 実際のデータベース保存処理
    // 現時点ではモックとして成功を返す
    // 将来的にはSupabaseに保存

    /*
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        message: "認証が必要です",
        importedCount: 0,
        totalExpense: 0,
        totalRefund: 0,
        errors: ["ログインしてください"],
      };
    }

    // カード明細を取引データに変換してバルクインサート
    const transactionsToInsert = result.transactions.map((t) => ({
      user_id: user.id,
      transaction_date: t.date.toISOString().split("T")[0],
      description: t.description,
      amount: t.amount,
      transaction_type: t.type === "refund" ? "income" : "expense",
      credit_card_id: null, // 後で紐付け
      category_id: null, // 後でカテゴリ推定
      memo: t.paymentMethod ? `支払方法: ${t.paymentMethod}` : null,
    }));

    const { error } = await supabase
      .from("transactions")
      .insert(transactionsToInsert);

    if (error) {
      return {
        success: false,
        message: "データベースへの保存に失敗しました",
        importedCount: 0,
        totalExpense: 0,
        totalRefund: 0,
        errors: [error.message],
      };
    }
    */

    return {
      success: true,
      message: `${result.transactions.length}件のカード明細をインポートしました（${result.cardType}）`,
      importedCount: result.transactions.length,
      totalExpense: result.totalExpense,
      totalRefund: result.totalRefund,
      errors: result.errors.map((e) => `行${e.row}: ${e.message}`),
    };
  } catch (error) {
    return {
      success: false,
      message: "インポート処理中にエラーが発生しました",
      importedCount: 0,
      totalExpense: 0,
      totalRefund: 0,
      errors: [error instanceof Error ? error.message : "不明なエラー"],
    };
  }
}
