/**
 * ax-templates CLI - Handoff Command Tests
 * E2E tests for HANDOFF.md generation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTempProject,
  cleanupTempProject,
  createInitializedProject,
  setStageProgress,
  setupStageOutputs,
  runCli,
  fileExists,
  readTextFile,
} from '../helpers.js';
import { CLI_AVAILABLE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('handoff command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
    createInitializedProject(tempDir);
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('handoff generation', () => {
    it('should generate HANDOFF.md for current stage', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'in_progress');
      setupStageOutputs(tempDir, '01-brainstorm', {
        'ideas.md': '# Ideas',
      });

      const result = await runCli(['handoff'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(fileExists(tempDir, 'stages', '01-brainstorm', 'HANDOFF.md')).toBe(true);
    });

    it('should include stage information in handoff', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'in_progress');
      setupStageOutputs(tempDir, '01-brainstorm', {
        'ideas.md': '# Ideas',
      });

      await runCli(['handoff'], { cwd: tempDir });

      const content = readTextFile(tempDir, 'stages', '01-brainstorm', 'HANDOFF.md');
      expect(content).toContain('HANDOFF');
      expect(content).toContain('01-brainstorm');
    });

    it('should include next stage information', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'in_progress');
      setupStageOutputs(tempDir, '01-brainstorm', {
        'ideas.md': '# Ideas',
      });

      await runCli(['handoff'], { cwd: tempDir });

      const content = readTextFile(tempDir, 'stages', '01-brainstorm', 'HANDOFF.md');
      expect(content).toContain('Research'); // Next stage name
    });
  });

  describe('handoff for specific stage', () => {
    it('should generate handoff for specified stage', async () => {
      setupStageOutputs(tempDir, '02-research', {
        'tech_research.md': '# Research',
      });

      const result = await runCli(['handoff', '02-research'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(fileExists(tempDir, 'stages', '02-research', 'HANDOFF.md')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should error when no current stage and no stage specified', async () => {
      const result = await runCli(['handoff'], { cwd: tempDir });

      // Should warn about no current stage
      expect(result.stdout.toLowerCase()).toMatch(/(no.*stage|스테이지.*없|지정)/i);
    });

    it('should error for non-existent stage', async () => {
      const result = await runCli(['handoff', '99-nonexistent'], { cwd: tempDir });

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('output file listing', () => {
    it('should list outputs in handoff document', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'in_progress');
      setupStageOutputs(tempDir, '01-brainstorm', {
        'ideas.md': '# Ideas content',
        'requirements.md': '# Requirements',
      });

      await runCli(['handoff'], { cwd: tempDir });

      const content = readTextFile(tempDir, 'stages', '01-brainstorm', 'HANDOFF.md');
      expect(content).toContain('ideas.md');
    });
  });
});
