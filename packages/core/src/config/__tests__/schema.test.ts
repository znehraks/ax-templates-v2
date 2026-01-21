/**
 * @ax-templates/core - Schema Tests
 * Tests for Zod schema validation
 */

import { describe, it, expect } from 'vitest';
import {
  AxConfigSchema,
  PathsSchema,
  AIConfigSchema,
  TmuxConfigSchema,
  ContextConfigSchema,
  MCPConfigSchema,
  GitConfigSchema,
  StageDefinitionSchema,
  PipelineConfigSchema,
  parseConfig,
  validatePartialConfig,
  isValidConfig,
} from '../schema.js';

describe('PathsSchema', () => {
  it('should parse valid paths config', () => {
    const result = PathsSchema.parse({
      project_root: './my-project',
      stages_output: './output',
      state: './state',
      checkpoints: './checkpoints',
    });

    expect(result.project_root).toBe('./my-project');
    expect(result.stages_output).toBe('./output');
  });

  it('should apply default values when fields are missing', () => {
    const result = PathsSchema.parse({});

    expect(result.project_root).toBe('./');
    expect(result.stages_output).toBe('./stages');
    expect(result.state).toBe('./state');
    expect(result.checkpoints).toBe('./state/checkpoints');
  });

  it('should reject non-string values', () => {
    expect(() => PathsSchema.parse({ project_root: 123 })).toThrow();
    expect(() => PathsSchema.parse({ stages_output: true })).toThrow();
  });
});

describe('AIConfigSchema', () => {
  it('should parse valid AI config', () => {
    const result = AIConfigSchema.parse({
      gemini: true,
      codex: false,
    });

    expect(result.gemini).toBe(true);
    expect(result.codex).toBe(false);
  });

  it('should apply defaults for missing fields', () => {
    const result = AIConfigSchema.parse({});

    expect(result.gemini).toBe(true);
    expect(result.codex).toBe(true);
  });

  it('should reject non-boolean values', () => {
    expect(() => AIConfigSchema.parse({ gemini: 'yes' })).toThrow();
    expect(() => AIConfigSchema.parse({ codex: 1 })).toThrow();
  });
});

describe('TmuxConfigSchema', () => {
  it('should parse valid tmux config', () => {
    const result = TmuxConfigSchema.parse({
      gemini_session: 'my-gemini',
      codex_session: 'my-codex',
      output_timeout: 600,
    });

    expect(result.gemini_session).toBe('my-gemini');
    expect(result.codex_session).toBe('my-codex');
    expect(result.output_timeout).toBe(600);
  });

  it('should apply defaults', () => {
    const result = TmuxConfigSchema.parse({});

    expect(result.gemini_session).toBe('ax-gemini');
    expect(result.codex_session).toBe('ax-codex');
    expect(result.output_timeout).toBe(300);
  });
});

describe('ContextConfigSchema', () => {
  it('should parse valid context config', () => {
    const result = ContextConfigSchema.parse({
      warning: 70,
      action: 60,
      critical: 50,
      task_save_frequency: 10,
    });

    expect(result.warning).toBe(70);
    expect(result.action).toBe(60);
    expect(result.critical).toBe(50);
    expect(result.task_save_frequency).toBe(10);
  });

  it('should reject values outside 0-100 range for thresholds', () => {
    expect(() => ContextConfigSchema.parse({ warning: -1 })).toThrow();
    expect(() => ContextConfigSchema.parse({ warning: 101 })).toThrow();
    expect(() => ContextConfigSchema.parse({ action: 150 })).toThrow();
  });

  it('should reject task_save_frequency less than 1', () => {
    expect(() => ContextConfigSchema.parse({ task_save_frequency: 0 })).toThrow();
    expect(() => ContextConfigSchema.parse({ task_save_frequency: -1 })).toThrow();
  });

  it('should apply defaults', () => {
    const result = ContextConfigSchema.parse({});

    expect(result.warning).toBe(60);
    expect(result.action).toBe(50);
    expect(result.critical).toBe(40);
    expect(result.task_save_frequency).toBe(5);
  });
});

describe('MCPConfigSchema', () => {
  it('should parse valid MCP config', () => {
    const result = MCPConfigSchema.parse({
      search: ['exa', 'firecrawl'],
      browser: ['puppeteer'],
    });

    expect(result.search).toEqual(['exa', 'firecrawl']);
    expect(result.browser).toEqual(['puppeteer']);
  });

  it('should apply defaults', () => {
    const result = MCPConfigSchema.parse({});

    expect(result.search).toEqual(['context7', 'exa']);
    expect(result.browser).toEqual(['playwright']);
  });
});

describe('GitConfigSchema', () => {
  it('should parse valid git config', () => {
    const result = GitConfigSchema.parse({
      commit_language: 'English',
      auto_commit: false,
    });

    expect(result.commit_language).toBe('English');
    expect(result.auto_commit).toBe(false);
  });

  it('should only accept valid commit_language values', () => {
    expect(() => GitConfigSchema.parse({ commit_language: 'Korean' })).not.toThrow();
    expect(() => GitConfigSchema.parse({ commit_language: 'English' })).not.toThrow();
    expect(() => GitConfigSchema.parse({ commit_language: 'Japanese' })).not.toThrow();
    expect(() => GitConfigSchema.parse({ commit_language: 'Chinese' })).not.toThrow();
    expect(() => GitConfigSchema.parse({ commit_language: 'Spanish' })).toThrow();
  });

  it('should apply defaults', () => {
    const result = GitConfigSchema.parse({});

    expect(result.commit_language).toBe('Korean');
    expect(result.auto_commit).toBe(true);
  });
});

