# 🐳 コンテナ環境での運用ガイド

このドキュメントは、multi-agent-shogun を VSCode Dev Container や Docker コンテナ内で運用する際の調整内容をまとめています。

---

## 📋 調整済み項目

以下の項目は既に調整済みです。

### ✅ 1. パス設定の修正

**変更内容:**
- [config/settings.yaml](config/settings.yaml) のパスを相対パスに変更
- ハードコードされたローカルパス → プロジェクトルート基準の相対パス

**Before:**
```yaml
local_path: "/Users/iizukahiiro/workspace/multi-agent-shogun-kakeibo/skills/"
path: "/Users/iizukahiiro/workspace/multi-agent-shogun-kakeibo/logs/"
```

**After:**
```yaml
local_path: "./skills/"
path: "./logs/"
```

### ✅ 2. スクリーンショット機能の追加

**変更内容:**
- [config/settings.yaml](config/settings.yaml) にスクリーンショット設定を追加

**追加された設定:**
```yaml
screenshot:
  path: "./screenshots"  # プロジェクトルート内にスクリーンショットを保存
```

**使用方法:**
1. プロジェクトルートに `screenshots` ディレクトリを作成
2. スクリーンショットをそこに配置
3. 将軍に「最新のスクリーンショットを確認せよ」と指示

**ホストからマウントする場合:**
```json
// .devcontainer/devcontainer.json に追加
"mounts": [
  "source=${localEnv:HOME}/Pictures/Screenshots,target=/workspaces/multi-agent-shogun-kakeibo/screenshots,type=bind"
]
```

### ✅ 3. Shell Alias の永続化

**変更内容:**
- [.devcontainer/Dockerfile](.devcontainer/Dockerfile) に alias を追加

**追加されたalias:**
```bash
alias css="cd /workspaces/multi-agent-shogun-kakeibo && ./shutsujin_departure.sh"  # 出陣
alias csm="cd /workspaces/multi-agent-shogun-kakeibo"                                # ディレクトリ移動
alias cshogun="tmux attach-session -t shogun"                                       # 将軍の本陣へ
alias cmulti="tmux attach-session -t multiagent"                                    # 家老・足軽の陣へ
```

**適用方法:**
- コンテナを再ビルド: `Dev Containers: Rebuild Container`

### ✅ 4. Windows Terminal 統合

**現状:**
- [shutsujin_departure.sh:701-705](shutsujin_departure.sh#L701-L705) で既にエラーハンドリング済み
- コンテナ環境では `wt.exe` が見つからないため、自動的にスキップされる

**動作:**
```bash
./shutsujin_departure.sh -t  # -t オプション使用時
# → "wt.exe が見つかりません。手動でアタッチしてください。" と表示
# → エラーにならず処理は継続
```

### ✅ 5. Claude Code 設定の永続化

**現状:**
- [.devcontainer/devcontainer.json:38-39](.devcontainer/devcontainer.json#L38-L39) で `.claude` ディレクトリをマウント

**マウント設定:**
```json
"mounts": [
  "source=${localEnv:HOME}/.claude,target=/home/vscode/.claude,type=bind,consistency=cached",
  "source=${localEnv:HOME}/.claude.json,target=/home/vscode/.claude.json,type=bind,consistency=cached"
]
```

**効果:**
- API キーなどの認証情報が保持される
- MCP 設定が永続化される
- Memory MCP のデータも保持される

---

## 🚀 コンテナでの起動方法

### 方法1: スクリプトから起動（推奨）

```bash
# コンテナ内のターミナルで実行
./shutsujin_departure.sh
```

### 方法2: Alias を使って起動

```bash
# コンテナ再ビルド後に使用可能
css  # 出陣コマンド（cd + shutsujin_departure.sh）
```

### 方法3: セットアップのみ（手動でClaude起動）

```bash
./shutsujin_departure.sh -s  # tmux セッションのみ作成
```

---

## 🔧 オプション機能

### A. tmux の自動起動

コンテナ起動時に自動的に tmux セッションを開始したい場合、以下のいずれかの方法を選択してください。

#### オプション A-1: postStartCommand で自動起動

[.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) に追加:

```json
{
  "postStartCommand": "bash -c 'sleep 3 && ./shutsujin_departure.sh -s'"
}
```

**メリット:**
- コンテナ起動時に自動でセッション作成
- 手動での起動が不要

**デメリット:**
- コンテナ起動のたびに実行される
- 不要な場合でも起動してしまう

#### オプション A-2: VSCode Tasks で起動

[.vscode/tasks.json](.vscode/tasks.json) を作成:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "🏯 出陣 (Startup Shogun)",
      "type": "shell",
      "command": "./shutsujin_departure.sh",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "🏯 将軍の本陣へ (Attach to Shogun)",
      "type": "shell",
      "command": "tmux attach-session -t shogun",
      "problemMatcher": []
    }
  ]
}
```

**使用方法:**
1. `Ctrl+Shift+P` → `Tasks: Run Task`
2. `🏯 出陣 (Startup Shogun)` を選択

**メリット:**
- 必要な時だけ起動できる
- VSCode UI から簡単に実行

**デメリット:**
- 手動で選択する必要がある

---

## 🔍 コンテナ固有の注意事項

### 1. tmux セッションの永続性

**重要:**
- tmux セッションはコンテナ停止時に失われます
- コンテナを再起動したら `./shutsujin_departure.sh` を再実行してください

### 2. ログとバックアップ

**保存場所:**
- ログ: `./logs/`
- バックアップ: `./logs/backup_YYYYMMDD_HHMMSS/`

**永続化:**
- これらは相対パスなので、ワークスペースフォルダ内に保存されます
- コンテナを削除しても、ワークスペースが保持されていればデータは残ります

### 3. Memory MCP のデータ

**保存場所:**
- `memory/shogun_memory.jsonl`

**永続化:**
- ホストの `.claude` ディレクトリがマウントされているため、データは保持されます

---

## 📊 動作確認

### 起動確認

```bash
# 1. tmux セッションが作成されているか確認
tmux list-sessions
# 期待する出力:
# shogun: 1 windows (created ...)
# multiagent: 1 windows (created ...)

