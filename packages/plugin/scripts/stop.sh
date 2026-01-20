#!/bin/bash
# ax-templates Session Stop Hook
# Runs when a Claude Code session ends

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  ax-templates Session Ending${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check for config file
CONFIG_FILE=".ax-config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    exit 0
fi

# Check current stage
PROGRESS_FILE="state/progress.json"
if [ -f "$PROGRESS_FILE" ]; then
    CURRENT_STAGE=$(cat "$PROGRESS_FILE" | grep -o '"currentStage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

    if [ -n "$CURRENT_STAGE" ]; then
        echo -e "${YELLOW}📍 Current Stage:${NC} $CURRENT_STAGE"

        # Check if HANDOFF.md exists for current stage
        HANDOFF_FILE="stages/$CURRENT_STAGE/HANDOFF.md"
        if [ ! -f "$HANDOFF_FILE" ]; then
            echo -e "${YELLOW}⚠️  HANDOFF.md not generated for current stage${NC}"
            echo -e "   Consider running ${GREEN}/handoff${NC} before ending"
        fi
    fi
fi

# Save context state
CONTEXT_DIR="state/context"
if [ -d "$CONTEXT_DIR" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    SNAPSHOT_FILE="$CONTEXT_DIR/session_end_${TIMESTAMP}.md"

    echo "# Session End Snapshot" > "$SNAPSHOT_FILE"
    echo "" >> "$SNAPSHOT_FILE"
    echo "Timestamp: $(date -Iseconds)" >> "$SNAPSHOT_FILE"
    echo "Stage: $CURRENT_STAGE" >> "$SNAPSHOT_FILE"

    echo -e "${GREEN}✓${NC} Session state saved to $SNAPSHOT_FILE"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
