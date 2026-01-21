/**
 * ax-templates CLI - Restore Command Tests
 * E2E tests for checkpoint restoration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  createTempProject,
  cleanupTempProject,
  createInitializedProject,
  setStageProgress,
  setupStageOutputs,
  runCli,
  readTextFile,
} from '../helpers.js';
import { CLI_AVAILABLE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('restore command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
    createInitializedProject(tempDir);
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('checkpoint restoration', () => {
    it('should restore from specified checkpoint', async () => {
      // Setup: create checkpoint with original content
      setStageProgress(tempDir, '06-implementation', 'in_progress');
      setupStageOutputs(tempDir, '06-implementation', {
        'main.ts': 'const original = true;',
      });
      await runCli(['checkpoint'], { cwd: tempDir });

      // Get checkpoint ID
      const checkpointsDir = join(tempDir, 'state', 'checkpoints');
      const dirs = readdirSync(checkpointsDir);
      const cpId = dirs.find(d => d.startsWith('cp-06-'));

      // Modify the file
      writeFileSync(
        join(tempDir, 'stages', '06-implementation', 'outputs', 'main.ts'),
        'const modified = true;'
      );

      // Restore
      const result = await runCli(['restore', cpId!], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      // Verify restored content
      const content = readTextFile(tempDir, 'stages', '06-implementation', 'outputs', 'main.ts');
      expect(content).toContain('original');
    });

    it('should restore nested directory structure', async () => {
      setStageProgress(tempDir, '06-implementation', 'in_progress');
      setupStageOutputs(tempDir, '06-implementation', {
        'src/index.ts': 'export const ORIGINAL = 1;',
        'src/utils/helper.ts': 'export function originalHelper() {}',
      });
      await runCli(['checkpoint'], { cwd: tempDir });

      const checkpointsDir = join(tempDir, 'state', 'checkpoints');
      const dirs = readdirSync(checkpointsDir);
      const cpId = dirs.find(d => d.startsWith('cp-06-'));

      // Modify files
      writeFileSync(
        join(tempDir, 'stages', '06-implementation', 'outputs', 'src', 'index.ts'),
        'export const MODIFIED = 2;'
      );

      // Restore
      await runCli(['restore', cpId!], { cwd: tempDir });

      const content = readTextFile(tempDir, 'stages', '06-implementation', 'outputs', 'src', 'index.ts');
      expect(content).toContain('ORIGINAL');
    });
  });

  describe('latest checkpoint restoration', () => {
    it('should restore latest checkpoint with --latest flag', async () => {
      setStageProgress(tempDir, '06-implementation', 'in_progress');
      setupStageOutputs(tempDir, '06-implementation', { 'file.ts': 'first version' });
      await runCli(['checkpoint'], { cwd: tempDir });

      // Modify and create another checkpoint
      writeFileSync(
        join(tempDir, 'stages', '06-implementation', 'outputs', 'file.ts'),
        'second version'
      );
      await runCli(['checkpoint'], { cwd: tempDir });

      // Modify again
      writeFileSync(
        join(tempDir, 'stages', '06-implementation', 'outputs', 'file.ts'),
        'third version'
      );

      // Restore latest
      const result = await runCli(['restore', '--latest'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      const content = readTextFile(tempDir, 'stages', '06-implementation', 'outputs', 'file.ts');
      expect(content).toContain('second');
    });
  });

  describe('error handling', () => {
    it('should error for non-existent checkpoint', async () => {
      const result = await runCli(['restore', 'cp-nonexistent'], { cwd: tempDir });

      expect(result.exitCode).not.toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/(not found|찾을 수 없|존재하지)/i);
    });

    it('should error when no checkpoint specified and no latest', async () => {
      const result = await runCli(['restore'], { cwd: tempDir });

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('restore confirmation', () => {
    it('should show files being restored', async () => {
      setStageProgress(tempDir, '06-implementation', 'in_progress');
      setupStageOutputs(tempDir, '06-implementation', {
        'app.ts': 'const app = 1;',
        'config.ts': 'const config = {};',
      });
      await runCli(['checkpoint'], { cwd: tempDir });

      const checkpointsDir = join(tempDir, 'state', 'checkpoints');
      const dirs = readdirSync(checkpointsDir);
      const cpId = dirs.find(d => d.startsWith('cp-06-'));

      // Modify
      writeFileSync(
        join(tempDir, 'stages', '06-implementation', 'outputs', 'app.ts'),
        'modified'
      );

      const result = await runCli(['restore', cpId!], { cwd: tempDir });

      expect(result.stdout).toMatch(/(복원|restore)/i);
    });
  });
});
