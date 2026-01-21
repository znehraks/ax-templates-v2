/**
 * @ax-templates/core - Defaults Tests
 * Tests for default configuration values
 */

import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CONFIG,
  DEFAULT_STAGES,
  DEFAULT_PIPELINE,
  ENV_VAR_MAP,
} from '../defaults.js';
import { AxConfigSchema, PipelineConfigSchema } from '../schema.js';

describe('DEFAULT_CONFIG', () => {
  it('should be valid according to schema', () => {
    const result = AxConfigSchema.safeParse(DEFAULT_CONFIG);
    expect(result.success).toBe(true);
  });

  it('should have ax_templates version', () => {
    expect(DEFAULT_CONFIG.ax_templates.version).toBe('2.0.0');
  });

  it('should have all required path configurations', () => {
    expect(DEFAULT_CONFIG.paths.project_root).toBe('./');
    expect(DEFAULT_CONFIG.paths.stages_output).toBe('./stages');
    expect(DEFAULT_CONFIG.paths.state).toBe('./state');
    expect(DEFAULT_CONFIG.paths.checkpoints).toBe('./state/checkpoints');
  });

  it('should have AI configurations', () => {
    expect(DEFAULT_CONFIG.ai.gemini).toBe(true);
    expect(DEFAULT_CONFIG.ai.codex).toBe(true);
  });

  it('should have tmux configurations', () => {
    expect(DEFAULT_CONFIG.tmux.gemini_session).toBe('ax-gemini');
    expect(DEFAULT_CONFIG.tmux.codex_session).toBe('ax-codex');
    expect(DEFAULT_CONFIG.tmux.output_timeout).toBe(300);
  });

  it('should have context thresholds', () => {
    expect(DEFAULT_CONFIG.context.warning).toBe(60);
    expect(DEFAULT_CONFIG.context.action).toBe(50);
    expect(DEFAULT_CONFIG.context.critical).toBe(40);
    expect(DEFAULT_CONFIG.context.task_save_frequency).toBe(5);
  });

  it('should have context thresholds in descending order', () => {
    expect(DEFAULT_CONFIG.context.warning).toBeGreaterThan(DEFAULT_CONFIG.context.action);
    expect(DEFAULT_CONFIG.context.action).toBeGreaterThan(DEFAULT_CONFIG.context.critical);
  });

  it('should have MCP configurations', () => {
    expect(DEFAULT_CONFIG.mcp.search).toContain('context7');
    expect(DEFAULT_CONFIG.mcp.search).toContain('exa');
    expect(DEFAULT_CONFIG.mcp.browser).toContain('playwright');
  });

  it('should have git configurations', () => {
    expect(DEFAULT_CONFIG.git.commit_language).toBe('Korean');
    expect(DEFAULT_CONFIG.git.auto_commit).toBe(true);
  });

  it('should have timeouts for all 10 stages', () => {
    expect(DEFAULT_CONFIG.timeouts).toBeDefined();

    const expectedStages = [
      '01-brainstorm',
      '02-research',
      '03-planning',
      '04-ui-ux',
      '05-task-management',
      '06-implementation',
      '07-refactoring',
      '08-qa',
      '09-testing',
      '10-deployment',
    ];

    for (const stageId of expectedStages) {
      expect(DEFAULT_CONFIG.timeouts?.[stageId]).toBeDefined();
      expect(typeof DEFAULT_CONFIG.timeouts?.[stageId]).toBe('number');
      expect(DEFAULT_CONFIG.timeouts?.[stageId]).toBeGreaterThan(0);
    }
  });

  it('should have reasonable timeout values', () => {
    // Implementation stage should have longest timeout
    expect(DEFAULT_CONFIG.timeouts?.['06-implementation']).toBeGreaterThanOrEqual(
      DEFAULT_CONFIG.timeouts?.['01-brainstorm']!
    );

    // All timeouts should be at least 30 minutes
    for (const timeout of Object.values(DEFAULT_CONFIG.timeouts!)) {
      expect(timeout).toBeGreaterThanOrEqual(1800);
    }
  });
});

