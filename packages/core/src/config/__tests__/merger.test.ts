/**
 * @ax-templates/core - Merger Tests
 * Tests for configuration merging functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mergeConfigs,
  mergeMultipleConfigs,
  applyEnvironmentVariables,
  getActiveEnvironmentOverrides,
  parseCLIOverrides,
  applyCLIOverrides,
  diffConfigs,
  resolveTemplateVariables,
  configToTemplateVariables,
} from '../merger.js';
import { DEFAULT_CONFIG, ENV_VAR_MAP } from '../defaults.js';
import type { AxConfig } from '../schema.js';

describe('mergeConfigs', () => {
  it('should merge two configs with override taking precedence', () => {
    const base = {
      paths: { project_root: './base', stages_output: './stages' },
      ai: { gemini: true, codex: true },
    };

    const override = {
      paths: { project_root: './override' },
      ai: { gemini: false },
    };

    const result = mergeConfigs(base, override);

    expect(result.paths.project_root).toBe('./override');
    expect(result.paths.stages_output).toBe('./stages'); // preserved from base
    expect(result.ai.gemini).toBe(false);
    expect(result.ai.codex).toBe(true); // preserved from base
  });

  it('should not mutate original objects', () => {
    const base = { value: 1, nested: { a: 1 } };
    const override = { nested: { a: 2 } };

    const result = mergeConfigs(base, override);

    expect(base.nested.a).toBe(1); // unchanged
    expect(result.nested.a).toBe(2);
  });

  it('should handle empty override', () => {
    const base = { value: 1 };
    const result = mergeConfigs(base, {});

    expect(result.value).toBe(1);
  });

  it('should handle nested objects', () => {
    const base = {
      level1: {
        level2: {
          value: 'original',
          other: 'preserved',
        },
      },
    };

    const override = {
      level1: {
        level2: {
          value: 'overridden',
        },
      },
    };

    const result = mergeConfigs(base, override);

    expect(result.level1.level2.value).toBe('overridden');
    expect(result.level1.level2.other).toBe('preserved');
  });
});

describe('mergeMultipleConfigs', () => {
  it('should merge multiple configs in order', () => {
    const config1 = { a: 1, b: 1, c: 1 };
    const config2 = { b: 2, c: 2 };
    const config3 = { c: 3 };

    const result = mergeMultipleConfigs(config1, config2, config3);

    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
    expect(result.c).toBe(3);
  });

  it('should handle undefined configs', () => {
    const config1 = { a: 1 };
    const result = mergeMultipleConfigs(config1, undefined, { b: 2 });

    expect(result.a).toBe(1);
    expect(result.b).toBe(2);
  });

  it('should return empty object for no configs', () => {
    const result = mergeMultipleConfigs();
    expect(result).toEqual({});
  });
});

describe('applyEnvironmentVariables', () => {
  const originalEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Store and clear relevant env vars
    for (const envVar of Object.values(ENV_VAR_MAP)) {
      originalEnv[envVar] = process.env[envVar];
      delete process.env[envVar];
    }
  });

  afterEach(() => {
    // Restore env vars
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('should apply string environment variables', () => {
    process.env.AX_PROJECT_ROOT = './from-env';

    const result = applyEnvironmentVariables(DEFAULT_CONFIG, ENV_VAR_MAP);

    expect(result.paths.project_root).toBe('./from-env');
  });

  it('should parse boolean environment variables', () => {
    process.env.AX_AI_GEMINI = 'false';
    process.env.AX_GIT_AUTO_COMMIT = 'true';

    const result = applyEnvironmentVariables(DEFAULT_CONFIG, ENV_VAR_MAP);

    expect(result.ai.gemini).toBe(false);
    expect(result.git.auto_commit).toBe(true);
  });

  it('should parse numeric environment variables', () => {
    process.env.AX_CONTEXT_WARNING = '75';
    process.env.AX_TMUX_TIMEOUT = '600';

    const result = applyEnvironmentVariables(DEFAULT_CONFIG, ENV_VAR_MAP);

    expect(result.context.warning).toBe(75);
    expect(result.tmux.output_timeout).toBe(600);
  });

  it('should not mutate original config', () => {
    const config = { ...DEFAULT_CONFIG };
    process.env.AX_PROJECT_ROOT = './new-value';

    applyEnvironmentVariables(config, ENV_VAR_MAP);

    expect(config.paths.project_root).toBe('./');
  });

  it('should ignore unset environment variables', () => {
    const result = applyEnvironmentVariables(DEFAULT_CONFIG, ENV_VAR_MAP);

    expect(result.paths.project_root).toBe(DEFAULT_CONFIG.paths.project_root);
  });
});

describe('getActiveEnvironmentOverrides', () => {
  beforeEach(() => {
    delete process.env.AX_PROJECT_ROOT;
    delete process.env.AX_CONTEXT_WARNING;
  });

  afterEach(() => {
    delete process.env.AX_PROJECT_ROOT;
    delete process.env.AX_CONTEXT_WARNING;
  });

  it('should return empty map when no env vars set', () => {
    const overrides = getActiveEnvironmentOverrides(ENV_VAR_MAP);
    expect(overrides.size).toBe(0);
  });

  it('should return active overrides with parsed values', () => {
    process.env.AX_PROJECT_ROOT = './from-env';
    process.env.AX_CONTEXT_WARNING = '75';

    const overrides = getActiveEnvironmentOverrides(ENV_VAR_MAP);

    expect(overrides.get('paths.project_root')).toEqual({
      envVar: 'AX_PROJECT_ROOT',
      value: './from-env',
    });
    expect(overrides.get('context.warning')).toEqual({
      envVar: 'AX_CONTEXT_WARNING',
      value: 75,
    });
  });
});

describe('parseCLIOverrides', () => {
  it('should parse known CLI flags', () => {
    const flags = {
      'project-root': './cli-project',
      'timeout': 7200,
      'auto-commit': false,
    };

    const overrides = parseCLIOverrides(flags);

    expect(overrides).toContainEqual({
      path: 'paths.project_root',
      value: './cli-project',
    });
    expect(overrides).toContainEqual({
      path: 'timeouts.06-implementation',
      value: 7200,
    });
    expect(overrides).toContainEqual({
      path: 'git.auto_commit',
      value: false,
    });
  });

  it('should ignore unknown flags', () => {
    const flags = {
      'unknown-flag': 'value',
      'another-unknown': 123,
    };

    const overrides = parseCLIOverrides(flags);

    expect(overrides).toHaveLength(0);
  });

  it('should parse string values to appropriate types', () => {
    const flags = {
      'context-warning': '75',
      'auto-commit': 'true',
    };

    const overrides = parseCLIOverrides(flags);

    expect(overrides).toContainEqual({
      path: 'context.warning',
      value: 75,
    });
    expect(overrides).toContainEqual({
      path: 'git.auto_commit',
      value: true,
    });
  });
});

describe('applyCLIOverrides', () => {
  it('should apply CLI overrides to config', () => {
    const overrides = [
      { path: 'paths.project_root', value: './cli-root' },
      { path: 'context.warning', value: 80 },
    ];

    const result = applyCLIOverrides(DEFAULT_CONFIG, overrides);

    expect(result.paths.project_root).toBe('./cli-root');
    expect(result.context.warning).toBe(80);
  });

  it('should not mutate original config', () => {
    const original = { ...DEFAULT_CONFIG };
    const overrides = [{ path: 'paths.project_root', value: './new' }];

    applyCLIOverrides(original, overrides);

    expect(original.paths.project_root).toBe('./');
  });
});

describe('diffConfigs', () => {
  it('should detect top-level changes', () => {
    const oldConfig = { ...DEFAULT_CONFIG };
    const newConfig = {
      ...DEFAULT_CONFIG,
      ax_templates: { version: '3.0.0' },
    };

    const diffs = diffConfigs(oldConfig, newConfig);

    expect(diffs).toContainEqual({
      path: 'ax_templates.version',
      oldValue: '2.0.0',
      newValue: '3.0.0',
    });
  });

  it('should detect nested changes', () => {
    const oldConfig = { ...DEFAULT_CONFIG };
    const newConfig = {
      ...DEFAULT_CONFIG,
      context: { ...DEFAULT_CONFIG.context, warning: 70 },
    };

    const diffs = diffConfigs(oldConfig, newConfig);

    expect(diffs).toContainEqual({
      path: 'context.warning',
      oldValue: 60,
      newValue: 70,
    });
  });

  it('should return empty array for identical configs', () => {
    const diffs = diffConfigs(DEFAULT_CONFIG, DEFAULT_CONFIG);

    expect(diffs).toHaveLength(0);
  });

  it('should detect multiple changes', () => {
    const oldConfig = { ...DEFAULT_CONFIG };
    const newConfig: AxConfig = {
      ...DEFAULT_CONFIG,
      paths: { ...DEFAULT_CONFIG.paths, project_root: './new' },
      ai: { ...DEFAULT_CONFIG.ai, gemini: false },
      context: { ...DEFAULT_CONFIG.context, warning: 70 },
    };

    const diffs = diffConfigs(oldConfig, newConfig);

    expect(diffs.length).toBeGreaterThanOrEqual(3);
  });
});

describe('resolveTemplateVariables', () => {
  it('should replace template variables', () => {
    const template = 'Project root: {{PROJECT_ROOT}}, Stage output: {{STAGES_OUTPUT}}';
    const variables = {
      PROJECT_ROOT: './app',
      STAGES_OUTPUT: './stages',
    };

    const result = resolveTemplateVariables(template, variables);

    expect(result).toBe('Project root: ./app, Stage output: ./stages');
  });

  it('should keep unresolved variables as-is', () => {
    const template = '{{KNOWN}} and {{UNKNOWN}}';
    const variables = { KNOWN: 'resolved' };

    const result = resolveTemplateVariables(template, variables);

    expect(result).toBe('resolved and {{UNKNOWN}}');
  });

  it('should handle numeric and boolean values', () => {
    const template = 'Warning: {{WARNING}}%, Auto commit: {{AUTO_COMMIT}}';
    const variables = { WARNING: 60, AUTO_COMMIT: true };

    const result = resolveTemplateVariables(template, variables);

    expect(result).toBe('Warning: 60%, Auto commit: true');
  });

  it('should handle empty template', () => {
    const result = resolveTemplateVariables('', { VAR: 'value' });
    expect(result).toBe('');
  });
});

describe('configToTemplateVariables', () => {
  it('should convert config to template variables', () => {
    const variables = configToTemplateVariables(DEFAULT_CONFIG);

    expect(variables.PROJECT_ROOT).toBe('./');
    expect(variables.STAGES_OUTPUT).toBe('./stages');
    expect(variables.STATE_DIR).toBe('./state');
    expect(variables.CHECKPOINTS_DIR).toBe('./state/checkpoints');
    expect(variables.GEMINI_SESSION).toBe('ax-gemini');
    expect(variables.CODEX_SESSION).toBe('ax-codex');
    expect(variables.CONTEXT_WARNING).toBe(60);
    expect(variables.CONTEXT_ACTION).toBe(50);
    expect(variables.CONTEXT_CRITICAL).toBe(40);
    expect(variables.COMMIT_LANGUAGE).toBe('Korean');
    expect(variables.AUTO_COMMIT).toBe(true);
    expect(variables.AI_GEMINI).toBe(true);
    expect(variables.AI_CODEX).toBe(true);
    expect(variables.AX_VERSION).toBe('2.0.0');
  });

  it('should use config values in templates', () => {
    const config: AxConfig = {
      ...DEFAULT_CONFIG,
      paths: { ...DEFAULT_CONFIG.paths, project_root: './my-app' },
    };

    const variables = configToTemplateVariables(config);
    const template = 'cd {{PROJECT_ROOT}}';
    const result = resolveTemplateVariables(template, variables);

    expect(result).toBe('cd ./my-app');
  });
});