# 2. 将軍の本陣にアタッチ
tmux attach-session -t shogun

# 3. 家老・足軽の陣を確認
tmux attach-session -t multiagent
```

### Alias 確認

```bash
# コンテナを再ビルド後
alias | grep cs
# 期待する出力:
# alias cmulti='tmux attach-session -t multiagent'
# alias cshogun='tmux attach-session -t shogun'
# alias css='cd /workspaces/multi-agent-shogun-kakeibo && ./shutsujin_departure.sh'
# alias csm='cd /workspaces/multi-agent-shogun-kakeibo'
```

---

## 🛠️ トラブルシューティング

### Q1: alias が使えない

**原因:**
- Dockerfile の変更が反映されていない

**解決策:**
```bash
# VSCode Command Palette (Ctrl+Shift+P)
Dev Containers: Rebuild Container
```

### Q2: tmux セッションが消えた

**原因:**
- コンテナを停止/再起動した

**解決策:**
```bash
# 再度起動スクリプトを実行
./shutsujin_departure.sh
```

### Q3: Memory MCP のデータが消えた

**原因:**
- `.claude` ディレクトリのマウントが正しく設定されていない

**確認方法:**
```bash
ls -la ~/.claude/
# memory や mcp-config.json が存在するか確認
```

**解決策:**
```bash
# devcontainer.json の mounts 設定を確認
# 必要に応じてコンテナを再ビルド
```

### Q4: スクリーンショットが読めない

**原因:**
- スクリーンショットディレクトリが存在しない

**解決策:**
```bash
mkdir -p ./screenshots
# または devcontainer.json でホストのスクリーンショットフォルダをマウント
```

---

## 📚 参考情報

### 関連ファイル

| ファイル | 役割 |
|---------|------|
| [.devcontainer/Dockerfile](.devcontainer/Dockerfile) | コンテナイメージの定義 |
| [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) | Dev Container 設定 |
| [.devcontainer/post-create.sh](.devcontainer/post-create.sh) | 初回作成時のセットアップ |
| [config/settings.yaml](config/settings.yaml) | システム設定 |
| [shutsujin_departure.sh](shutsujin_departure.sh) | 起動スクリプト |

### tmux 基本操作

| コマンド | 説明 |
|---------|------|
| `tmux attach -t shogun` | 将軍の本陣へ |
| `tmux attach -t multiagent` | 家老・足軽の陣へ |
| `Ctrl+B` then `d` | デタッチ（tmuxから抜ける） |
| `tmux kill-session -t shogun` | 将軍セッション終了 |
| `tmux ls` | セッション一覧 |

---

## 🎯 次のステップ

1. **コンテナを再ビルド** して alias を有効化
2. **`./shutsujin_departure.sh`** を実行してシステム起動
3. **`tmux attach -t shogun`** で将軍の本陣へ接続
4. **指示を出して動作確認**

---

## 📝 備考

- このガイドは VSCode Dev Container を前提としていますが、一般的な Docker 環境でも同様の手順が適用できます
- 追加の調整が必要な場合は、このドキュメントを更新してください

---

**天下布武！コンテナ内でも勝利を掴め！**
