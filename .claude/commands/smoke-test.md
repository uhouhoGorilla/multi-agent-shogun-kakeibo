---
description: |
  kakeibo-appのWeb画面がエラーなく表示されるかPlaywrightでスモークテストを実行する。
  「画面テスト」「スモークテスト」「smoke test」「画面確認」「E2Eテスト」で起動。
  Do NOT use for: ユニットテスト、API テスト、ビルドエラーの調査。
allowed-tools: Bash, Read
context: fork
agent: general-purpose
---

# /smoke-test - kakeibo-app Web画面スモークテスト

## Overview

Playwright CLIでkakeibo-appの各画面にアクセスし、HTTP 5xxエラーやJSエラーがないことを確認する。
MCP不使用。Bash経由でPlaywright testを実行し、結果をJSONで取得・報告する。

## Instructions

### Step 1: devサーバーの起動確認

```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ 2>/dev/null || echo "not running"
```

起動していない場合、バックグラウンドで起動して待機:

```bash
cd /workspaces/multi-agent-shogun-kakeibo/kakeibo-app && npm run dev &
# 起動を待つ（最大15秒）
for i in $(seq 1 15); do
  curl -s -o /dev/null http://localhost:3000/ 2>/dev/null && break
  sleep 1
done
```

### Step 2: テスト実行

```bash
cd /workspaces/multi-agent-shogun-kakeibo/kakeibo-app && npx playwright test --reporter=list 2>&1
```

引数 `$ARGUMENTS` が指定されている場合はフィルタとして使用:

```bash
npx playwright test --grep "$ARGUMENTS" --reporter=list 2>&1
```

### Step 3: 結果の解析と報告

テスト結果を以下の形式で報告する:

```
スモークテスト結果:
  合格: X / Y
  失敗: Z

失敗した画面:
  - /path - エラー内容
  - /path - エラー内容

スクリーンショット:
  kakeibo-app/test-results/ に保存済み（失敗時のみ）
```

### Step 4: 失敗時の調査

失敗がある場合:
1. `kakeibo-app/test-results/` のスクリーンショットを確認
2. エラー内容からHTTPステータスエラーかJSランタイムエラーかを判別
3. 原因の推定と修正案を簡潔に報告

## Guidelines

- devサーバーは `reuseExistingServer: true` により既に起動中なら再起動しない
- テスト結果JSONは `kakeibo-app/e2e/results.json` に出力される
- Supabase未設定の場合、認証なしで全ページアクセス可能（middleware設計による）
- テストファイルの追加・修正が必要な場合は `kakeibo-app/e2e/` 配下を編集
