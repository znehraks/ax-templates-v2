/**
 * ax-templates Plugin - Config Validation Tests
 * Validates configuration schema and defaults
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = join(__dirname, '..');

interface ConfigSchema {
  $schema: string;
  $id: string;
  title: string;
  description: string;
  type: string;
  properties: Record<string, unknown>;
  required: string[];
}

interface DefaultsConfig {
  ax_templates: {
    version: string;
  };
  paths: {
    project_root: string;
    stages_output: string;
    state: string;
    checkpoints: string;
  };
  ai: {
    gemini: boolean;
    codex: boolean;
  };
  tmux: {
    gemini_session: string;
    codex_session: string;
    output_timeout: number;
  };
  context: {
    warning: number;
    action: number;
    critical: number;
    task_save_frequency: number;
  };
  timeouts: Record<string, number>;
  mcp: {
    search: string[];
    browser: string[];
  };
  git: {
    commit_language: string;
    auto_commit: boolean;
  };
}

interface SettingsJson {
  permissions: {
    allow: string[];
    deny: string[];
  };
  env: Record<string, string>;
}

describe('config files', () => {
  describe('.ax-config.schema.json validity', () => {
    let schema: ConfigSchema;

    beforeAll(() => {
      const schemaPath = join(pluginRoot, '.ax-config.schema.json');
      schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));
    });

    it('should have valid JSON Schema structure', () => {
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
      expect(schema.type).toBe('object');
    });

    it('should have title and description', () => {
      expect(schema.title).toBeDefined();
      expect(schema.description).toBeDefined();
    });

    it('should define ax_templates as required', () => {
      expect(schema.required).toContain('ax_templates');
    });

    it('should define paths property', () => {
      expect(schema.properties.paths).toBeDefined();
    });

    it('should define ai property', () => {
      expect(schema.properties.ai).toBeDefined();
    });

    it('should define tmux property', () => {
      expect(schema.properties.tmux).toBeDefined();
    });

    it('should define context property', () => {
      expect(schema.properties.context).toBeDefined();
    });

    it('should define timeouts property', () => {
      expect(schema.properties.timeouts).toBeDefined();
    });

    it('should define mcp property', () => {
      expect(schema.properties.mcp).toBeDefined();
    });

    it('should define git property', () => {
      expect(schema.properties.git).toBeDefined();
    });

    it('should not allow additional properties', () => {
      expect((schema as Record<string, unknown>).additionalProperties).toBe(false);
    });
  });

  describe('config/defaults.yaml validity', () => {
    let defaults: DefaultsConfig;

    beforeAll(() => {
      const defaultsPath = join(pluginRoot, 'config', 'defaults.yaml');
      const content = readFileSync(defaultsPath, 'utf-8');
      defaults = parseYaml(content);
    });

    it('should be valid YAML', () => {
      expect(defaults).toBeDefined();
      expect(typeof defaults).toBe('object');
    });

    it('should have ax_templates section with version', () => {
      expect(defaults.ax_templates).toBeDefined();
      expect(defaults.ax_templates.version).toBeDefined();
      expect(defaults.ax_templates.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have paths section with required paths', () => {
      expect(defaults.paths).toBeDefined();
      expect(defaults.paths.project_root).toBeDefined();
      expect(defaults.paths.stages_output).toBeDefined();
      expect(defaults.paths.state).toBeDefined();
      expect(defaults.paths.checkpoints).toBeDefined();
    });

    it('should have ai section with boolean flags', () => {
      expect(defaults.ai).toBeDefined();
      expect(typeof defaults.ai.gemini).toBe('boolean');
      expect(typeof defaults.ai.codex).toBe('boolean');
    });

    it('should have tmux section with session names', () => {
      expect(defaults.tmux).toBeDefined();
      expect(defaults.tmux.gemini_session).toBeDefined();
      expect(defaults.tmux.codex_session).toBeDefined();
      expect(typeof defaults.tmux.output_timeout).toBe('number');
    });

    it('should have context thresholds in descending order', () => {
      expect(defaults.context).toBeDefined();
      expect(defaults.context.warning).toBeGreaterThan(defaults.context.action);
      expect(defaults.context.action).toBeGreaterThan(defaults.context.critical);
    });

    it('should have context thresholds within valid range', () => {
      expect(defaults.context.warning).toBeGreaterThanOrEqual(0);
      expect(defaults.context.warning).toBeLessThanOrEqual(100);
      expect(defaults.context.action).toBeGreaterThanOrEqual(0);
      expect(defaults.context.action).toBeLessThanOrEqual(100);
      expect(defaults.context.critical).toBeGreaterThanOrEqual(0);
      expect(defaults.context.critical).toBeLessThanOrEqual(100);
    });

    it('should have task_save_frequency as positive number', () => {
      expect(defaults.context.task_save_frequency).toBeGreaterThan(0);
    });

    it('should have timeouts for all 10 stages', () => {
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

      for (const stage of expectedStages) {
        expect(defaults.timeouts[stage]).toBeDefined();
        expect(typeof defaults.timeouts[stage]).toBe('number');
        expect(defaults.timeouts[stage]).toBeGreaterThan(0);
      }
    });

    it('should have mcp configuration', () => {
      expect(defaults.mcp).toBeDefined();
      expect(Array.isArray(defaults.mcp.search)).toBe(true);
      expect(Array.isArray(defaults.mcp.browser)).toBe(true);
    });

    it('should have git configuration', () => {
      expect(defaults.git).toBeDefined();
      expect(defaults.git.commit_language).toBeDefined();
      expect(typeof defaults.git.auto_commit).toBe('boolean');
    });
  });

  describe('.claude/settings.json validity', () => {
    let settings: SettingsJson;

    beforeAll(() => {
      const settingsPath = join(pluginRoot, '.claude', 'settings.json');
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    });

    it('should be valid JSON', () => {
      expect(settings).toBeDefined();
      expect(typeof settings).toBe('object');
    });

    it('should have permissions section', () => {
      expect(settings.permissions).toBeDefined();
      expect(settings.permissions.allow).toBeDefined();
      expect(settings.permissions.deny).toBeDefined();
    });

    it('should have allow array with permissions', () => {
      expect(Array.isArray(settings.permissions.allow)).toBe(true);
      expect(settings.permissions.allow.length).toBeGreaterThan(0);
    });

    it('should allow essential bash commands', () => {
      const allowPatterns = settings.permissions.allow;

      // Check for common patterns
      expect(allowPatterns.some(p => p.includes('git'))).toBe(true);
      expect(allowPatterns.some(p => p.includes('npm') || p.includes('pnpm'))).toBe(true);
    });

    it('should allow file operations', () => {
      const allowPatterns = settings.permissions.allow;

      expect(allowPatterns.some(p => p.startsWith('Read'))).toBe(true);
      expect(allowPatterns.some(p => p.startsWith('Write'))).toBe(true);
      expect(allowPatterns.some(p => p.startsWith('Edit'))).toBe(true);
    });

    it('should have env section with version', () => {
      expect(settings.env).toBeDefined();
      expect(settings.env.AX_TEMPLATES_VERSION).toBeDefined();
      expect(settings.env.AX_TEMPLATES_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('version consistency across config files', () => {
    it('should have matching versions in all files', () => {
      const pluginJsonPath = join(pluginRoot, 'plugin.json');
      const packageJsonPath = join(pluginRoot, 'package.json');
      const defaultsPath = join(pluginRoot, 'config', 'defaults.yaml');
      const settingsPath = join(pluginRoot, '.claude', 'settings.json');

      const pluginJson = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      const defaults = parseYaml(readFileSync(defaultsPath, 'utf-8'));
      const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));

      const versions = [
        pluginJson.version,
        packageJson.version,
        defaults.ax_templates.version,
        settings.env.AX_TEMPLATES_VERSION,
      ];

      // All versions should be the same
      expect(new Set(versions).size).toBe(1);
    });
  });
});
