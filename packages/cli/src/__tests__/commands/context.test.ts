/**
 * ax-templates CLI - Context Command Tests
 * E2E tests for context management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createTempProject,
  cleanupTempProject,
  createInitializedProject,
  runCli,
  fileExists,
  readJsonFile,
} from '../helpers.js';
import { CLI_AVAILABLE } from '../setup.js';

let tempDir: string;

describe.skipIf(!CLI_AVAILABLE)('context command', () => {
  beforeEach(() => {
    tempDir = createTempProject();
    createInitializedProject(tempDir);
  });

  afterEach(() => {
    cleanupTempProject(tempDir);
  });

  describe('context status', () => {
    it('should display context status', async () => {
      const result = await runCli(['context'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/(context|컨텍스트|상태)/i);
    });

    it('should show unknown when no context state exists', async () => {
      const result = await runCli(['context'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(unknown|알 수 없|미확인)/i);
    });
  });

  describe('context state with data', () => {
    it('should display context percentage when state exists', async () => {
      // Create context state
      const contextState = {
        usagePercent: 45,
        tokensUsed: 90000,
        maxTokens: 200000,
        threshold: 'warning',
        timestamp: new Date().toISOString(),
      };
      const contextDir = join(tempDir, 'state', 'context');
      writeFileSync(join(contextDir, 'context_state.json'), JSON.stringify(contextState));

      const result = await runCli(['context'], { cwd: tempDir });

      expect(result.stdout).toMatch(/55|45/); // 55% remaining or 45% used
    });

    it('should show threshold level', async () => {
      const contextState = {
        usagePercent: 55,
        tokensUsed: 110000,
        maxTokens: 200000,
        threshold: 'action',
        timestamp: new Date().toISOString(),
      };
      writeFileSync(
        join(tempDir, 'state', 'context', 'context_state.json'),
        JSON.stringify(contextState)
      );

      const result = await runCli(['context'], { cwd: tempDir });

      expect(result.stdout.toLowerCase()).toMatch(/(action|액션|주의)/i);
    });
  });

  describe('context save', () => {
    it('should save context snapshot', async () => {
      const result = await runCli(['context', 'save'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.toLowerCase()).toMatch(/(save|저장)/i);
    });

    it('should create snapshot file', async () => {
      await runCli(['context', 'save'], { cwd: tempDir });

      // Check that a snapshot was created
      const contextDir = join(tempDir, 'state', 'context');
      const files = require('fs').readdirSync(contextDir);
      const hasSnapshot = files.some((f: string) => f.startsWith('state_'));

      expect(hasSnapshot).toBe(true);
    });
  });

  describe('context update', () => {
    it('should update context usage', async () => {
      const result = await runCli(['context', 'update', '--usage', '50'], { cwd: tempDir });

      expect(result.exitCode).toBe(0);

      const state = readJsonFile(tempDir, 'state', 'context', 'context_state.json') as any;
      expect(state.usagePercent).toBe(50);
    });
  });

  describe('context thresholds', () => {
    it('should show warning at 60% usage', async () => {
      const contextState = {
        usagePercent: 45, // 55% remaining -> warning
        tokensUsed: 90000,
        maxTokens: 200000,
        threshold: 'warning',
        timestamp: new Date().toISOString(),
      };
      writeFileSync(
        join(tempDir, 'state', 'context', 'context_state.json'),
        JSON.stringify(contextState)
      );

      const result = await runCli(['context'], { cwd: tempDir });

      expect(result.stdout).toMatch(/🟡|warning|경고/i);
    });

    it('should show critical at 40% remaining', async () => {
      const contextState = {
        usagePercent: 65, // 35% remaining -> critical
        tokensUsed: 130000,
        maxTokens: 200000,
        threshold: 'critical',
        timestamp: new Date().toISOString(),
      };
      writeFileSync(
        join(tempDir, 'state', 'context', 'context_state.json'),
        JSON.stringify(contextState)
      );

      const result = await runCli(['context'], { cwd: tempDir });

      expect(result.stdout).toMatch(/🔴|critical|위험/i);
    });
  });

  describe('context list', () => {
    it('should list context snapshots', async () => {
      // Create some snapshots
      await runCli(['context', 'save'], { cwd: tempDir });
      await runCli(['context', 'save'], { cwd: tempDir });

      const result = await runCli(['context', 'list'], { cwd: tempDir });

      expect(result.stdout).toMatch(/state_/);
    });
  });
});
