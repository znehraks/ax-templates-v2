/**
 * ax-templates CLI - Run-Stage Command Tests
 * E2E tests for stage execution
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTempProject,
  cleanupTempProject,
  createInitializedProject,
  setStageProgress,
  setupStageOutputs,
  runCli,
  readJsonFile,
} from '../helpers.js';
import { CLI_AVAILABLE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('run-stage command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
    createInitializedProject(tempDir);
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('stage selection', () => {
    it('should start a specific stage', async () => {
      const result = await runCli(['run-stage', '01-brainstorm'], { cwd: tempDir });

      // Should show stage is starting
      expect(result.stdout).toContain('01-brainstorm');
    });

    it('should error for non-existent stage', async () => {
      const result = await runCli(['run-stage', '99-nonexistent'], { cwd: tempDir });

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('stage dependencies', () => {
    it('should warn when previous stage not completed', async () => {
      const result = await runCli(['run-stage', '02-research'], { cwd: tempDir });

      // Should warn about missing dependencies
      expect(result.stdout.toLowerCase()).toMatch(/(warning|이전|의존)/);
    });

    it('should run stage when dependencies are met', async () => {
      // Complete first stage
      setStageProgress(tempDir, '01-brainstorm', 'completed');
      setupStageOutputs(tempDir, '01-brainstorm', {
        'ideas.md': '# Ideas',
        'requirements_analysis.md': '# Requirements',
        'HANDOFF.md': '# Handoff',
      });

      const result = await runCli(['run-stage', '02-research'], { cwd: tempDir });

      expect(result.stdout).toContain('02-research');
    });
  });

  describe('progress tracking', () => {
    it('should update progress.json on stage start', async () => {
      await runCli(['run-stage', '01-brainstorm'], { cwd: tempDir });

      const progress = readJsonFile(tempDir, 'state', 'progress.json') as any;
      expect(progress.currentStage).toBe('01-brainstorm');
    });
  });

  describe('stage shortcut aliases', () => {
    it('should support brainstorm alias', async () => {
      const result = await runCli(['brainstorm'], { cwd: tempDir, timeout: 15000 });

      // Should recognize the alias
      expect(result.stdout).toContain('01-brainstorm');
    });
  });

  describe('force option', () => {
    it('should allow skipping dependencies with --force', async () => {
      const result = await runCli(['run-stage', '02-research', '--force'], { cwd: tempDir });

      // Should start despite missing dependencies
      expect(result.stdout).toContain('02-research');
    });
  });
});
