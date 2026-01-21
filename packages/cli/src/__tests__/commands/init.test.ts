/**
 * ax-templates CLI - Init Command Tests
 * E2E tests for project initialization
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as yamlParse } from 'yaml';
import {
  createTempProject,
  cleanupTempProject,
  runCli,
  fileExists,
  readJsonFile,
  readTextFile,
} from '../helpers.js';
import { CLI_AVAILABLE, CLI_SKIP_MESSAGE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('init command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('basic initialization', () => {
    it('should create project structure with -y flag', async () => {
      const result = await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      // Should succeed
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('성공적으로 초기화');

      // Should create .ax-config.yaml
      expect(fileExists(tempDir, '.ax-config.yaml')).toBe(true);

      // Should create state directory
      expect(fileExists(tempDir, 'state')).toBe(true);
      expect(fileExists(tempDir, 'state', 'progress.json')).toBe(true);

      // Should create stages directory
      expect(fileExists(tempDir, 'stages')).toBe(true);
      expect(fileExists(tempDir, 'stages', '01-brainstorm')).toBe(true);
      expect(fileExists(tempDir, 'stages', '10-deployment')).toBe(true);

      // Should create CLAUDE.md
      expect(fileExists(tempDir, 'CLAUDE.md')).toBe(true);
    });

    it('should create all 10 stage directories', async () => {
      await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

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
        expect(fileExists(tempDir, 'stages', stage)).toBe(true);
        expect(fileExists(tempDir, 'stages', stage, 'outputs')).toBe(true);
        expect(fileExists(tempDir, 'stages', stage, 'inputs')).toBe(true);
        expect(fileExists(tempDir, 'stages', stage, 'config.yaml')).toBe(true);
        expect(fileExists(tempDir, 'stages', stage, 'CLAUDE.md')).toBe(true);
      }
    });

    it('should create valid .ax-config.yaml', async () => {
      await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      const configContent = readTextFile(tempDir, '.ax-config.yaml');
      const config = yamlParse(configContent);

      expect(config.ax_templates?.version).toBe('2.0.0');
      expect(config.paths?.project_root).toBeDefined();
      expect(config.paths?.stages_output).toBeDefined();
      expect(config.paths?.state).toBeDefined();
      expect(config.context).toBeDefined();
    });

    it('should create valid progress.json', async () => {
      await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      const progress = readJsonFile(tempDir, 'state', 'progress.json') as any;

      expect(progress.currentStage).toBeNull();
      expect(progress.stages).toEqual({});
      expect(progress.version).toBe('2.0.0');
      expect(progress.lastUpdated).toBeDefined();
    });
  });

  describe('project directory argument', () => {
    it('should create project in specified directory', async () => {
      const projectName = 'my-test-project';
      const result = await runCli(['init', projectName, '-y'], { cwd: tempDir, timeout: 30000 });

      expect(result.exitCode).toBe(0);

      const projectDir = join(tempDir, projectName);
      expect(existsSync(projectDir)).toBe(true);
      expect(fileExists(projectDir, '.ax-config.yaml')).toBe(true);
      expect(fileExists(projectDir, 'stages')).toBe(true);
    });
  });

  describe('duplicate initialization prevention', () => {
    it('should warn when project already exists', async () => {
      // First initialization
      await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      // Second initialization attempt
      const result = await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      expect(result.stdout).toContain('이미 ax-templates 프로젝트가 있습니다');
    });
  });

  describe('stage template structure', () => {
    it('should create project_brief.md in brainstorm stage', async () => {
      await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      const briefPath = join(tempDir, 'stages', '01-brainstorm', 'inputs', 'project_brief.md');
      expect(existsSync(briefPath)).toBe(true);

      const content = readFileSync(briefPath, 'utf-8');
      expect(content).toContain('# Project Brief');
      expect(content).toContain('프로젝트 이름');
    });

    it('should create stage config.yaml files', async () => {
      await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      const configContent = readTextFile(tempDir, 'stages', '01-brainstorm', 'config.yaml');
      const config = yamlParse(configContent);

      expect(config.stage?.id).toBe('01-brainstorm');
      expect(config.stage?.name).toBe('Brainstorming');
      expect(config.execution?.models).toContain('gemini');
    });

    it('should create stage CLAUDE.md files', async () => {
      await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      const claudeContent = readTextFile(tempDir, 'stages', '06-implementation', 'CLAUDE.md');

      expect(claudeContent).toContain('Implementation');
      expect(claudeContent).toContain('claudecode');
    });
  });

  describe('scripts creation', () => {
    it('should create wrapper scripts', async () => {
      await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      expect(fileExists(tempDir, 'scripts', 'gemini-wrapper.sh')).toBe(true);
      expect(fileExists(tempDir, 'scripts', 'codex-wrapper.sh')).toBe(true);
    });
  });

  describe('config directory creation', () => {
    it('should create pipeline.yaml', async () => {
      await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      expect(fileExists(tempDir, 'config', 'pipeline.yaml')).toBe(true);

      const pipelineContent = readTextFile(tempDir, 'config', 'pipeline.yaml');
      const pipeline = yamlParse(pipelineContent);

      expect(pipeline.stages).toHaveLength(10);
    });

    it('should create models.yaml', async () => {
      await runCli(['init', '-y'], { cwd: tempDir, timeout: 30000 });

      expect(fileExists(tempDir, 'config', 'models.yaml')).toBe(true);

      const modelsContent = readTextFile(tempDir, 'config', 'models.yaml');
      const models = yamlParse(modelsContent);

      expect(models.models?.claudecode).toBeDefined();
      expect(models.models?.gemini).toBeDefined();
    });
  });
});
