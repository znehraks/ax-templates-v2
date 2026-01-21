/**
 * @ax-templates/core - AI Wrapper Tests
 * Tests for AI CLI abstraction layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stringify as yamlStringify } from 'yaml';
import * as childProcess from 'node:child_process';
import {
  getAICallLogs,
  logAICall,
  updateAICallLog,
  isTmuxAvailable,
  getTmuxSessionStatus,
  ensureTmuxSession,
  isCLIAvailable,
  checkAIAvailability,
  getWrapperScriptPath,
} from '../wrapper.js';
import type { AICallLog } from '../types.js';

// Mock child_process
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');
  return {
    ...actual,
    execSync: vi.fn(),
  };
});

const mockedExecSync = vi.mocked(childProcess.execSync);

// Test helpers
let tempDir: string;

function createTempDir(): string {
  const dir = join(tmpdir(), `ax-ai-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanupDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function setupTestProject(dir: string): void {
  // Create directory structure
  mkdirSync(join(dir, 'state'), { recursive: true });
  mkdirSync(join(dir, 'config'), { recursive: true });
  mkdirSync(join(dir, 'scripts'), { recursive: true });

  // Create .ax-config.yaml
  const config = {
    ax_templates: { version: '2.0.0' },
    paths: {
      project_root: './',
      stages_output: './stages',
      state: './state',
      checkpoints: './state/checkpoints',
    },
    tmux: {
      gemini_session: 'ax-gemini',
      codex_session: 'ax-codex',
      output_timeout: 300,
    },
  };
  writeFileSync(join(dir, '.ax-config.yaml'), yamlStringify(config));
}

describe('AI Call Logging', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  describe('getAICallLogs', () => {
    it('should return empty array when no log file exists', () => {
      const logs = getAICallLogs(tempDir);
      expect(logs).toHaveLength(0);
    });

    it('should return saved logs', () => {
      const mockLogs: AICallLog[] = [
        {
          id: 'ai-123',
          provider: 'gemini',
          timestamp: '2024-01-01T00:00:00.000Z',
          prompt: 'Test prompt',
          status: 'success',
        },
      ];
      writeFileSync(join(tempDir, 'state', 'ai_calls.json'), JSON.stringify(mockLogs));

      const logs = getAICallLogs(tempDir);
      expect(logs).toHaveLength(1);
      expect(logs[0].provider).toBe('gemini');
      expect(logs[0].status).toBe('success');
    });

    it('should return empty array for invalid JSON', () => {
      writeFileSync(join(tempDir, 'state', 'ai_calls.json'), 'invalid json');

      const logs = getAICallLogs(tempDir);
      expect(logs).toHaveLength(0);
    });
  });

  describe('logAICall', () => {
    it('should create log entry with generated ID', () => {
      const entry = logAICall({
        provider: 'gemini',
        timestamp: new Date().toISOString(),
        prompt: 'Test prompt',
        status: 'pending',
      }, tempDir);

      expect(entry.id).toMatch(/^ai-/);
      expect(entry.provider).toBe('gemini');
      expect(entry.status).toBe('pending');
    });

    it('should append to existing logs', () => {
      logAICall({
        provider: 'gemini',
        timestamp: new Date().toISOString(),
        prompt: 'First prompt',
        status: 'success',
      }, tempDir);

      logAICall({
        provider: 'codex',
        timestamp: new Date().toISOString(),
        prompt: 'Second prompt',
        status: 'pending',
      }, tempDir);

      const logs = getAICallLogs(tempDir);
      expect(logs).toHaveLength(2);
      expect(logs[0].provider).toBe('gemini');
      expect(logs[1].provider).toBe('codex');
    });

    it('should create state directory if not exists', () => {
      rmSync(join(tempDir, 'state'), { recursive: true });

      logAICall({
        provider: 'gemini',
        timestamp: new Date().toISOString(),
        prompt: 'Test',
        status: 'pending',
      }, tempDir);

      expect(existsSync(join(tempDir, 'state'))).toBe(true);
    });

    it('should include all provided fields', () => {
      const entry = logAICall({
        provider: 'codex',
        timestamp: '2024-01-01T12:00:00.000Z',
        prompt: 'Generate code',
        promptFile: 'prompts/code.md',
        outputFile: 'outputs/code.ts',
        status: 'pending',
      }, tempDir);

      expect(entry.promptFile).toBe('prompts/code.md');
      expect(entry.outputFile).toBe('outputs/code.ts');
    });
  });

  describe('updateAICallLog', () => {
    it('should update existing log entry', () => {
      const entry = logAICall({
        provider: 'gemini',
        timestamp: new Date().toISOString(),
        prompt: 'Test',
        status: 'pending',
      }, tempDir);

      updateAICallLog(entry.id, {
        status: 'success',
        duration: 5000,
      }, tempDir);

      const logs = getAICallLogs(tempDir);
      const updated = logs.find(l => l.id === entry.id);

      expect(updated?.status).toBe('success');
      expect(updated?.duration).toBe(5000);
    });

    it('should not throw for non-existent ID', () => {
      expect(() => {
        updateAICallLog('non-existent-id', { status: 'success' }, tempDir);
      }).not.toThrow();
    });

    it('should update error field on failure', () => {
      const entry = logAICall({
        provider: 'codex',
        timestamp: new Date().toISOString(),
        prompt: 'Test',
        status: 'pending',
      }, tempDir);

      updateAICallLog(entry.id, {
        status: 'failure',
        duration: 1000,
        error: 'CLI not found',
      }, tempDir);

      const logs = getAICallLogs(tempDir);
      const updated = logs.find(l => l.id === entry.id);

      expect(updated?.status).toBe('failure');
      expect(updated?.error).toBe('CLI not found');
    });
  });
});

describe('tmux Session Management', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  describe('isTmuxAvailable', () => {
    it('should return true when tmux is available', () => {
      mockedExecSync.mockReturnValueOnce(Buffer.from('/usr/bin/tmux'));

      expect(isTmuxAvailable()).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith('which tmux', { stdio: 'pipe' });
    });

    it('should return false when tmux is not available', () => {
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('not found');
      });

      expect(isTmuxAvailable()).toBe(false);
    });
  });

  describe('getTmuxSessionStatus', () => {
    it('should return exists=false when session does not exist', () => {
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('no server running');
      });

      const status = getTmuxSessionStatus('ax-gemini');

      expect(status.name).toBe('ax-gemini');
      expect(status.exists).toBe(false);
      expect(status.attached).toBe(false);
      expect(status.windowCount).toBe(0);
    });

    it('should parse session info correctly', () => {
      mockedExecSync.mockReturnValueOnce(
        'ax-gemini:0:2\nax-codex:1:1\nother-session:0:3\n' as unknown as Buffer
      );

      const status = getTmuxSessionStatus('ax-gemini');

      expect(status.exists).toBe(true);
      expect(status.attached).toBe(false);
      expect(status.windowCount).toBe(2);
    });

    it('should detect attached session', () => {
      mockedExecSync.mockReturnValueOnce(
        'ax-gemini:1:1\n' as unknown as Buffer
      );

      const status = getTmuxSessionStatus('ax-gemini');

      expect(status.exists).toBe(true);
      expect(status.attached).toBe(true);
    });

    it('should return exists=false for non-matching session', () => {
      mockedExecSync.mockReturnValueOnce(
        'other-session:0:1\n' as unknown as Buffer
      );

      const status = getTmuxSessionStatus('ax-gemini');

      expect(status.exists).toBe(false);
    });
  });

  describe('ensureTmuxSession', () => {
    it('should return true if session already exists', () => {
      mockedExecSync.mockReturnValueOnce(
        'ax-gemini:0:1\n' as unknown as Buffer
      );

      const result = ensureTmuxSession('ax-gemini');

      expect(result).toBe(true);
      // Should not attempt to create
      expect(mockedExecSync).toHaveBeenCalledTimes(1);
    });

    it('should create session if it does not exist', () => {
      // First call: list sessions (returns different session)
      mockedExecSync.mockReturnValueOnce(
        'other-session:0:1\n' as unknown as Buffer
      );
      // Second call: create session
      mockedExecSync.mockReturnValueOnce(Buffer.from(''));

      const result = ensureTmuxSession('ax-gemini');

      expect(result).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledTimes(2);
      expect(mockedExecSync).toHaveBeenLastCalledWith(
        'tmux new-session -d -s "ax-gemini"',
        { stdio: 'pipe' }
      );
    });

    it('should return false if creation fails', () => {
      // First call: list sessions
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('no server');
      });
      // Second call: create session fails
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('failed to create');
      });

      const result = ensureTmuxSession('ax-gemini');

      expect(result).toBe(false);
    });
  });
});

describe('CLI Availability Checks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isCLIAvailable', () => {
    it('should return true when CLI is available', () => {
      mockedExecSync.mockReturnValueOnce(Buffer.from('/usr/local/bin/gemini'));

      expect(isCLIAvailable('gemini')).toBe(true);
      expect(mockedExecSync).toHaveBeenCalledWith('which gemini', { stdio: 'pipe' });
    });

    it('should return false when CLI is not available', () => {
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('not found');
      });

      expect(isCLIAvailable('gemini')).toBe(false);
    });
  });

  describe('checkAIAvailability', () => {
    it('should check all providers', () => {
      // gemini: available
      mockedExecSync.mockReturnValueOnce(Buffer.from('/usr/local/bin/gemini'));
      // codex: not available
      mockedExecSync.mockImplementationOnce(() => {
        throw new Error('not found');
      });

      const availability = checkAIAvailability();

      expect(availability.gemini).toBe(true);
      expect(availability.codex).toBe(false);
      expect(availability.claude).toBe(true); // Always available
      expect(availability.claudecode).toBe(true); // Always available
    });
  });
});

describe('Wrapper Scripts', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  describe('getWrapperScriptPath', () => {
    it('should return correct path for gemini', () => {
      const path = getWrapperScriptPath('gemini', tempDir);
      expect(path).toBe(join(tempDir, 'scripts', 'gemini-wrapper.sh'));
    });

    it('should return correct path for codex', () => {
      const path = getWrapperScriptPath('codex', tempDir);
      expect(path).toBe(join(tempDir, 'scripts', 'codex-wrapper.sh'));
    });

    it('should return correct path for claude', () => {
      const path = getWrapperScriptPath('claude', tempDir);
      expect(path).toBe(join(tempDir, 'scripts', 'claude-wrapper.sh'));
    });
  });
});

describe('AI Call Logs Integration', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should track complete AI call lifecycle', () => {
    // 1. Create pending log
    const entry = logAICall({
      provider: 'gemini',
      timestamp: new Date().toISOString(),
      prompt: 'Generate a function',
      outputFile: 'output.txt',
      status: 'pending',
    }, tempDir);

    // Verify pending state
    let logs = getAICallLogs(tempDir);
    expect(logs[0].status).toBe('pending');

    // 2. Update to success
    updateAICallLog(entry.id, {
      status: 'success',
      duration: 3500,
    }, tempDir);

    // Verify success state
    logs = getAICallLogs(tempDir);
    expect(logs[0].status).toBe('success');
    expect(logs[0].duration).toBe(3500);
  });

  it('should maintain multiple log entries correctly', () => {
    // Create 3 log entries
    const entry1 = logAICall({
      provider: 'gemini',
      timestamp: '2024-01-01T10:00:00.000Z',
      prompt: 'First call',
      status: 'success',
      duration: 1000,
    }, tempDir);

    const entry2 = logAICall({
      provider: 'codex',
      timestamp: '2024-01-01T11:00:00.000Z',
      prompt: 'Second call',
      status: 'failure',
      error: 'timeout',
    }, tempDir);

    const entry3 = logAICall({
      provider: 'gemini',
      timestamp: '2024-01-01T12:00:00.000Z',
      prompt: 'Third call',
      status: 'pending',
    }, tempDir);

    // Update third entry
    updateAICallLog(entry3.id, { status: 'success', duration: 2000 }, tempDir);

    const logs = getAICallLogs(tempDir);
    expect(logs).toHaveLength(3);

    // Check ordering and integrity
    expect(logs[0].id).toBe(entry1.id);
    expect(logs[1].id).toBe(entry2.id);
    expect(logs[1].error).toBe('timeout');
    expect(logs[2].status).toBe('success');
    expect(logs[2].duration).toBe(2000);
  });
});
