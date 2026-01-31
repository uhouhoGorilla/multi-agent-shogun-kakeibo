-- ============================================================
-- Kakeibo (家計簿) Database Schema
-- Supabase (PostgreSQL) Migration
-- Created: 2026-01-31
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM Types
-- ============================================================

CREATE TYPE account_type AS ENUM (
  'bank',           -- 銀行口座
  'cash',           -- 現金
  'e_money',        -- 電子マネー
  'investment',     -- 投資口座
  'other'           -- その他
);

CREATE TYPE transaction_type AS ENUM (
  'income',         -- 収入
  'expense',        -- 支出
  'transfer'        -- 振替
);

CREATE TYPE loan_status AS ENUM (
  'active',         -- 支払い中
  'completed',      -- 完済
  'cancelled'       -- キャンセル
);

-- ============================================================
-- Tables
-- ============================================================

-- ------------------------------------------------------------
-- Users Profile (auth.usersと連携)
-- ------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'JPY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Accounts (口座: 銀行・現金・電子マネー等)
-- ------------------------------------------------------------
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  account_type account_type NOT NULL DEFAULT 'bank',
  balance DECIMAL(15, 2) DEFAULT 0,
  currency TEXT DEFAULT 'JPY',
  institution_name TEXT,           -- 金融機関名
  account_number TEXT,             -- 口座番号（マスク推奨）
  color TEXT,                      -- UI表示色
  icon TEXT,                       -- アイコン名
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Credit Cards (クレジットカード)
-- ------------------------------------------------------------
CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT,                     -- カード発行会社
  last_four_digits TEXT,           -- 下4桁
  credit_limit DECIMAL(15, 2),     -- 利用限度額
  billing_day INTEGER CHECK (billing_day BETWEEN 1 AND 31),  -- 締め日
  payment_day INTEGER CHECK (payment_day BETWEEN 1 AND 31),  -- 支払日
  linked_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL, -- 引落口座
  color TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Categories (カテゴリ)
-- ------------------------------------------------------------
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULLならシステムデフォルト
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE, -- サブカテゴリ用
  transaction_type transaction_type NOT NULL,  -- income/expense
  color TEXT,
  icon TEXT,
  is_system BOOLEAN DEFAULT FALSE,  -- システムデフォルトカテゴリ
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Transactions (取引: 収入・支出・振替)
-- ------------------------------------------------------------
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type transaction_type NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'JPY',
  description TEXT,
  memo TEXT,
  transaction_date DATE NOT NULL,

  -- 関連
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL, -- 振替先
  credit_card_id UUID REFERENCES public.credit_cards(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  shopping_loan_id UUID, -- 後で追加（循環参照回避）

  -- メタデータ
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_rule JSONB,            -- 繰り返しルール
  receipt_url TEXT,                -- レシート画像URL
  location TEXT,                   -- 場所
  tags TEXT[],                     -- タグ配列

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Budgets (予算)
-- ------------------------------------------------------------
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT DEFAULT 'JPY',
  period_type TEXT NOT NULL DEFAULT 'monthly', -- monthly, weekly, yearly
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, category_id, period_type, start_date)
);

-- ------------------------------------------------------------
-- Shopping Loans (ショッピングローン)
-- ------------------------------------------------------------
CREATE TABLE public.shopping_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,               -- 商品名
  store_name TEXT,                          -- 購入店舗
  total_amount DECIMAL(15, 2) NOT NULL,     -- 総額
  monthly_payment DECIMAL(15, 2) NOT NULL,  -- 月々の支払額
  total_installments INTEGER NOT NULL,      -- 総回数
  remaining_installments INTEGER NOT NULL,  -- 残回数
  start_date DATE NOT NULL,                 -- 初回支払日
  payment_day INTEGER NOT NULL CHECK (payment_day BETWEEN 1 AND 31), -- 毎月の支払日
  interest_rate DECIMAL(5, 2) DEFAULT 0,    -- 金利（%）、0なら無金利
  linked_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL, -- 引落口座
  status loan_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- transactionsにFK追加
ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_shopping_loan
  FOREIGN KEY (shopping_loan_id)
  REFERENCES public.shopping_loans(id) ON DELETE SET NULL;

-- ============================================================
-- Indexes
-- ============================================================

-- Accounts
CREATE INDEX idx_accounts_user_id ON public.accounts(user_id);

