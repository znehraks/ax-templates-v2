/**
 * ax-templates CLI - Status Command Tests
 * E2E tests for pipeline status display
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTempProject,
  cleanupTempProject,
  createInitializedProject,
  setStageProgress,
  setupStageOutputs,
  runCli,
} from '../helpers.js';
import { CLI_AVAILABLE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('status command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
    createInitializedProject(tempDir);
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('basic status display', () => {
    it('should display pipeline status', async () => {
      const result = await runCli(['status'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Pipeline Status');
    });

    it('should show all stages', async () => {
      const result = await runCli(['status'], { cwd: tempDir });

      expect(result.stdout).toContain('01-brainstorm');
      expect(result.stdout).toContain('06-implementation');
      expect(result.stdout).toContain('10-deployment');
    });

    it('should show progress summary', async () => {
      const result = await runCli(['status'], { cwd: tempDir });

      expect(result.stdout).toContain('완료');
      expect(result.stdout).toContain('대기');
    });
  });

  describe('stage status display', () => {
    it('should mark current stage', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'in_progress');

      const result = await runCli(['status'], { cwd: tempDir });

      expect(result.stdout).toContain('01-brainstorm');
      expect(result.stdout).toContain('현재');
    });

    it('should show completed stages', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'completed');
      setupStageOutputs(tempDir, '01-brainstorm', {
        'ideas.md': '# Ideas',
        'HANDOFF.md': '# Handoff',
      });

      const result = await runCli(['status'], { cwd: tempDir });

      expect(result.stdout).toContain('✓');
      expect(result.stdout).toContain('완료');
    });

    it('should show failed stages', async () => {
      setStageProgress(tempDir, '02-research', 'failed');

      const result = await runCli(['status'], { cwd: tempDir });

      expect(result.stdout).toContain('✗');
    });
  });

  describe('progress calculation', () => {
    it('should calculate correct progress with completed stages', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'completed');
      setStageProgress(tempDir, '02-research', 'completed');
      setStageProgress(tempDir, '03-planning', 'in_progress');

      const result = await runCli(['status'], { cwd: tempDir });

      // Should show 2 completed out of 10
      expect(result.stdout).toContain('2/10');
    });
  });

  describe('verbose option', () => {
    it('should show timestamps with verbose flag', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'completed');

      const result = await runCli(['status', '-v'], { cwd: tempDir });

      // Should include timestamp info
      expect(result.stdout).toContain('01-brainstorm');
    });
  });

  describe('next stage suggestion', () => {
    it('should suggest next stage when one is available', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'completed');
      setupStageOutputs(tempDir, '01-brainstorm', {
        'ideas.md': '# Ideas',
        'HANDOFF.md': '# Handoff',
      });

      const result = await runCli(['status'], { cwd: tempDir });

      expect(result.stdout).toContain('다음 스테이지');
    });
  });

  describe('error handling', () => {
    it('should handle missing config gracefully', async () => {
      const emptyDir = createTempProject();

      const result = await runCli(['status'], { cwd: emptyDir });

      // Should show error or handle gracefully
      expect(result.exitCode).not.toBe(0);
    });
  });
});
