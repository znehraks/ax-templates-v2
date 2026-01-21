/**
 * ax-templates CLI - Checkpoint Command Tests
 * E2E tests for checkpoint creation and management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  createTempProject,
  cleanupTempProject,
  createInitializedProject,
  setStageProgress,
  setupStageOutputs,
  runCli,
  fileExists,
  readJsonFile,
} from '../helpers.js';
import { CLI_AVAILABLE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('checkpoint command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
    createInitializedProject(tempDir);
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('checkpoint creation', () => {
    it('should create checkpoint for current stage', async () => {
      setStageProgress(tempDir, '06-implementation', 'in_progress');
      setupStageOutputs(tempDir, '06-implementation', {
        'src/index.ts': 'export default {}',
        'HANDOFF.md': '# Implementation Handoff',
      });

      const result = await runCli(['checkpoint'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('체크포인트');
    });

    it('should create checkpoint directory', async () => {
      setStageProgress(tempDir, '06-implementation', 'in_progress');
      setupStageOutputs(tempDir, '06-implementation', {
        'code.ts': 'const x = 1;',
      });

      await runCli(['checkpoint'], { cwd: tempDir });

      const checkpointsDir = join(tempDir, 'state', 'checkpoints');
      const dirs = readdirSync(checkpointsDir);
      expect(dirs.some(d => d.startsWith('cp-06-'))).toBe(true);
    });

    it('should copy stage outputs to checkpoint', async () => {
      setStageProgress(tempDir, '06-implementation', 'in_progress');
      setupStageOutputs(tempDir, '06-implementation', {
        'main.ts': 'console.log("hello")',
      });

      await runCli(['checkpoint'], { cwd: tempDir });

      const checkpointsDir = join(tempDir, 'state', 'checkpoints');
      const dirs = readdirSync(checkpointsDir);
      const cpDir = dirs.find(d => d.startsWith('cp-06-'));

      expect(fileExists(tempDir, 'state', 'checkpoints', cpDir!, 'outputs', 'main.ts')).toBe(true);
    });
  });

  describe('checkpoint with description', () => {
    it('should accept description option', async () => {
      setStageProgress(tempDir, '06-implementation', 'in_progress');
      setupStageOutputs(tempDir, '06-implementation', { 'file.ts': 'code' });

      const result = await runCli(['checkpoint', '-m', 'Before refactoring'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
    });
  });

  describe('checkpoint listing', () => {
    it('should list existing checkpoints', async () => {
      // Create a checkpoint first
      setStageProgress(tempDir, '06-implementation', 'in_progress');
      setupStageOutputs(tempDir, '06-implementation', { 'file.ts': 'code' });
      await runCli(['checkpoint'], { cwd: tempDir });

      const result = await runCli(['checkpoint', '--list'], { cwd: tempDir });

      expect(result.stdout).toContain('cp-06-');
    });

    it('should show empty message when no checkpoints', async () => {
      const result = await runCli(['checkpoint', '--list'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(없|empty|no.*checkpoint)/i);
    });
  });

  describe('error handling', () => {
    it('should error when no current stage', async () => {
      const result = await runCli(['checkpoint'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(스테이지|stage|현재)/i);
    });

    it('should create checkpoint for specified stage', async () => {
      setupStageOutputs(tempDir, '07-refactoring', {
        'refactored.ts': 'const refactored = true;',
      });

      const result = await runCli(['checkpoint', '07-refactoring'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
    });
  });

  describe('checkpoint metadata', () => {
    it('should save checkpoint metadata', async () => {
      setStageProgress(tempDir, '06-implementation', 'in_progress');
      setupStageOutputs(tempDir, '06-implementation', { 'file.ts': 'code' });

      await runCli(['checkpoint'], { cwd: tempDir });

      const checkpointsDir = join(tempDir, 'state', 'checkpoints');
      const dirs = readdirSync(checkpointsDir);
      const cpDir = dirs.find(d => d.startsWith('cp-06-'));

      const metadata = readJsonFile(tempDir, 'state', 'checkpoints', cpDir!, 'checkpoint.json') as any;
      expect(metadata.stageId).toBe('06-implementation');
      expect(metadata.files).toBeDefined();
    });
  });
});
