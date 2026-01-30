#!/bin/bash
# Post-create script for DevContainer

set -e

echo "=== multi-agent-shogun DevContainer Setup ==="

# Ensure npm global bin is in PATH
export PATH="$HOME/.npm-global/bin:$PATH"

# Verify installations
echo "Checking dependencies..."
echo "  Node.js: $(node -v)"
echo "  npm: $(npm -v)"
echo "  tmux: $(tmux -V)"

# Check if Claude CLI is installed, install if not
if ! command -v claude &> /dev/null; then
    echo "Installing Claude Code CLI..."
    npm config set prefix ~/.npm-global
    npm install -g @anthropic-ai/claude-code
fi
echo "  Claude Code CLI: $(claude --version 2>/dev/null || echo 'installed')"

# Create required directories
DIRS=(
    "queue/tasks"
    "queue/reports"
    "config"
    "status"
    "logs"
    "memory"
    "skills"
)

for dir in "${DIRS[@]}"; do
    mkdir -p "$dir"
done

# Initialize config files if they don't exist
if [ ! -f "config/settings.yaml" ]; then
    cat > config/settings.yaml << 'EOF'
# multi-agent-shogun settings
language: ja
shell: bash

skill:
  save_path: "~/.claude/skills/"
  local_path: "./skills/"

logging:
  level: info
  path: "./logs/"
EOF
    echo "Created config/settings.yaml"
fi

if [ ! -f "config/projects.yaml" ]; then
    cat > config/projects.yaml << 'EOF'
projects:
  - id: default
    name: "Default Project"
    path: "/workspaces/multi-agent-shogun-kakeibo"
    priority: high
    status: active

current_project: default
EOF
    echo "Created config/projects.yaml"
fi

# Initialize queue files
for i in {1..8}; do
    TASK_FILE="queue/tasks/ashigaru${i}.yaml"
    if [ ! -f "$TASK_FILE" ]; then
        cat > "$TASK_FILE" << EOF
task:
  task_id: null
  parent_cmd: null
  description: null
  target_path: null
  status: idle
  timestamp: ""
EOF
    fi

    REPORT_FILE="queue/reports/ashigaru${i}_report.yaml"
    if [ ! -f "$REPORT_FILE" ]; then
        cat > "$REPORT_FILE" << EOF
worker_id: ashigaru${i}
task_id: null
timestamp: ""
status: idle
result: null
EOF
    fi
done

if [ ! -f "queue/shogun_to_karo.yaml" ]; then
    echo "queue: []" > queue/shogun_to_karo.yaml
fi

# Set execute permissions
chmod +x *.sh 2>/dev/null || true

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start the system, run:"
echo "  ./shutsujin_departure.sh"
echo ""
echo "Or setup only (no Claude):"
echo "  ./shutsujin_departure.sh -s"
echo ""
