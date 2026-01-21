# ax-templates CLI

Multi-AI Workflow Pipeline Command Line Interface

[![npm version](https://badge.fury.io/js/ax-templates.svg)](https://www.npmjs.com/package/ax-templates)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

`ax-templates` is a 10-stage software development workflow pipeline that orchestrates multiple AI models (Claude, Gemini, Codex) for end-to-end project development.

### Pipeline Stages

| Stage | Name | AI Model | Mode |
|-------|------|----------|------|
| 01 | Brainstorming | Gemini + Claude | YOLO |
| 02 | Research | Claude | Plan |
| 03 | Planning | Gemini | Plan |
| 04 | UI/UX Planning | Gemini | Plan |
| 05 | Task Management | Claude | Plan |
| 06 | Implementation | Claude | Plan + Sandbox |
| 07 | Refactoring | Codex | Deep Dive |
| 08 | QA | Claude | Plan + Sandbox |
| 09 | Testing & E2E | Codex | Sandbox + Playwright |
| 10 | CI/CD & Deployment | Claude | Headless |

## Installation

```bash
# Global installation (recommended)
npm install -g ax-templates

# Or use directly with npx
npx ax-templates <command>
```

## Quick Start

### 1. Initialize a new project

```bash
ax init my-project
```

This launches an interactive wizard to configure:
- Project paths (source code, stages output, state)
- AI CLI tools (Gemini, Codex)
- MCP servers
- tmux session settings
- Context management thresholds

### 2. Start with brainstorming

```bash
cd my-project
ax brainstorm
```

### 3. Progress through stages

```bash
ax status     # View pipeline status
ax next       # Move to next stage
ax stages     # List all stages
```

## Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `ax init [project]` | Initialize a new project with setup wizard |
| `ax status` | Show pipeline progress and current stage |
| `ax stages` | List all stages with details |
| `ax run-stage <stage>` | Run a specific stage |
| `ax next` | Transition to the next stage |
| `ax handoff` | Generate HANDOFF.md for current stage |
| `ax checkpoint` | Create a checkpoint for recovery |
| `ax restore [checkpoint]` | Restore from a checkpoint |
| `ax context` | Check context (token) usage status |
| `ax config [action]` | Manage configuration |

### AI Commands

| Command | Description |
|---------|-------------|
| `ax gemini <prompt>` | Execute prompt via Gemini CLI |
| `ax codex <prompt>` | Execute prompt via Codex CLI |

### Multi-AI Commands

| Command | Description |
|---------|-------------|
| `ax collaborate` | Run multi-AI collaboration (parallel, sequential, debate modes) |
| `ax benchmark` | Compare AI model performance on specific tasks |
| `ax fork` | Create/manage pipeline branches for architecture exploration |
| `ax validate` | Validate stage outputs against quality criteria |

#### Collaboration Modes

```bash
# Parallel mode - same task, multiple AIs
ax collaborate --mode parallel --models claude,gemini --task "Generate ideas"

# Debate mode - AI discussion for optimal solution
ax collaborate --mode debate --rounds 3

# Sequential mode - AI review chain
ax collaborate --mode sequential --task "Code review"
```

#### Pipeline Forking

```bash
# Create a fork
ax fork create --reason "Architecture alternatives" --direction "microservices"

# List and compare forks
ax fork list
ax fork compare

# Merge best fork
ax fork merge fork_name
```

#### Output Validation

```bash
# Validate current stage
ax validate

# Validate with auto-fix
ax validate --fix

# Force continue on failure (not recommended)
ax validate --force
```

### Stage Shortcuts

Run stages directly with shortcut commands:

```bash
ax brainstorm    # 01-brainstorm
ax research      # 02-research
ax planning      # 03-planning
ax ui-ux         # 04-ui-ux
ax tasks         # 05-task-management
ax implement     # 06-implementation
ax refactor      # 07-refactoring
ax qa            # 08-qa
ax test          # 09-testing
ax deploy        # 10-deployment
```

All stage commands support `--dry-run` for validation without execution.

## Configuration

### Configuration File: `.ax-config.yaml`

```yaml
ax_templates:
  version: "2.0.0"

paths:
  project_root: "./my-app"           # Source code location
  stages_output: "./stages"          # Stage outputs
  state: "./state"                   # State files
  checkpoints: "./state/checkpoints" # Checkpoints

ai:
  gemini: true      # Enable Gemini CLI
  codex: true       # Enable Codex CLI

tmux:
  gemini_session: "ax-gemini"
  codex_session: "ax-codex"
  output_timeout: 300

context:
  warning: 60       # Warning at 60% remaining
  action: 50        # Auto-save at 50%
  critical: 40      # Force save at 40%
  task_save_frequency: 5

git:
  commit_language: "Korean"
  auto_commit: true

mcp:
  search: [context7, exa]
  browser: [playwright]
```

### Configuration Priority

1. CLI flags (`--timeout=3600`)
2. Environment variables (`AX_TIMEOUT_06=3600`)
3. Project `.ax-config.yaml`
4. User `~/.ax/config.yaml`
5. Built-in defaults

### View Configuration

```bash
ax config show        # Show merged configuration
ax config edit        # Edit project config
ax config reset       # Reset to defaults
```

## Project Structure

After initialization, your project will have:

```
my-project/
├── .ax-config.yaml        # Project configuration
├── CLAUDE.md              # AI instructions
├── stages/                # Stage outputs
│   ├── 01-brainstorm/
│   │   ├── CLAUDE.md
│   │   ├── config.yaml
│   │   ├── prompts/
│   │   ├── inputs/
│   │   └── outputs/
│   └── ...
├── state/
│   ├── progress.json      # Pipeline progress
│   ├── context/           # Context states
│   └── checkpoints/       # Recovery points
└── my-app/                # Your source code (PROJECT_ROOT)
    └── src/
```

## Workflow Protocol

### Stage Transition Requirements

1. All stage outputs must be generated
2. HANDOFF.md must be created
3. Checkpoint (for implementation/refactoring stages)
4. progress.json updated
5. Next stage CLAUDE.md loaded

### HANDOFF.md Contents

- Completed tasks checklist
- Key decisions and rationale
- Successful/failed approaches
- Immediate next actions
- Checkpoint reference (if applicable)

## Context Management

The CLI monitors context (token) usage and triggers automatic actions:

| Threshold | Trigger | Action |
|-----------|---------|--------|
| 60% remaining | Warning | Display compression ratio |
| 50% remaining | Action | Auto-save state |
| 40% remaining | Critical | Force save, recommend `/clear` |

Check context status:

```bash
ax context
```

## Git Integration

Automatic commits follow Conventional Commits format:

```
<type>(<scope>): <description>
```

| Stage | Type | Scope |
|-------|------|-------|
| 06-implementation | `feat` | `impl` |
| 07-refactoring | `refactor` | `refactor` |
| 08-qa | `fix` | `qa` |
| 09-testing | `test` | `test` |
| 10-deployment | `ci` | `deploy` |

## Requirements

- Node.js >= 18.0.0
- tmux (for AI CLI sessions)
- Optional: Gemini CLI, Codex CLI

## Related Packages

- [`@ax-templates/core`](../core) - Core business logic
- [`@ax-templates/plugin`](../plugin) - Claude Code plugin

## License

MIT
