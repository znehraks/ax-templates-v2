# ax-templates

Multi-AI Workflow Pipeline for Software Development

[![CI](https://github.com/your-org/ax-templates/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/ax-templates/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/ax-templates.svg)](https://www.npmjs.com/package/ax-templates)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

ax-templates is a 10-stage software development workflow pipeline that orchestrates multiple AI models (Claude, Gemini, Codex) for end-to-end project development.

### Key Features

- **10-Stage Pipeline**: Complete development cycle from brainstorming to deployment
- **Multi-AI Orchestration**: Intelligent collaboration between Gemini, Claude, and Codex with parallel, sequential, and debate modes
- **Smart HANDOFF System**: Automatic context extraction, semantic compression, and AI memory integration
- **Auto-Checkpoint & Smart Rollback**: Task-based triggers, file change detection, partial rollback support
- **Pipeline Forking**: Branch exploration for architecture alternatives with merge capabilities
- **Stage Personas**: Optimized AI behavior profiles per stage (Creative Explorer, Precise Builder, etc.)
- **Output Validation**: Automated quality checks with lint, typecheck, and coverage verification
- **Dual Distribution**: Both NPM CLI and Claude Code plugin available

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ax-templates Pipeline                           │
├─────────────────────────────────────────────────────────────────────┤
│  01 Brainstorm  →  02 Research  →  03 Planning  →  04 UI/UX        │
│     Gemini          Claude          Gemini          Gemini          │
├─────────────────────────────────────────────────────────────────────┤
│  05 Tasks  →  06 Implement  →  07 Refactor  →  08 QA  →  09 Test   │
│    Claude       Claude           Codex         Claude     Codex     │
├─────────────────────────────────────────────────────────────────────┤
│                          10 Deploy                                  │
│                            Claude                                   │
└─────────────────────────────────────────────────────────────────────┘
```

| Stage | Name | AI Model | Mode |
|-------|------|----------|------|
| 01 | Brainstorming | Gemini + Claude | YOLO (Container) |
| 02 | Research | Claude | Plan Mode |
| 03 | Planning | Gemini | Plan Mode |
| 04 | UI/UX Planning | Gemini | Plan Mode |
| 05 | Task Management | Claude | Plan Mode |
| 06 | Implementation | Claude | Plan + Sandbox |
| 07 | Refactoring | Codex | Deep Dive |
| 08 | QA | Claude | Plan + Sandbox |
| 09 | Testing & E2E | Codex | Sandbox + Playwright |
| 10 | CI/CD & Deployment | Claude | Headless |

## Installation

### NPM CLI

```bash
# Global installation
npm install -g ax-templates

# Or use directly with npx
npx ax-templates init my-project
```

### Claude Code Plugin

```bash
claude plugin install @ax-templates/plugin
```

## Quick Start

### Using CLI

```bash
# Initialize a new project
ax init my-project
cd my-project

# Edit project brief
# stages/01-brainstorm/inputs/project_brief.md

# Start with brainstorming
ax brainstorm

# Check status
ax status

# Create handoff and move to next stage
ax handoff
ax next
```

### Using Claude Code Plugin

In Claude Code, run:

```
/init-project my-project
/brainstorm
/status
/handoff
/next
```

## Packages

This monorepo contains three packages:

| Package | Description | Install |
|---------|-------------|---------|
| [`ax-templates`](./packages/cli) | NPM CLI | `npm install -g ax-templates` |
| [`@ax-templates/core`](./packages/core) | Core library | `npm install @ax-templates/core` |
| [`@ax-templates/plugin`](./packages/plugin) | Claude Code plugin | `claude plugin install @ax-templates/plugin` |

## Commands

### Core Commands

| Command | CLI | Plugin |
|---------|-----|--------|
| Initialize project | `ax init` | `/init-project` |
| Show status | `ax status` | `/status` |
| List stages | `ax stages` | `/stages` |
| Run stage | `ax run-stage <id>` | `/run-stage <id>` |
| Next stage | `ax next` | `/next` |
| Create handoff | `ax handoff` | `/handoff` |
| Create checkpoint | `ax checkpoint` | `/checkpoint` |
| Restore checkpoint | `ax restore` | `/restore` |
| Check context | `ax context` | `/context` |

### AI Commands

| Command | CLI | Plugin |
|---------|-----|--------|
| Gemini prompt | `ax gemini <prompt>` | `/gemini <prompt>` |
| Codex prompt | `ax codex <prompt>` | `/codex <prompt>` |

### Multi-AI Commands

| Command | CLI | Plugin | Description |
|---------|-----|--------|-------------|
| AI Collaboration | `ax collaborate` | `/collaborate` | Run multi-AI collaboration (parallel, sequential, debate modes) |
| AI Benchmarking | `ax benchmark` | `/benchmark` | Compare AI model performance on tasks |
| Pipeline Fork | `ax fork` | `/fork` | Create/manage pipeline branches for exploration |
| Output Validation | `ax validate` | `/validate` | Validate stage outputs against quality criteria |

### Stage Shortcuts

| Stage | CLI | Plugin |
|-------|-----|--------|
| 01-brainstorm | `ax brainstorm` | `/brainstorm` |
| 02-research | `ax research` | `/research` |
| 03-planning | `ax planning` | `/planning` |
| 04-ui-ux | `ax ui-ux` | `/ui-ux` |
| 05-task-management | `ax tasks` | `/tasks` |
| 06-implementation | `ax implement` | `/implement` |
| 07-refactoring | `ax refactor` | `/refactor` |
| 08-qa | `ax qa` | `/qa` |
| 09-testing | `ax test` | `/test` |
| 10-deployment | `ax deploy` | `/deploy` |

## Configuration

Project configuration is stored in `.ax-config.yaml`:

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

## Project Structure

```
my-project/
├── .ax-config.yaml        # Configuration
├── CLAUDE.md              # AI instructions
├── stages/                # Stage outputs
│   ├── 01-brainstorm/
│   │   ├── CLAUDE.md
│   │   ├── config.yaml
│   │   ├── prompts/
│   │   ├── inputs/
│   │   └── outputs/
│   ├── 02-research/
│   └── ...
├── state/
│   ├── progress.json      # Pipeline progress
│   ├── context/           # Context states
│   └── checkpoints/       # Recovery points
└── my-app/                # Source code
    └── src/
```

## Design Patterns

1. **Sequential Workflow Architecture** - Sequential stage definition and auto-progression
2. **Stateless Orchestration** - Stateless context transfer via HANDOFF.md
3. **Orchestrator-Workers** - Parallel agent execution (Brainstorm stage)
4. **Proactive State Externalization** - External state file management
5. **State Machine Workflow** - State transition management (progress.json)
6. **Layered Configuration** - Hierarchical configuration structure
7. **Multi-AI Collaboration** - Parallel, sequential, and debate modes for AI coordination
8. **Pipeline Forking** - Branch exploration with merge capabilities
9. **Smart Context Management** - Semantic compression and AI memory integration

## Documentation

- [CLI Reference](./packages/cli/README.md)
- [Plugin Reference](./packages/plugin/README.md)
- [Migration Guide](./docs/migration-guide.md)

## Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- tmux (for AI sessions)

### Setup

```bash
# Clone repository
git clone https://github.com/your-org/ax-templates.git
cd ax-templates

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Local Development

```bash
# Link CLI globally
cd packages/cli
pnpm link --global

# Test CLI
ax --help

# Link plugin to Claude Code
claude plugin link ./packages/plugin
```

### Monorepo Structure

```
ax-templates/
├── packages/
│   ├── core/              # Shared business logic
│   │   ├── src/
│   │   │   ├── config/    # Configuration management
│   │   │   ├── stage/     # Stage management
│   │   │   ├── context/   # Context management
│   │   │   └── ai/        # AI model abstraction
│   │   └── package.json
│   │
│   ├── cli/               # NPM CLI package
│   │   ├── src/
│   │   │   ├── commands/  # CLI commands
│   │   │   └── prompts/   # Interactive prompts
│   │   ├── bin/ax.js
│   │   └── package.json
│   │
│   └── plugin/            # Claude Code plugin
│       ├── plugin.json
│       ├── CLAUDE.md
│       ├── .claude/
│       │   ├── commands/  # Slash commands
│       │   └── hooks/     # Lifecycle hooks
│       ├── scripts/       # Helper scripts
│       └── package.json
│
├── templates/             # Installable templates
│   └── default/           # Default 10-stage template
│
├── docs/                  # Documentation
└── package.json           # Monorepo root
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `chore`: Maintenance
- `refactor`: Code refactoring
- `test`: Test updates

## License

MIT

## Related

- [Claude Code](https://claude.ai/claude-code) - AI coding assistant
- [Gemini CLI](https://github.com/google-gemini/gemini-cli) - Google's AI CLI
