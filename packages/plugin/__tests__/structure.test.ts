/**
 * ax-templates Plugin - Structure Validation Tests
 * Validates the plugin.json and overall plugin structure
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginRoot = join(__dirname, '..');

interface PluginJson {
  name: string;
  version: string;
  displayName: string;
  description: string;
  author: string;
  configuration: {
    schema: string;
    defaults: string;
  };
  entrypoint: {
    instructions: string;
    settings: string;
  };
  commands: {
    directory: string;
    commands: string[];
  };
  hooks: {
    sessionStart: string;
    stop: string;
  };
  statusline: {
    enabled: boolean;
    script: string;
  };
  mcp: {
    recommended: string[];
  };
}

interface PackageJson {
  name: string;
  version: string;
  description: string;
}

describe('plugin structure', () => {
  let pluginJson: PluginJson;
  let packageJson: PackageJson;

  beforeAll(() => {
    const pluginJsonPath = join(pluginRoot, 'plugin.json');
    const packageJsonPath = join(pluginRoot, 'package.json');

    pluginJson = JSON.parse(readFileSync(pluginJsonPath, 'utf-8'));
    packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  });

  describe('plugin.json validity', () => {
    it('should have required top-level fields', () => {
      expect(pluginJson.name).toBeDefined();
      expect(pluginJson.version).toBeDefined();
      expect(pluginJson.displayName).toBeDefined();
      expect(pluginJson.description).toBeDefined();
    });

    it('should have valid name format', () => {
      expect(pluginJson.name).toBe('ax-templates');
      expect(typeof pluginJson.name).toBe('string');
      expect(pluginJson.name.length).toBeGreaterThan(0);
    });

    it('should have valid version format (semver)', () => {
      expect(pluginJson.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have configuration section', () => {
      expect(pluginJson.configuration).toBeDefined();
      expect(pluginJson.configuration.schema).toBeDefined();
      expect(pluginJson.configuration.defaults).toBeDefined();
    });

    it('should have entrypoint section', () => {
      expect(pluginJson.entrypoint).toBeDefined();
      expect(pluginJson.entrypoint.instructions).toBeDefined();
      expect(pluginJson.entrypoint.settings).toBeDefined();
    });

    it('should have commands section', () => {
      expect(pluginJson.commands).toBeDefined();
      expect(pluginJson.commands.directory).toBeDefined();
      expect(pluginJson.commands.commands).toBeDefined();
      expect(Array.isArray(pluginJson.commands.commands)).toBe(true);
    });

    it('should have hooks section', () => {
      expect(pluginJson.hooks).toBeDefined();
      expect(pluginJson.hooks.sessionStart).toBeDefined();
      expect(pluginJson.hooks.stop).toBeDefined();
    });

    it('should have statusline section', () => {
      expect(pluginJson.statusline).toBeDefined();
      expect(typeof pluginJson.statusline.enabled).toBe('boolean');
      expect(pluginJson.statusline.script).toBeDefined();
    });

    it('should have mcp section', () => {
      expect(pluginJson.mcp).toBeDefined();
      expect(pluginJson.mcp.recommended).toBeDefined();
      expect(Array.isArray(pluginJson.mcp.recommended)).toBe(true);
    });
  });

  describe('version consistency', () => {
    it('should have matching versions in plugin.json and package.json', () => {
      expect(pluginJson.version).toBe(packageJson.version);
    });
  });

  describe('commands list completeness', () => {
    const expectedCommands = [
      'init-project',
      'run-stage',
      'status',
      'stages',
      'next',
      'handoff',
      'checkpoint',
      'restore',
      'gemini',
      'codex',
      'context',
      // Stage shortcuts
      'brainstorm',
      'research',
      'planning',
      'ui-ux',
      'tasks',
      'implement',
      'refactor',
      'qa',
      'test',
      'deploy',
    ];

    it('should include all expected commands', () => {
      for (const cmd of expectedCommands) {
        expect(pluginJson.commands.commands).toContain(cmd);
      }
    });

    it('should have command files for all declared commands', () => {
      const commandsDir = join(pluginRoot, pluginJson.commands.directory);

      for (const cmd of pluginJson.commands.commands) {
        const cmdFile = join(commandsDir, `${cmd}.md`);
        expect(existsSync(cmdFile)).toBe(true);
      }
    });

    it('should not have undeclared command files', () => {
      const commandsDir = join(pluginRoot, pluginJson.commands.directory);
      const files = readdirSync(commandsDir).filter(f => f.endsWith('.md'));
      const declaredCommands = pluginJson.commands.commands.map(c => `${c}.md`);

      for (const file of files) {
        expect(declaredCommands).toContain(file);
      }
    });
  });

  describe('referenced files exist', () => {
    it('should have CLAUDE.md instruction file', () => {
      const instructionFile = join(pluginRoot, pluginJson.entrypoint.instructions);
      expect(existsSync(instructionFile)).toBe(true);
    });

    it('should have settings.json file', () => {
      const settingsFile = join(pluginRoot, pluginJson.entrypoint.settings);
      expect(existsSync(settingsFile)).toBe(true);
    });

    it('should have config schema file', () => {
      const schemaFile = join(pluginRoot, pluginJson.configuration.schema);
      expect(existsSync(schemaFile)).toBe(true);
    });

    it('should have config defaults file', () => {
      const defaultsFile = join(pluginRoot, pluginJson.configuration.defaults);
      expect(existsSync(defaultsFile)).toBe(true);
    });

    it('should have session start hook script', () => {
      const hookFile = join(pluginRoot, pluginJson.hooks.sessionStart);
      expect(existsSync(hookFile)).toBe(true);
    });

    it('should have stop hook script', () => {
      const hookFile = join(pluginRoot, pluginJson.hooks.stop);
      expect(existsSync(hookFile)).toBe(true);
    });

    it('should have statusline script', () => {
      const statuslineFile = join(pluginRoot, pluginJson.statusline.script);
      expect(existsSync(statuslineFile)).toBe(true);
    });
  });

  describe('directory structure', () => {
    const expectedDirs = ['.claude', '.claude/commands', '.claude/hooks', 'config', 'scripts'];

    it('should have expected directories', () => {
      for (const dir of expectedDirs) {
        const dirPath = join(pluginRoot, dir);
        expect(existsSync(dirPath)).toBe(true);
      }
    });
  });
});
