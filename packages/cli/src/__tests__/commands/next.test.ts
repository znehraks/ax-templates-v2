/**
 * ax-templates CLI - Next Command Tests
 * E2E tests for stage transition
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
  fileExists,
} from '../helpers.js';
import { CLI_AVAILABLE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('next command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
    createInitializedProject(tempDir);
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('stage transition', () => {
    it('should transition to next stage when current is completed', async () => {
      // Setup: complete brainstorm stage
      setStageProgress(tempDir, '01-brainstorm', 'completed');
      setupStageOutputs(tempDir, '01-brainstorm', {
        'ideas.md': '# Ideas',
        'requirements_analysis.md': '# Requirements',
        'HANDOFF.md': '# Handoff for Research Stage',
      });

      const result = await runCli(['next'], { cwd: tempDir });

      expect(result.stdout).toContain('02-research');
    });

    it('should error when no current stage', async () => {
      const result = await runCli(['next'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(no.*stage|스테이지.*없)/i);
    });
  });

  describe('HANDOFF.md requirement', () => {
    it('should require HANDOFF.md before transition', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'in_progress');
      // No HANDOFF.md created

      const result = await runCli(['next'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(handoff|완료)/i);
    });

    it('should proceed when HANDOFF.md exists', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'completed');
      setupStageOutputs(tempDir, '01-brainstorm', {
        'HANDOFF.md': '# Handoff Document',
      });

      const result = await runCli(['next'], { cwd: tempDir });

      expect(result.stdout).toContain('02-research');
    });
  });

  describe('pipeline completion', () => {
    it('should indicate pipeline complete at last stage', async () => {
      // Complete all stages up to deployment
      const stages = [
        '01-brainstorm', '02-research', '03-planning', '04-ui-ux',
        '05-task-management', '06-implementation', '07-refactoring',
        '08-qa', '09-testing',
      ];

      for (const stage of stages) {
        setStageProgress(tempDir, stage, 'completed');
        setupStageOutputs(tempDir, stage, { 'HANDOFF.md': '# Done' });
      }

      // Set deployment as current and completed
      setStageProgress(tempDir, '10-deployment', 'completed');
      setupStageOutputs(tempDir, '10-deployment', {
        'deployment_log.md': '# Deployed',
      });

      const result = await runCli(['next'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(complete|완료|마지막)/i);
    });
  });

  describe('progress update', () => {
    it('should update progress.json on transition', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'completed');
      setupStageOutputs(tempDir, '01-brainstorm', {
        'HANDOFF.md': '# Handoff',
        'ideas.md': '# Ideas',
      });

      await runCli(['next'], { cwd: tempDir });

      const progress = readJsonFile(tempDir, 'state', 'progress.json') as any;
      expect(progress.currentStage).toBe('02-research');
    });
  });
});
