#!/bin/bash
# ax-templates Statusline Hook
# Provides status information for Claude Code statusline

# Check for config file
CONFIG_FILE=".ax-config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "ax: no config"
    exit 0
fi

# Load progress
PROGRESS_FILE="state/progress.json"
if [ ! -f "$PROGRESS_FILE" ]; then
    echo "ax: not initialized"
    exit 0
fi

# Get current stage
CURRENT_STAGE=$(cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"currentStage"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

# Get completed count
COMPLETED=$(cat "$PROGRESS_FILE" 2>/dev/null | grep -o '"completed"' | wc -l | tr -d ' ')

# Load context state
CONTEXT_FILE="state/context/state.json"
CONTEXT_PERCENT="--"
if [ -f "$CONTEXT_FILE" ]; then
    CONTEXT_PERCENT=$(cat "$CONTEXT_FILE" 2>/dev/null | grep -o '"remainingPercent"[[:space:]]*:[[:space:]]*[0-9]*' | grep -o '[0-9]*$')
fi

# Build statusline
if [ -n "$CURRENT_STAGE" ]; then
    # Extract stage number
    STAGE_NUM=$(echo "$CURRENT_STAGE" | grep -o '^[0-9]*')
    echo "ax: ${STAGE_NUM}/10 | ctx: ${CONTEXT_PERCENT}%"
else
    echo "ax: ${COMPLETED}/10 done"
fi
