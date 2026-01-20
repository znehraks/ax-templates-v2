#!/bin/bash
# ax-templates Session Start Hook
# Runs when a Claude Code session starts

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  ax-templates Pipeline Session${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check for config file
CONFIG_FILE=".ax-config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo -e "${YELLOW}⚠️  .ax-config.yaml not found${NC}"
    echo -e "   Run ${GREEN}/init-project${NC} to initialize"
    exit 0
fi

# Load progress
PROGRESS_FILE="state/progress.json"
if [ -f "$PROGRESS_FILE" ]; then
    CURRENT_STAGE=$(cat "$PROGRESS_FILE" | grep -o '"currentStage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
    if [ -n "$CURRENT_STAGE" ]; then
        echo -e "${GREEN}📍 Current Stage:${NC} $CURRENT_STAGE"
    fi
fi

# Check tmux sessions
echo ""
echo -e "${CYAN}tmux Sessions:${NC}"

# Gemini session
GEMINI_SESSION=$(grep 'gemini_session' "$CONFIG_FILE" 2>/dev/null | cut -d':' -f2 | tr -d ' "' || echo "ax-gemini")
if tmux has-session -t "$GEMINI_SESSION" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Gemini: $GEMINI_SESSION"
else
    echo -e "  ${YELLOW}○${NC} Gemini: $GEMINI_SESSION (not running)"
fi

# Codex session
CODEX_SESSION=$(grep 'codex_session' "$CONFIG_FILE" 2>/dev/null | cut -d':' -f2 | tr -d ' "' || echo "ax-codex")
if tmux has-session -t "$CODEX_SESSION" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} Codex: $CODEX_SESSION"
else
    echo -e "  ${YELLOW}○${NC} Codex: $CODEX_SESSION (not running)"
fi

echo ""
echo -e "${CYAN}Commands:${NC} /status | /stages | /next | /handoff"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
