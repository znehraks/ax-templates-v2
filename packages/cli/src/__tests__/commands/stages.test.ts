/**
 * ax-templates CLI - Stages Command Tests
 * E2E tests for stage listing and details
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createTempProject,
  cleanupTempProject,
  createInitializedProject,
  setStageProgress,
  runCli,
} from '../helpers.js';
import { CLI_AVAILABLE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('stages command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
    createInitializedProject(tempDir);
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('list all stages', () => {
    it('should list all pipeline stages', async () => {
      const result = await runCli(['stages'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('파이프라인 스테이지');
      expect(result.stdout).toContain('01-brainstorm');
      expect(result.stdout).toContain('02-research');
      expect(result.stdout).toContain('10-deployment');
    });

    it('should show AI models for each stage', async () => {
      const result = await runCli(['stages'], { cwd: tempDir });

      expect(result.stdout).toContain('gemini');
      expect(result.stdout).toContain('claudecode');
    });

    it('should show execution mode for each stage', async () => {
      const result = await runCli(['stages'], { cwd: tempDir });

      expect(result.stdout).toContain('Mode:');
    });

    it('should mark current stage', async () => {
      setStageProgress(tempDir, '03-planning', 'in_progress');

      const result = await runCli(['stages'], { cwd: tempDir });

      expect(result.stdout).toContain('03-planning');
      expect(result.stdout).toContain('현재');
    });
  });

  describe('stage details', () => {
    it('should show details for specific stage', async () => {
      const result = await runCli(['stages', '01-brainstorm'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Brainstorming');
      expect(result.stdout).toContain('01-brainstorm');
    });

    it('should show stage status', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'completed');

      const result = await runCli(['stages', '01-brainstorm'], { cwd: tempDir });

      expect(result.stdout).toContain('상태');
      expect(result.stdout).toContain('완료');
    });

    it('should show stage configuration', async () => {
      const result = await runCli(['stages', '06-implementation'], { cwd: tempDir });

      expect(result.stdout).toContain('AI 모델');
      expect(result.stdout).toContain('실행 모드');
      expect(result.stdout).toContain('타임아웃');
    });

    it('should show checkpoint requirement', async () => {
      const result = await runCli(['stages', '06-implementation'], { cwd: tempDir });

      expect(result.stdout).toContain('체크포인트 필수');
    });

    it('should show inputs and outputs with -a flag', async () => {
      const result = await runCli(['stages', '01-brainstorm', '-a'], { cwd: tempDir });

      expect(result.stdout).toContain('입력');
      expect(result.stdout).toContain('출력');
    });
  });

  describe('error handling', () => {
    it('should error for non-existent stage', async () => {
      const result = await runCli(['stages', '99-nonexistent'], { cwd: tempDir });

      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).toContain('찾을 수 없습니다');
    });

    it('should suggest available stages on error', async () => {
      const result = await runCli(['stages', 'invalid-stage'], { cwd: tempDir });

      expect(result.stdout).toContain('사용 가능한 스테이지');
    });
  });

  describe('stage status icons', () => {
    it('should show completion icon for completed stages', async () => {
      setStageProgress(tempDir, '01-brainstorm', 'completed');

      const result = await runCli(['stages'], { cwd: tempDir });

      expect(result.stdout).toContain('✓');
    });

    it('should show in-progress icon for current stage', async () => {
      setStageProgress(tempDir, '02-research', 'in_progress');

      const result = await runCli(['stages'], { cwd: tempDir });

      expect(result.stdout).toContain('●');
    });

    it('should show failure icon for failed stages', async () => {
      setStageProgress(tempDir, '03-planning', 'failed');

      const result = await runCli(['stages'], { cwd: tempDir });

      expect(result.stdout).toContain('✗');
    });
  });
});
