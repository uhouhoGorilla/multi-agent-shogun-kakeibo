---
description: |
  multi-agent-shogunサブモジュールを上流リポジトリの最新版に更新する。
  「shogun更新」「フレームワーク更新」「update shogun」「upstream更新」で起動。
  Do NOT use for: kakeibo-appの更新やビルド。
allowed-tools: Bash, Read, Edit
---

# /update-shogun - multi-agent-shogun サブモジュール更新

## Overview

git submodule として管理されている `multi-agent-shogun/` ディレクトリを
上流リポジトリ (yohey-w/multi-agent-shogun) の最新コミットに更新する。

push URL は `DISABLE` に設定されているため、誤pushは発生しない。

## Instructions

### Step 1: サブモジュール状態確認

```bash
cd /workspaces/multi-agent-shogun-kakeibo
git submodule status multi-agent-shogun
```

サブモジュールが未初期化（先頭が`-`）の場合:
```bash
git submodule init && git submodule update
```

### Step 2: push URL 安全確認

```bash
cd /workspaces/multi-agent-shogun-kakeibo/multi-agent-shogun
git remote get-url --push origin
```

`DISABLE` でない場合は修正する:
```bash
git remote set-url --push origin DISABLE
```

### Step 3: 更新前の現在コミットを記録

```bash
cd /workspaces/multi-agent-shogun-kakeibo/multi-agent-shogun
git log --oneline -1
```

### Step 4: fetch & checkout

引数 `$ARGUMENTS` が指定されていればそのref、なければ `main` を使用する。

```bash
cd /workspaces/multi-agent-shogun-kakeibo/multi-agent-shogun
git fetch origin
git checkout origin/${TARGET_REF:-main}
```

### Step 5: 更新内容の確認

```bash
cd /workspaces/multi-agent-shogun-kakeibo/multi-agent-shogun
git log --oneline -5
```

### Step 6: 結果報告

以下の形式で報告する:

```
更新完了:
  更新前: <old commit hash>
  更新後: <new commit hash>
  ref: <branch or tag>

親リポジトリに記録するには:
  git add multi-agent-shogun
  git commit -m "Update multi-agent-shogun to <short hash>"
```

## Guidelines

- push URL が DISABLE であることを毎回確認すること
- 親リポジトリへのコミットはユーザーに確認を取ってから行う
- 更新前後のコミットハッシュを必ず表示する
