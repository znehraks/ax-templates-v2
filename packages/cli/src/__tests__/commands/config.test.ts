/**
 * ax-templates CLI - Config Command Tests
 * E2E tests for configuration management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify as yamlStringify, parse as yamlParse } from 'yaml';
import {
  createTempProject,
  cleanupTempProject,
  createInitializedProject,
  runCli,
  readTextFile,
} from '../helpers.js';
import { CLI_AVAILABLE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('config command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
    createInitializedProject(tempDir);
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('config display', () => {
    it('should display current configuration', async () => {
      const result = await runCli(['config'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/(config|설정)/i);
    });

    it('should show config file path', async () => {
      const result = await runCli(['config'], { cwd: tempDir });

      expect(result.stdout).toContain('.ax-config.yaml');
    });
  });

  describe('config get', () => {
    it('should get specific config value', async () => {
      const result = await runCli(['config', 'get', 'paths.stages_output'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('./stages');
    });

    it('should get context thresholds', async () => {
      const result = await runCli(['config', 'get', 'context.warning'], { cwd: tempDir });

      expect(result.stdout).toContain('60');
    });

    it('should handle non-existent key', async () => {
      const result = await runCli(['config', 'get', 'nonexistent.key'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(not found|없|undefined)/i);
    });
  });

  describe('config set', () => {
    it('should set config value', async () => {
      const result = await runCli(['config', 'set', 'context.warning', '65'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      // Verify the change was persisted
      const configContent = readTextFile(tempDir, '.ax-config.yaml');
      const config = yamlParse(configContent);
      expect(config.context.warning).toBe(65);
    });

    it('should set nested config value', async () => {
      await runCli(['config', 'set', 'ai.gemini', 'false'], { cwd: tempDir });

      const configContent = readTextFile(tempDir, '.ax-config.yaml');
      const config = yamlParse(configContent);
      expect(config.ai.gemini).toBe(false);
    });
  });

  describe('config validation', () => {
    it('should validate config file', async () => {
      const result = await runCli(['config', 'validate'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/(valid|유효)/i);
    });

    it('should report invalid config', async () => {
      // Write invalid config
      const configPath = join(tempDir, '.ax-config.yaml');
      const content = readFileSync(configPath, 'utf-8');
      writeFileSync(configPath, content.replace('version: \'2.0.0\'', 'version: 123'));

      const result = await runCli(['config', 'validate'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(invalid|error|오류)/i);
    });
  });

  describe('config list', () => {
    it('should list all config keys', async () => {
      const result = await runCli(['config', 'list'], { cwd: tempDir });

      expect(result.stdout).toContain('ax_templates');
      expect(result.stdout).toContain('paths');
      expect(result.stdout).toContain('context');
    });
  });

  describe('config reset', () => {
    it('should reset to defaults', async () => {
      // Modify config
      await runCli(['config', 'set', 'context.warning', '99'], { cwd: tempDir });

      // Reset
      const result = await runCli(['config', 'reset'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      // Verify reset
      const configContent = readTextFile(tempDir, '.ax-config.yaml');
      const config = yamlParse(configContent);
      expect(config.context.warning).toBe(60); // Default value
    });
  });

  describe('config sources', () => {
    it('should show config source chain', async () => {
      const result = await runCli(['config', 'sources'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(source|default|env|소스)/i);
    });
  });
});