describe('DEFAULT_STAGES', () => {
  it('should have exactly 10 stages', () => {
    expect(DEFAULT_STAGES).toHaveLength(10);
  });

  it('should have stages in correct order', () => {
    const stageIds = DEFAULT_STAGES.map(s => s.id);

    expect(stageIds[0]).toBe('01-brainstorm');
    expect(stageIds[1]).toBe('02-research');
    expect(stageIds[2]).toBe('03-planning');
    expect(stageIds[3]).toBe('04-ui-ux');
    expect(stageIds[4]).toBe('05-task-management');
    expect(stageIds[5]).toBe('06-implementation');
    expect(stageIds[6]).toBe('07-refactoring');
    expect(stageIds[7]).toBe('08-qa');
    expect(stageIds[8]).toBe('09-testing');
    expect(stageIds[9]).toBe('10-deployment');
  });

  it('should have unique stage IDs', () => {
    const stageIds = DEFAULT_STAGES.map(s => s.id);
    const uniqueIds = new Set(stageIds);
    expect(uniqueIds.size).toBe(stageIds.length);
  });

  it('each stage should have required fields', () => {
    for (const stage of DEFAULT_STAGES) {
      expect(stage.id).toBeDefined();
      expect(stage.name).toBeDefined();
      expect(stage.models).toBeDefined();
      expect(stage.models.length).toBeGreaterThan(0);
      expect(stage.mode).toBeDefined();
      expect(stage.inputs).toBeDefined();
      expect(stage.outputs).toBeDefined();
      expect(stage.timeout).toBeDefined();
    }
  });

  it('each stage should have HANDOFF.md in outputs (except last)', () => {
    for (let i = 0; i < DEFAULT_STAGES.length - 1; i++) {
      const stage = DEFAULT_STAGES[i];
      expect(stage.outputs).toContain('HANDOFF.md');
    }
  });

  it('implementation and refactoring stages should require checkpoint', () => {
    const implementation = DEFAULT_STAGES.find(s => s.id === '06-implementation');
    const refactoring = DEFAULT_STAGES.find(s => s.id === '07-refactoring');

    expect(implementation?.checkpoint_required).toBe(true);
    expect(refactoring?.checkpoint_required).toBe(true);
  });

  it('sandbox stages should have sandbox flag', () => {
    const sandboxStages = DEFAULT_STAGES.filter(s =>
      s.mode.includes('sandbox') || s.mode.includes('plan_sandbox')
    );

    for (const stage of sandboxStages) {
      expect(stage.sandbox).toBe(true);
    }
  });

  it('brainstorm stage should have container flag', () => {
    const brainstorm = DEFAULT_STAGES.find(s => s.id === '01-brainstorm');
    expect(brainstorm?.container).toBe(true);
  });

  it('stages with MCP servers should have them defined', () => {
    const research = DEFAULT_STAGES.find(s => s.id === '02-research');
    const testing = DEFAULT_STAGES.find(s => s.id === '09-testing');

    expect(research?.mcp_servers).toBeDefined();
    expect(research?.mcp_servers?.length).toBeGreaterThan(0);

    expect(testing?.mcp_servers).toBeDefined();
    expect(testing?.mcp_servers).toContain('playwright');
  });
});

describe('DEFAULT_PIPELINE', () => {
  it('should be valid according to schema', () => {
    const result = PipelineConfigSchema.safeParse(DEFAULT_PIPELINE);
    expect(result.success).toBe(true);
  });

  it('should have name and version', () => {
    expect(DEFAULT_PIPELINE.name).toBeDefined();
    expect(DEFAULT_PIPELINE.version).toBeDefined();
  });

  it('should have description', () => {
    expect(DEFAULT_PIPELINE.description).toBeDefined();
  });

  it('should use DEFAULT_STAGES', () => {
    expect(DEFAULT_PIPELINE.stages).toBe(DEFAULT_STAGES);
    expect(DEFAULT_PIPELINE.stages).toHaveLength(10);
  });
});

describe('ENV_VAR_MAP', () => {
  it('should map paths config to env vars', () => {
    expect(ENV_VAR_MAP['paths.project_root']).toBe('AX_PROJECT_ROOT');
    expect(ENV_VAR_MAP['paths.stages_output']).toBe('AX_STAGES_OUTPUT');
    expect(ENV_VAR_MAP['paths.state']).toBe('AX_STATE_DIR');
    expect(ENV_VAR_MAP['paths.checkpoints']).toBe('AX_CHECKPOINTS_DIR');
  });

  it('should map AI config to env vars', () => {
    expect(ENV_VAR_MAP['ai.gemini']).toBe('AX_AI_GEMINI');
    expect(ENV_VAR_MAP['ai.codex']).toBe('AX_AI_CODEX');
  });

  it('should map tmux config to env vars', () => {
    expect(ENV_VAR_MAP['tmux.gemini_session']).toBe('AX_TMUX_GEMINI');
    expect(ENV_VAR_MAP['tmux.codex_session']).toBe('AX_TMUX_CODEX');
    expect(ENV_VAR_MAP['tmux.output_timeout']).toBe('AX_TMUX_TIMEOUT');
  });

  it('should map context config to env vars', () => {
    expect(ENV_VAR_MAP['context.warning']).toBe('AX_CONTEXT_WARNING');
    expect(ENV_VAR_MAP['context.action']).toBe('AX_CONTEXT_ACTION');
    expect(ENV_VAR_MAP['context.critical']).toBe('AX_CONTEXT_CRITICAL');
    expect(ENV_VAR_MAP['context.task_save_frequency']).toBe('AX_TASK_SAVE_FREQ');
  });

  it('should map git config to env vars', () => {
    expect(ENV_VAR_MAP['git.commit_language']).toBe('AX_GIT_LANG');
    expect(ENV_VAR_MAP['git.auto_commit']).toBe('AX_GIT_AUTO_COMMIT');
  });

  it('should map stage timeouts to env vars', () => {
    expect(ENV_VAR_MAP['timeouts.01-brainstorm']).toBe('AX_TIMEOUT_01');
    expect(ENV_VAR_MAP['timeouts.02-research']).toBe('AX_TIMEOUT_02');
    expect(ENV_VAR_MAP['timeouts.06-implementation']).toBe('AX_TIMEOUT_06');
    expect(ENV_VAR_MAP['timeouts.10-deployment']).toBe('AX_TIMEOUT_10');
  });

  it('should have all env vars start with AX_', () => {
    for (const envVar of Object.values(ENV_VAR_MAP)) {
      expect(envVar.startsWith('AX_')).toBe(true);
    }
  });

  it('should have unique env var names', () => {
    const envVars = Object.values(ENV_VAR_MAP);
    const uniqueVars = new Set(envVars);
    expect(uniqueVars.size).toBe(envVars.length);
  });
});
