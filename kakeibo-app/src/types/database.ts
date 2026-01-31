/**
 * Kakeibo (家計簿) Database Types
 * Supabase PostgreSQL Schema TypeScript Definitions
 * Created: 2026-01-31
 *
 * Note: For production, use `supabase gen types typescript` to auto-generate
 */

// ============================================================
// Enum Types
// ============================================================

export type AccountType = 'bank' | 'cash' | 'e_money' | 'investment' | 'other';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type LoanStatus = 'active' | 'completed' | 'cancelled';

export type PeriodType = 'monthly' | 'weekly' | 'yearly';

// ============================================================
// Database Tables
// ============================================================

export interface Profile {
  id: string; // UUID, references auth.users
  display_name: string | null;
  avatar_url: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: AccountType;
  balance: number;
  currency: string;
  institution_name: string | null;
  account_number: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  issuer: string | null;
  last_four_digits: string | null;
  credit_limit: number | null;
  billing_day: number | null; // 1-31
  payment_day: number | null; // 1-31
  linked_account_id: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null; // NULL = system default
  name: string;
  parent_id: string | null;
  transaction_type: TransactionType;
  color: string | null;
  icon: string | null;
  is_system: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface RecurringRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  day_of_week?: number; // 0-6 for weekly
  day_of_month?: number; // 1-31 for monthly
  end_date?: string;
  occurrences?: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  description: string | null;
  memo: string | null;
  transaction_date: string; // DATE format

  // Relations
  account_id: string | null;
  to_account_id: string | null; // For transfers
  credit_card_id: string | null;
  category_id: string | null;
  shopping_loan_id: string | null;

  // Metadata
  is_recurring: boolean;
  recurring_rule: RecurringRule | null;
  receipt_url: string | null;
  location: string | null;
  tags: string[];

  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  period_type: PeriodType;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShoppingLoan {
  id: string;
  user_id: string;
  product_name: string;
  store_name: string | null;
  total_amount: number;
  monthly_payment: number;
  total_installments: number;
  remaining_installments: number;
  start_date: string;
  payment_day: number; // 1-31
  interest_rate: number; // percentage, 0 = interest-free
  linked_account_id: string | null;
  status: LoanStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Insert Types (for creating new records)
// ============================================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export type AccountInsert = Omit<Account, 'id' | 'created_at' | 'updated_at'>;
export type AccountUpdate = Partial<Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type CreditCardInsert = Omit<CreditCard, 'id' | 'created_at' | 'updated_at'>;
export type CreditCardUpdate = Partial<Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type TransactionInsert = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
export type TransactionUpdate = Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type BudgetInsert = Omit<Budget, 'id' | 'created_at' | 'updated_at'>;
export type BudgetUpdate = Partial<Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type ShoppingLoanInsert = Omit<ShoppingLoan, 'id' | 'created_at' | 'updated_at'>;
export type ShoppingLoanUpdate = Partial<Omit<ShoppingLoan, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// ============================================================
// Joined Types (with relations)
// ============================================================

export interface TransactionWithRelations extends Transaction {
  account?: Account | null;
  to_account?: Account | null;
  credit_card?: CreditCard | null;
  category?: Category | null;
  shopping_loan?: ShoppingLoan | null;
}

export interface CategoryWithChildren extends Category {
  children?: Category[];
}

export interface ShoppingLoanWithAccount extends ShoppingLoan {
  linked_account?: Account | null;
}

export interface CreditCardWithAccount extends CreditCard {
  linked_account?: Account | null;
}

// ============================================================
// Database Schema Type (for Supabase client)
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      accounts: {
        Row: Account;
        Insert: AccountInsert;
        Update: AccountUpdate;
      };
      credit_cards: {
        Row: CreditCard;
        Insert: CreditCardInsert;
        Update: CreditCardUpdate;
      };
      categories: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      transactions: {
        Row: Transaction;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
      };
      budgets: {
        Row: Budget;
        Insert: BudgetInsert;
        Update: BudgetUpdate;
      };
      shopping_loans: {
        Row: ShoppingLoan;
        Insert: ShoppingLoanInsert;
        Update: ShoppingLoanUpdate;
      };
    };
    Enums: {
      account_type: AccountType;
      transaction_type: TransactionType;
      loan_status: LoanStatus;
    };
  };
}