-- Credit Cards
CREATE INDEX idx_credit_cards_user_id ON public.credit_cards(user_id);

-- Categories
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX idx_categories_transaction_type ON public.categories(transaction_type);

-- Transactions
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, transaction_date);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_credit_card_id ON public.transactions(credit_card_id);
CREATE INDEX idx_transactions_shopping_loan_id ON public.transactions(shopping_loan_id);

-- Budgets
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_category_id ON public.budgets(category_id);

-- Shopping Loans
CREATE INDEX idx_shopping_loans_user_id ON public.shopping_loans(user_id);
CREATE INDEX idx_shopping_loans_status ON public.shopping_loans(status);
CREATE INDEX idx_shopping_loans_user_status ON public.shopping_loans(user_id, status);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_loans ENABLE ROW LEVEL SECURITY;

-- Profiles: 自分のプロファイルのみアクセス可能
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Accounts: 自分の口座のみ
CREATE POLICY "Users can view own accounts" ON public.accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON public.accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON public.accounts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own accounts" ON public.accounts
  FOR DELETE USING (auth.uid() = user_id);

-- Credit Cards: 自分のカードのみ
CREATE POLICY "Users can view own credit_cards" ON public.credit_cards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit_cards" ON public.credit_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own credit_cards" ON public.credit_cards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own credit_cards" ON public.credit_cards
  FOR DELETE USING (auth.uid() = user_id);

-- Categories: 自分のカテゴリ または システムデフォルト
CREATE POLICY "Users can view own or system categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id AND is_system = FALSE);
CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- Transactions: 自分の取引のみ
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Budgets: 自分の予算のみ
CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Shopping Loans: 自分のローンのみ
CREATE POLICY "Users can view own shopping_loans" ON public.shopping_loans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shopping_loans" ON public.shopping_loans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shopping_loans" ON public.shopping_loans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shopping_loans" ON public.shopping_loans
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Triggers for updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_loans_updated_at BEFORE UPDATE ON public.shopping_loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Trigger: 新規ユーザー登録時にプロファイル自動作成
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Default Categories (システムデフォルト)
-- ============================================================

INSERT INTO public.categories (id, user_id, name, transaction_type, icon, is_system, sort_order) VALUES
  -- 支出カテゴリ
  (uuid_generate_v4(), NULL, '食費', 'expense', 'utensils', TRUE, 1),
  (uuid_generate_v4(), NULL, '日用品', 'expense', 'shopping-basket', TRUE, 2),
  (uuid_generate_v4(), NULL, '交通費', 'expense', 'train', TRUE, 3),
  (uuid_generate_v4(), NULL, '住居費', 'expense', 'home', TRUE, 4),
  (uuid_generate_v4(), NULL, '水道光熱費', 'expense', 'lightbulb', TRUE, 5),
  (uuid_generate_v4(), NULL, '通信費', 'expense', 'smartphone', TRUE, 6),
  (uuid_generate_v4(), NULL, '医療費', 'expense', 'heart-pulse', TRUE, 7),
  (uuid_generate_v4(), NULL, '教育費', 'expense', 'graduation-cap', TRUE, 8),
  (uuid_generate_v4(), NULL, '娯楽費', 'expense', 'gamepad-2', TRUE, 9),
  (uuid_generate_v4(), NULL, '衣服・美容', 'expense', 'shirt', TRUE, 10),
  (uuid_generate_v4(), NULL, '保険', 'expense', 'shield', TRUE, 11),
  (uuid_generate_v4(), NULL, 'ローン返済', 'expense', 'credit-card', TRUE, 12),
  (uuid_generate_v4(), NULL, 'その他支出', 'expense', 'ellipsis', TRUE, 99),
  -- 収入カテゴリ
  (uuid_generate_v4(), NULL, '給与', 'income', 'briefcase', TRUE, 1),
  (uuid_generate_v4(), NULL, '賞与', 'income', 'gift', TRUE, 2),
  (uuid_generate_v4(), NULL, '副業', 'income', 'laptop', TRUE, 3),
  (uuid_generate_v4(), NULL, '投資収益', 'income', 'trending-up', TRUE, 4),
  (uuid_generate_v4(), NULL, '臨時収入', 'income', 'sparkles', TRUE, 5),
  (uuid_generate_v4(), NULL, 'その他収入', 'income', 'ellipsis', TRUE, 99);