describe('StageDefinitionSchema', () => {
  it('should parse valid stage definition', () => {
    const result = StageDefinitionSchema.parse({
      id: '01-brainstorm',
      name: 'Brainstorming',
      models: ['gemini', 'claudecode'],
      mode: 'yolo',
      inputs: ['project_brief.md'],
      outputs: ['ideas.md', 'HANDOFF.md'],
    });

    expect(result.id).toBe('01-brainstorm');
    expect(result.name).toBe('Brainstorming');
    expect(result.models).toEqual(['gemini', 'claudecode']);
    expect(result.timeout).toBe(3600); // default
  });

  it('should require id, name, models, mode, inputs, outputs', () => {
    expect(() => StageDefinitionSchema.parse({})).toThrow();
    expect(() => StageDefinitionSchema.parse({ id: '01-test' })).toThrow();
  });

  it('should parse optional fields', () => {
    const result = StageDefinitionSchema.parse({
      id: '06-impl',
      name: 'Implementation',
      models: ['claudecode'],
      mode: 'sandbox',
      inputs: ['tasks.md'],
      outputs: ['code/'],
      container: true,
      sandbox: true,
      checkpoint_required: true,
      timeout: 14400,
      mcp_servers: ['playwright'],
    });

    expect(result.container).toBe(true);
    expect(result.sandbox).toBe(true);
    expect(result.checkpoint_required).toBe(true);
    expect(result.timeout).toBe(14400);
    expect(result.mcp_servers).toEqual(['playwright']);
  });
});

describe('PipelineConfigSchema', () => {
  it('should parse valid pipeline config', () => {
    const result = PipelineConfigSchema.parse({
      name: 'My Pipeline',
      version: '1.0.0',
      stages: [
        {
          id: '01-brainstorm',
          name: 'Brainstorming',
          models: ['gemini'],
          mode: 'yolo',
          inputs: ['brief.md'],
          outputs: ['ideas.md'],
        },
      ],
    });

    expect(result.name).toBe('My Pipeline');
    expect(result.version).toBe('1.0.0');
    expect(result.stages).toHaveLength(1);
  });

  it('should require name, version, and stages', () => {
    expect(() => PipelineConfigSchema.parse({})).toThrow();
    expect(() => PipelineConfigSchema.parse({ name: 'Test' })).toThrow();
  });
});

describe('AxConfigSchema', () => {
  it('should parse complete valid config', () => {
    const result = AxConfigSchema.parse({
      ax_templates: { version: '2.0.0' },
      paths: { project_root: './app' },
      ai: { gemini: true },
      tmux: { gemini_session: 'my-session' },
      context: { warning: 70 },
      mcp: { search: ['exa'] },
      git: { commit_language: 'English' },
    });

    expect(result.ax_templates.version).toBe('2.0.0');
    expect(result.paths.project_root).toBe('./app');
  });

  it('should apply all defaults for empty object', () => {
    const result = AxConfigSchema.parse({});

    expect(result.ax_templates.version).toBe('2.0.0');
    expect(result.paths.project_root).toBe('./');
    expect(result.ai.gemini).toBe(true);
    expect(result.tmux.gemini_session).toBe('ax-gemini');
    expect(result.context.warning).toBe(60);
    expect(result.mcp.search).toEqual(['context7', 'exa']);
    expect(result.git.commit_language).toBe('Korean');
  });

  it('should handle nested object defaults correctly', () => {
    const result = AxConfigSchema.parse({
      paths: { project_root: './custom' },
      // other fields should get defaults
    });

    expect(result.paths.project_root).toBe('./custom');
    expect(result.paths.stages_output).toBe('./stages'); // default
    expect(result.ai.gemini).toBe(true); // default
  });

  it('should handle optional timeouts', () => {
    const result = AxConfigSchema.parse({
      timeouts: {
        '01-brainstorm': 7200,
        '06-implementation': 28800,
      },
    });

    expect(result.timeouts?.['01-brainstorm']).toBe(7200);
    expect(result.timeouts?.['06-implementation']).toBe(28800);
  });
});

describe('parseConfig', () => {
  it('should parse and return validated config', () => {
    const config = parseConfig({
      ax_templates: { version: '2.0.0' },
    });

    expect(config.ax_templates.version).toBe('2.0.0');
    expect(config.paths.project_root).toBe('./'); // default applied
  });

  it('should throw on invalid config', () => {
    expect(() => parseConfig({ context: { warning: 200 } })).toThrow();
  });
});

describe('validatePartialConfig', () => {
  it('should validate partial configs', () => {
    const partial = validatePartialConfig({
      paths: { project_root: './app' },
    });

    expect(partial.paths?.project_root).toBe('./app');
  });

  it('should not require all fields', () => {
    expect(() => validatePartialConfig({})).not.toThrow();
    expect(() => validatePartialConfig({ git: {} })).not.toThrow();
  });
});

describe('isValidConfig', () => {
  it('should return true for valid configs', () => {
    expect(isValidConfig({})).toBe(true);
    expect(isValidConfig({ ax_templates: { version: '2.0.0' } })).toBe(true);
    expect(isValidConfig({
      paths: { project_root: './app' },
      ai: { gemini: true },
    })).toBe(true);
  });

  it('should return false for invalid configs', () => {
    expect(isValidConfig({ context: { warning: 200 } })).toBe(false);
    expect(isValidConfig({ git: { commit_language: 'Invalid' } })).toBe(false);
    expect(isValidConfig({ paths: { project_root: 123 } })).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(isValidConfig(null)).toBe(false);
    expect(isValidConfig('string')).toBe(false);
    expect(isValidConfig(123)).toBe(false);
  });
});
