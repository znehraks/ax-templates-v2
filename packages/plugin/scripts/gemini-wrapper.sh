#!/bin/bash
# ax-templates Gemini Wrapper
# Wraps Gemini CLI calls with tmux session management

set -e

# Configuration
CONFIG_FILE=".ax-config.yaml"
SESSION_NAME="${AX_GEMINI_SESSION:-ax-gemini}"
OUTPUT_TIMEOUT="${AX_OUTPUT_TIMEOUT:-300}"

# Load config if exists
if [ -f "$CONFIG_FILE" ]; then
    SESSION_NAME=$(grep 'gemini_session' "$CONFIG_FILE" 2>/dev/null | cut -d':' -f2 | tr -d ' "' || echo "$SESSION_NAME")
    OUTPUT_TIMEOUT=$(grep 'output_timeout' "$CONFIG_FILE" 2>/dev/null | cut -d':' -f2 | tr -d ' ' || echo "$OUTPUT_TIMEOUT")
fi

# Check if Gemini CLI is available
if ! command -v gemini &> /dev/null; then
    echo "Error: Gemini CLI not found"
    echo "Install: https://github.com/google-gemini/gemini-cli"
    exit 1
fi

# Parse arguments
PROMPT_FILE=""
OUTPUT_FILE=""
NO_WAIT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --no-wait)
            NO_WAIT=true
            shift
            ;;
        --timeout)
            OUTPUT_TIMEOUT="$2"
            shift 2
            ;;
        *)
            PROMPT_FILE="$1"
            shift
            ;;
    esac
done

if [ -z "$PROMPT_FILE" ]; then
    echo "Usage: gemini-wrapper.sh <prompt-file> [-o output-file] [--no-wait] [--timeout seconds]"
    exit 1
fi

# Ensure tmux session exists
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux new-session -d -s "$SESSION_NAME"
    echo "Created tmux session: $SESSION_NAME"
fi

# Read prompt
if [ -f "$PROMPT_FILE" ]; then
    PROMPT=$(cat "$PROMPT_FILE")
else
    PROMPT="$PROMPT_FILE"
fi

# Create unique marker for output detection
MARKER="AX_GEMINI_$(date +%s)_END"

# Send command to tmux
tmux send-keys -t "$SESSION_NAME" "gemini \"$PROMPT\" && echo '$MARKER'" Enter

if [ "$NO_WAIT" = true ]; then
    echo "Command sent to session: $SESSION_NAME"
    echo "Attach: tmux attach -t $SESSION_NAME"
    exit 0
fi

# Wait for output
echo "Waiting for Gemini response (timeout: ${OUTPUT_TIMEOUT}s)..."

START_TIME=$(date +%s)
while true; do
    ELAPSED=$(($(date +%s) - START_TIME))
    if [ $ELAPSED -ge $OUTPUT_TIMEOUT ]; then
        echo "Error: Timeout waiting for response"
        exit 1
    fi

    # Check for marker in tmux output
    if tmux capture-pane -t "$SESSION_NAME" -p | grep -q "$MARKER"; then
        break
    fi

    sleep 1
done

# Capture output
OUTPUT=$(tmux capture-pane -t "$SESSION_NAME" -p -S -1000 | sed "/$MARKER/d")

# Save or display output
if [ -n "$OUTPUT_FILE" ]; then
    echo "$OUTPUT" > "$OUTPUT_FILE"
    echo "Output saved to: $OUTPUT_FILE"
else
    echo "$OUTPUT"
fi
