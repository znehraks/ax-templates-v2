# Migration Guide: v1.x to v2.0

This guide helps you migrate existing ax-templates projects from v1.x to v2.0.

## Overview of Changes

### What's New in v2.0

1. **Modular Architecture**: Monorepo with separate packages
   - `@ax-templates/core` - Shared business logic
   - `ax-templates` - NPM CLI
   - `@ax-templates/plugin` - Claude Code plugin

2. **Unified Configuration**: Single `.ax-config.yaml` replaces multiple config files

3. **Template Variables**: Dynamic configuration via template variables

4. **Enhanced CLI**: Full-featured command-line interface

### Breaking Changes

| v1.x | v2.0 |
|------|------|
| `config/models.yaml` | `.ax-config.yaml` → `ai` section |
| `config/pipeline.yaml` | `.ax-config.yaml` → `paths`, `timeouts` |
| `config/context.yaml` | `.ax-config.yaml` → `context` section |
| `config/git.yaml` | `.ax-config.yaml` → `git` section |
| Hardcoded paths | Template variables `{{VAR}}` |
| Manual stage scripts | `ax run-stage` / `/run-stage` |

## Migration Steps

### Step 1: Install v2.0

```bash
# Install globally
npm install -g ax-templates@2.0.0

# Or for Claude Code plugin
claude plugin install @ax-templates/plugin
```

### Step 2: Run Migration Tool

```bash
cd your-existing-project
ax migrate
```

The migrate command:
1. Scans existing `config/` directory
2. Extracts values from YAML files
3. Generates `.ax-config.yaml`
4. Backs up old config to `config.backup/`

### Step 3: Manual Migration (if needed)

If automatic migration isn't available, create `.ax-config.yaml` manually:

#### From `config/models.yaml`

```yaml
# OLD: config/models.yaml
stages:
  01-brainstorm:
    models:
      - gemini-2.5-pro
      - claude-code
```

```yaml
# NEW: .ax-config.yaml
ai:
  gemini: true
  codex: true

tmux:
  gemini_session: "ax-gemini"
  codex_session: "ax-codex"
```

#### From `config/pipeline.yaml`

```yaml
# OLD: config/pipeline.yaml
stages:
  01-brainstorm:
    timeout: 3600
    outputs_path: ./stages/01-brainstorm/outputs
```

```yaml
# NEW: .ax-config.yaml
paths:
  stages_output: "./stages"

timeouts:
  "01-brainstorm": 3600
```

#### From `config/context.yaml`

```yaml
# OLD: config/context.yaml
thresholds:
  warning: 60
  action: 50
  critical: 40
task_save_frequency: 5
```

```yaml
# NEW: .ax-config.yaml
context:
  warning: 60
  action: 50
  critical: 40
  task_save_frequency: 5
```

#### From `config/git.yaml`

```yaml
# OLD: config/git.yaml
commit:
  language: "Korean"
auto_commit: true
```

```yaml
# NEW: .ax-config.yaml
git:
  commit_language: "Korean"
  auto_commit: true
```

### Step 4: Update Stage Templates

Stage `CLAUDE.md` files now use template variables:

```markdown
# OLD: Hardcoded paths
저장 위치: `./stages/01-brainstorm/outputs/`

# NEW: Template variables
저장 위치: `{{STAGES_OUTPUT}}/01-brainstorm/outputs/`
```

The migration preserves your stage output content but updates path references.

### Step 5: Update Scripts

#### Gemini/Codex Wrapper Scripts

```bash
# OLD: scripts/gemini-wrapper.sh
tmux send-keys -t ax-gemini "$prompt" Enter

# NEW: Reads from config
SESSION=$(yq '.tmux.gemini_session' .ax-config.yaml)
tmux send-keys -t "$SESSION" "$prompt" Enter
```

### Step 6: Verify Migration

```bash
# Check configuration
ax config show

# Verify pipeline status
ax status

# Test a stage (dry run)
ax brainstorm --dry-run
```

## Complete .ax-config.yaml Example

```yaml
# Migrated configuration
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

timeouts:
  "01-brainstorm": 3600
  "06-implementation": 14400
  "07-refactoring": 7200

mcp:
  search: [context7, exa]
  browser: [playwright]

git:
  commit_language: "Korean"
  auto_commit: true
```

## State File Migration

### progress.json

The format remains compatible. No changes needed.

### Checkpoints

Existing checkpoints in `state/checkpoints/` remain valid.

### Context States

Context state files in `state/context/` are forward-compatible.

## Slash Command Changes

| v1.x | v2.0 | Notes |
|------|------|-------|
| `/init-project` | `/init-project` | Same |
| `/run-stage` | `/run-stage` | Same |
| `/status` | `/status` | Same |
| `/stages` | `/stages` | Same |
| `/next` | `/next` | Same |
| `/handoff` | `/handoff` | Same |
| `/checkpoint` | `/checkpoint` | Same |
| `/restore` | `/restore` | Same |
| `/gemini` | `/gemini` | Uses config session |
| `/codex` | `/codex` | Uses config session |
| `/context` | `/context` | Enhanced output |

All stage shortcuts remain the same:
`/brainstorm`, `/research`, `/planning`, `/ui-ux`, `/tasks`, `/implement`, `/refactor`, `/qa`, `/test`, `/deploy`

## CLI Equivalents

For v2.0, all slash commands have CLI equivalents:

```bash
# Claude Code slash command
/init-project my-app

# CLI equivalent
ax init my-app
```

## Troubleshooting

### "Configuration file not found"

```bash
# Create new config
ax init --config-only
```

### "Invalid configuration"

Check schema with:
```bash
ax config validate
```

### "Stage not found"

Ensure templates are installed:
```bash
ax init --templates-only
```

### tmux Session Errors

Verify session names match config:
```bash
tmux ls
# Should show: ax-gemini, ax-codex
```

## Rollback

If you need to rollback to v1.x:

```bash
# Restore backup configs
mv config.backup/* config/

# Downgrade
npm install -g ax-templates@1.x.x
```

## Support

- GitHub Issues: https://github.com/your-org/ax-templates/issues
- Documentation: https://github.com/your-org/ax-templates/docs
