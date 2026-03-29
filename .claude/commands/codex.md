---
description: |
  OpenAI Codex CLIにタスクを委任して実行する。
  「codex」「Codex実行」「codexに依頼」「OpenAI」で起動。
  Do NOT use for: Claude Code自身で完結するタスク。
allowed-tools: Bash, Read
---

# /codex - OpenAI Codex CLI タスク委任

## Overview

OpenAI Codex CLI (`codex exec`) を使い、指定されたタスクを非インタラクティブに実行する。
最新モデル (gpt-5.4) + 最高reasoning effort (xhigh) で動作する。

## Instructions

### Step 1: プロンプトの確認

`$ARGUMENTS` をCodexに渡すプロンプトとして使用する。
空の場合はユーザーに何を実行したいか確認すること。

### Step 2: Codex実行

```bash
codex exec \
  -m gpt-5.4 \
  -c reasoning_effort="xhigh" \
  -a never \
  -s workspace-write \
  --no-alt-screen \
  --skip-git-repo-check \
  "$ARGUMENTS"
```

タイムアウトは10分 (600000ms) に設定すること。

### Step 3: 結果の報告

Codexの出力を確認し、以下の形式で報告する:

```
Codex実行結果:
  タスク: (依頼内容)
  ステータス: 成功 / 失敗
  概要: (何が行われたかの要約)

変更されたファイル:
  - path/to/file (変更内容の簡潔な説明)
```

失敗した場合はエラー内容を報告する。

## Guidelines

- Codexが変更したファイルは `git diff` で確認し、意図通りか検証すること
- Codexの出力が長い場合は要約して報告すること
- OPENAI_API_KEY が未設定の場合はユーザーに設定を促すこと
