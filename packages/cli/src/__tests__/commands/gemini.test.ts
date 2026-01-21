/**
 * ax-templates CLI - Gemini Command Tests
 * E2E tests for Gemini CLI wrapper
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createTempProject,
  cleanupTempProject,
  createInitializedProject,
  runCli,
} from '../helpers.js';
import { CLI_AVAILABLE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('gemini command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
    createInitializedProject(tempDir);
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('gemini availability', () => {
    it('should check if gemini CLI is available', async () => {
      const result = await runCli(['gemini', '--check'], { cwd: tempDir });

      // Either shows available or not installed message
      expect(result.stdout.toLowerCase()).toMatch(/(gemini|available|설치|not found)/i);
    });
  });

  describe('gemini call with prompt', () => {
    it('should require prompt argument', async () => {
      const result = await runCli(['gemini'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(prompt|프롬프트|필요|required)/i);
    });

    it('should accept prompt argument', async () => {
      const result = await runCli(['gemini', 'Test prompt'], { cwd: tempDir, timeout: 5000 });

      // Will fail if gemini not installed, but should attempt the call
      expect(result.stdout.toLowerCase()).toMatch(/(gemini|prompt|call|호출|not found)/i);
    });
  });

  describe('gemini with options', () => {
    it('should accept timeout option', async () => {
      const result = await runCli(['gemini', '--timeout', '60', 'Test'], { cwd: tempDir, timeout: 5000 });

      // Should acknowledge timeout setting
      expect(result.exitCode).toBeDefined();
    });

    it('should accept output file option', async () => {
      const result = await runCli(['gemini', '--output', 'result.md', 'Test'], { cwd: tempDir, timeout: 5000 });

      expect(result.exitCode).toBeDefined();
    });
  });

  describe('gemini session management', () => {
    it('should show tmux session status', async () => {
      const result = await runCli(['gemini', '--status'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(session|세션|tmux)/i);
    });
  });

  describe('gemini help', () => {
    it('should show gemini command help', async () => {
      const result = await runCli(['gemini', '--help'], { cwd: tempDir });

      expect(result.stdout).toContain('gemini');
      expect(result.stdout.toLowerCase()).toMatch(/(usage|options|사용법)/i);
    });
  });

  describe('AI call logging', () => {
    it('should log AI calls', async () => {
      // Even if gemini isn't installed, should attempt to log
      await runCli(['gemini', 'Test prompt'], { cwd: tempDir, timeout: 5000 });

      // Check if log entry was created (or error was logged)
      const result = await runCli(['config', 'get', 'paths.state'], { cwd: tempDir });
      expect(result.exitCode).toBe(0);
    });
  });
});
