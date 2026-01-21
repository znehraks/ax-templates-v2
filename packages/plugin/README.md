# @ax-templates/plugin

Claude Code Plugin for ax-templates Multi-AI Workflow Pipeline

[![npm version](https://badge.fury.io/js/%40ax-templates%2Fplugin.svg)](https://www.npmjs.com/package/@ax-templates/plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This package provides a Claude Code plugin for the ax-templates workflow system. It enables slash commands and AI instructions directly within Claude Code for managing the 10-stage development pipeline.

## Installation

### Via Claude Code Plugin Manager

```bash
claude plugin install @ax-templates/plugin
```

### Manual Installation

```bash
npm install @ax-templates/plugin
claude plugin link ./node_modules/@ax-templates/plugin
```

### From Source

```bash
git clone https://github.com/your-org/ax-templates.git
cd ax-templates
pnpm install
claude plugin link ./packages/plugin
```

## Quick Start

### 1. Initialize a Project

After installing the plugin, open a new directory in Claude Code and run:

```
/init-project
```

This creates the project structure with:
- `.ax-config.yaml` - Project configuration
- `stages/` - 10 stage directories
- `state/` - Progress tracking
- `CLAUDE.md` - AI instructions

### 2. Start Development

```
/brainstorm
```

### 3. Track Progress

```
/status
```

## Available Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `/init-project` | Initialize a new ax-templates project |
| `/run-stage <id>` | Run a specific stage |
| `/status` | Show pipeline status |
| `/stages` | List all stages with details |
| `/next` | Transition to next stage |
| `/handoff` | Generate HANDOFF.md |
| `/checkpoint` | Create recovery checkpoint |
| `/restore` | Restore from checkpoint |
| `/context` | Check context usage |

### AI Commands

| Command | Description |
|---------|-------------|
| `/gemini <prompt>` | Execute via Gemini CLI (tmux) |
| `/codex <prompt>` | Execute via Codex CLI (tmux) |

### Multi-AI Commands

| Command | Description |
|---------|-------------|
| `/collaborate` | Run multi-AI collaboration (parallel, sequential, debate modes) |
| `/benchmark` | Compare AI model performance on specific tasks |
| `/fork` | Create/manage pipeline branches for exploration |
| `/validate` | Validate stage outputs against quality criteria |

#### Usage Examples

```
# Parallel collaboration
/collaborate --mode parallel --models claude,gemini --task "Brainstorm features"

# Debate mode for architectural decisions
/collaborate --mode debate --rounds 3

# Create pipeline fork for alternative approaches
/fork create --reason "Microservices vs Monolith" --direction "microservices"

# Validate current stage outputs
/validate --verbose
```

### Stage Shortcuts

| Command | Stage |
|---------|-------|
| `/brainstorm` | 01-brainstorm |
| `/research` | 02-research |
| `/planning` | 03-planning |
| `/ui-ux` | 04-ui-ux |
| `/tasks` | 05-task-management |
| `/implement` | 06-implementation |
| `/refactor` | 07-refactoring |
| `/qa` | 08-qa |
| `/test` | 09-testing |
| `/deploy` | 10-deployment |

## Configuration

### Project Configuration: `.ax-config.yaml`

The plugin reads configuration from `.ax-config.yaml` in your project root:

```yaml
ax_templates:
  version: "2.0.0"

paths:
  project_root: "./my-app"
  stages_output: "./stages"
  state: "./state"
  checkpoints: "./state/checkpoints"

ai:
  gemini: true
  codex: true

tmux:
  gemini_session: "ax-gemini"
  codex_session: "ax-codex"
  output_timeout: 300

context:
  warning: 60
  action: 50
  critical: 40
  task_save_frequency: 5

git:
  commit_language: "Korean"
  auto_commit: true
```

### Template Variables

The plugin CLAUDE.md uses template variables that are resolved from configuration:

| Variable | Description | Default |
|----------|-------------|---------|
| `{{PROJECT_ROOT}}` | Source code directory | `./app` |
| `{{STAGES_OUTPUT}}` | Stages output directory | `./stages` |
| `{{STATE_DIR}}` | State files directory | `./state` |
| `{{CHECKPOINTS_DIR}}` | Checkpoints directory | `./state/checkpoints` |
| `{{GEMINI_SESSION}}` | Gemini tmux session | `ax-gemini` |
| `{{CODEX_SESSION}}` | Codex tmux session | `ax-codex` |
| `{{OUTPUT_TIMEOUT}}` | AI output timeout | `300` |
| `{{CONTEXT_WARNING}}` | Warning threshold % | `60` |
| `{{CONTEXT_ACTION}}` | Action threshold % | `50` |
| `{{CONTEXT_CRITICAL}}` | Critical threshold % | `40` |

## Plugin Structure

```
@ax-templates/plugin/
├── plugin.json              # Plugin manifest
├── CLAUDE.md                # AI instructions template
├── .claude/
│   ├── settings.json        # Claude Code settings
│   ├── commands/            # 21 command files
│   │   ├── init-project.md
│   │   ├── run-stage.md
│   │   ├── status.md
│   │   └── ...
│   └── hooks/
│       └── statusline.sh    # Status bar script
├── config/
│   └── defaults.yaml        # Default configuration
├── scripts/
│   ├── session-start.sh     # Session hook
│   ├── stop.sh              # Stop hook
│   ├── gemini-wrapper.sh    # Gemini CLI wrapper
│   └── codex-wrapper.sh     # Codex CLI wrapper
└── state/
    └── progress.json        # Initial progress state
```

## Hooks

### Session Start Hook

`scripts/session-start.sh` runs when Claude Code starts:
- Validates `.ax-config.yaml` exists
- Checks AI CLI availability
- Displays welcome message

### Status Line Hook

`.claude/hooks/statusline.sh` provides real-time status:
- Current stage name
- Progress percentage
- Context usage indicator

## MCP Server Recommendations

The plugin recommends these MCP servers:

```json
{
  "mcp": {
    "recommended": ["context7", "exa", "playwright"]
  }
}
```

- **context7**: Documentation search
- **exa**: Web search
- **playwright**: Browser automation for E2E

## Workflow Protocol

### Stage Transitions

1. Complete all stage outputs
2. Generate HANDOFF.md (`/handoff`)
3. Create checkpoint if needed (`/checkpoint`)
4. Move to next stage (`/next`)

### HANDOFF.md Requirements

Every stage transition requires a HANDOFF.md containing:
- Completed tasks checklist
- Key decisions and rationale
- Successful/failed approaches
- Immediate next actions
- Checkpoint reference

### Context Management

The plugin monitors context usage:

| Remaining | Action |
|-----------|--------|
| 60% | Warning banner |
| 50% | Auto-save state |
| 40% | Force save, recommend `/clear` |

## Auto-Activated Skills

The plugin includes skills that automatically activate based on triggers:

| Skill | Trigger | Description |
|-------|---------|-------------|
| `stage-transition` | "완료", `/next` | Detects stage completion and automates transitions |
| `context-compression` | Token > 50k | Compresses context and saves state |
| `smart-handoff` | Stage completion | Smart context extraction and HANDOFF generation |
| `ai-collaboration` | `/collaborate` | Multi-AI collaboration orchestration |
| `auto-checkpoint` | Trigger conditions | Automatic checkpoint creation |
| `output-validator` | `/validate`, Stage end | Output validation and quality assurance |

### Stage Personas

Each stage has an optimized AI behavior profile:

| Stage | Persona | Characteristics | Temperature |
|-------|---------|-----------------|-------------|
| 01-brainstorm | Creative Explorer | Divergent thinking, no constraints | 0.9 |
| 02-research | Analytical Investigator | Systematic analysis, deep research | 0.5 |
| 03-planning | Strategic Architect | Long-term view, structural thinking | 0.6 |
| 06-implementation | Precise Builder | Accurate implementation, error prevention | 0.3 |
| 07-refactoring | Code Surgeon | Deep analysis, performance optimization | 0.5 |
| 08-qa | Quality Guardian | Thorough verification, risk detection | 0.4 |

## Requirements

- Claude Code CLI
- Node.js >= 18.0.0
- tmux (for AI sessions)
- Optional: Gemini CLI, Codex CLI

## Related Packages

- [`ax-templates`](../cli) - NPM CLI
- [`@ax-templates/core`](../core) - Core library

## License

MIT
