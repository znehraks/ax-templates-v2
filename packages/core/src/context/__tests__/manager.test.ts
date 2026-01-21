/**
 * @ax-templates/core - Context Manager Tests
 * Tests for context usage tracking and compression
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stringify as yamlStringify } from 'yaml';
import {
  getContextDir,
  getContextState,
  updateContextState,
  calculateThreshold,
  getRemainingContext,
  getRecommendedActions,
  formatContextStatus,
  generateSnapshotId,
  createSnapshot,
  listSnapshots,
  getLatestSnapshot,
  getTaskLog,
  logTaskCompletion,
  getTasksSinceLastSnapshot,
  snapshotToMarkdown,
  CONTEXT_STATE_FILE,
  SNAPSHOT_PREFIX,
  TASK_LOG_FILE,
  DEFAULT_MAX_TOKENS,
} from '../manager.js';
import type { ContextState, ContextSnapshot } from '../types.js';

// Test helpers
let tempDir: string;

function createTempDir(): string {
  const dir = join(tmpdir(), `ax-context-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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
  mkdirSync(join(dir, 'state', 'context'), { recursive: true });
  mkdirSync(join(dir, 'config'), { recursive: true });

  // Create .ax-config.yaml
  const config = {
    ax_templates: { version: '2.0.0' },
    paths: {
      project_root: './',
      stages_output: './stages',
      state: './state',
      checkpoints: './state/checkpoints',
    },
    context: {
      warning: 60,
      action: 50,
      critical: 40,
      task_save_frequency: 5,
    },
  };
  writeFileSync(join(dir, '.ax-config.yaml'), yamlStringify(config));

  // Create pipeline.yaml with stages
  const pipeline = {
    name: 'Test Pipeline',
    version: '1.0.0',
    stages: [
      {
        id: '01-brainstorm',
        name: 'Brainstorming',
        models: ['gemini'],
        mode: 'yolo',
        inputs: ['project_brief.md'],
        outputs: ['ideas.md', 'HANDOFF.md'],
        timeout: 3600,
      },
      {
        id: '02-research',
        name: 'Research',
        models: ['claude'],
        mode: 'plan',
        inputs: ['ideas.md'],
        outputs: ['research.md', 'HANDOFF.md'],
        timeout: 7200,
      },
    ],
  };
  writeFileSync(join(dir, 'config', 'pipeline.yaml'), yamlStringify(pipeline));

  // Create progress.json
  writeFileSync(join(dir, 'state', 'progress.json'), JSON.stringify({
    currentStage: '01-brainstorm',
    stages: {
      '01-brainstorm': {
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      },
    },
    lastUpdated: new Date().toISOString(),
    version: '2.0.0',
  }));
}

describe('Constants', () => {
  it('should have correct constant values', () => {
    expect(CONTEXT_STATE_FILE).toBe('context_state.json');
    expect(SNAPSHOT_PREFIX).toBe('state_');
    expect(TASK_LOG_FILE).toBe('task_log.json');
    expect(DEFAULT_MAX_TOKENS).toBe(200000);
  });
});

describe('getContextDir', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return context directory path', () => {
    const dir = getContextDir(tempDir);
    expect(dir).toBe(join(tempDir, 'state', 'context'));
  });
});

describe('getContextState', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return null when state does not exist', () => {
    const state = getContextState(tempDir);
    expect(state).toBeNull();
  });

  it('should return saved state', () => {
    const mockState: ContextState = {
      usagePercent: 30,
      tokensUsed: 60000,
      maxTokens: 200000,
      threshold: 'normal',
      timestamp: new Date().toISOString(),
    };

    const statePath = join(tempDir, 'state', 'context', CONTEXT_STATE_FILE);
    writeFileSync(statePath, JSON.stringify(mockState));

    const state = getContextState(tempDir);

    expect(state).not.toBeNull();
    expect(state?.usagePercent).toBe(30);
    expect(state?.tokensUsed).toBe(60000);
    expect(state?.threshold).toBe('normal');
  });

  it('should return null for invalid JSON', () => {
    const statePath = join(tempDir, 'state', 'context', CONTEXT_STATE_FILE);
    writeFileSync(statePath, 'invalid json content');

    const state = getContextState(tempDir);
    expect(state).toBeNull();
  });
});

describe('updateContextState', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should create initial state', () => {
    const state = updateContextState({ usagePercent: 20, tokensUsed: 40000 }, tempDir);

    expect(state.usagePercent).toBe(20);
    expect(state.tokensUsed).toBe(40000);
    expect(state.maxTokens).toBe(DEFAULT_MAX_TOKENS);
    expect(state.threshold).toBe('normal');
  });

  it('should update existing state', () => {
    // Create initial state
    updateContextState({ usagePercent: 20, tokensUsed: 40000 }, tempDir);

    // Update
    const state = updateContextState({ usagePercent: 55, tokensUsed: 110000 }, tempDir);

    expect(state.usagePercent).toBe(55);
    expect(state.tokensUsed).toBe(110000);
    expect(state.threshold).toBe('action'); // 100 - 55 = 45% remaining (≤ 50%)
  });

  it('should recalculate threshold on update', () => {
    // Warning threshold: remaining ≤ 60%, > 50%
    let state = updateContextState({ usagePercent: 45 }, tempDir); // 55% remaining
    expect(state.threshold).toBe('warning');

    // Action threshold: remaining ≤ 50%, > 40%
    state = updateContextState({ usagePercent: 55 }, tempDir); // 45% remaining
    expect(state.threshold).toBe('action');

    // Critical threshold: remaining ≤ 40%
    state = updateContextState({ usagePercent: 65 }, tempDir); // 35% remaining
    expect(state.threshold).toBe('critical');
  });

  it('should create context directory if not exists', () => {
    // Remove context directory
    rmSync(join(tempDir, 'state', 'context'), { recursive: true });

    updateContextState({ usagePercent: 20 }, tempDir);

    expect(existsSync(join(tempDir, 'state', 'context'))).toBe(true);
  });

  it('should save state to file', () => {
    updateContextState({ usagePercent: 30, tokensUsed: 60000 }, tempDir);

    const statePath = join(tempDir, 'state', 'context', CONTEXT_STATE_FILE);
    expect(existsSync(statePath)).toBe(true);

    const saved = JSON.parse(readFileSync(statePath, 'utf-8'));
    expect(saved.usagePercent).toBe(30);
    expect(saved.tokensUsed).toBe(60000);
  });
});

describe('calculateThreshold', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return normal when remaining > 60%', () => {
    // usagePercent = 30 means 70% remaining
    expect(calculateThreshold(30, tempDir)).toBe('normal');
    expect(calculateThreshold(39, tempDir)).toBe('normal'); // 61% remaining
  });

  it('should return warning when remaining ≤ 60% and > 50%', () => {
    // usagePercent = 40 means 60% remaining (exactly at warning)
    expect(calculateThreshold(40, tempDir)).toBe('warning');
    expect(calculateThreshold(49, tempDir)).toBe('warning'); // 51% remaining
  });

  it('should return action when remaining ≤ 50% and > 40%', () => {
    // usagePercent = 50 means 50% remaining (exactly at action)
    expect(calculateThreshold(50, tempDir)).toBe('action');
    expect(calculateThreshold(59, tempDir)).toBe('action'); // 41% remaining
  });

  it('should return critical when remaining ≤ 40%', () => {
    // usagePercent = 60 means 40% remaining (exactly at critical)
    expect(calculateThreshold(60, tempDir)).toBe('critical');
    expect(calculateThreshold(80, tempDir)).toBe('critical'); // 20% remaining
    expect(calculateThreshold(100, tempDir)).toBe('critical'); // 0% remaining
  });
});

describe('getRemainingContext', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return 100 when no state exists', () => {
    expect(getRemainingContext(tempDir)).toBe(100);
  });

  it('should calculate remaining from usage percent', () => {
    updateContextState({ usagePercent: 30 }, tempDir);
    expect(getRemainingContext(tempDir)).toBe(70);

    updateContextState({ usagePercent: 75 }, tempDir);
    expect(getRemainingContext(tempDir)).toBe(25);
  });
});

describe('getRecommendedActions', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return empty array when no state exists', () => {
    const actions = getRecommendedActions(tempDir);
    expect(actions).toHaveLength(0);
  });

  it('should return no actions for normal threshold', () => {
    updateContextState({ usagePercent: 20 }, tempDir);
    const actions = getRecommendedActions(tempDir);
    expect(actions).toHaveLength(0);
  });

  it('should return banner action for warning threshold', () => {
    updateContextState({ usagePercent: 45 }, tempDir); // 55% remaining = warning
    const actions = getRecommendedActions(tempDir);

    expect(actions).toHaveLength(1);
    expect(actions[0].type).toBe('display_banner');
    expect(actions[0].priority).toBe('warning');
    expect(actions[0].message).toContain('Warning');
  });

  it('should return save and compress actions for action threshold', () => {
    updateContextState({ usagePercent: 55 }, tempDir); // 45% remaining = action
    const actions = getRecommendedActions(tempDir);

    expect(actions).toHaveLength(2);
    expect(actions.some(a => a.type === 'save_snapshot')).toBe(true);
    expect(actions.some(a => a.type === 'suggest_compress')).toBe(true);
  });

  it('should return save and prompt actions for critical threshold', () => {
    updateContextState({ usagePercent: 65 }, tempDir); // 35% remaining = critical
    const actions = getRecommendedActions(tempDir);

    expect(actions).toHaveLength(2);
    expect(actions.some(a => a.type === 'save_snapshot')).toBe(true);
    expect(actions.some(a => a.type === 'prompt_confirm')).toBe(true);
    expect(actions.every(a => a.priority === 'critical')).toBe(true);
  });
});

describe('formatContextStatus', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return unknown when no state exists', () => {
    const status = formatContextStatus(tempDir);
    expect(status).toBe('[Context: Unknown]');
  });

  it('should format normal status with green icon', () => {
    updateContextState({ usagePercent: 20, tokensUsed: 40000 }, tempDir);
    const status = formatContextStatus(tempDir);

    expect(status).toContain('🟢');
    expect(status).toContain('80%'); // remaining
    expect(status).toContain('40k');
  });

  it('should format warning status with yellow icon', () => {
    updateContextState({ usagePercent: 45, tokensUsed: 90000 }, tempDir);
    const status = formatContextStatus(tempDir);

    expect(status).toContain('🟡');
    expect(status).toContain('55%');
  });

  it('should format action status with orange icon', () => {
    updateContextState({ usagePercent: 55, tokensUsed: 110000 }, tempDir);
    const status = formatContextStatus(tempDir);

    expect(status).toContain('🟠');
    expect(status).toContain('45%');
  });

  it('should format critical status with red icon', () => {
    updateContextState({ usagePercent: 70, tokensUsed: 140000 }, tempDir);
    const status = formatContextStatus(tempDir);

    expect(status).toContain('🔴');
    expect(status).toContain('30%');
  });
});

describe('generateSnapshotId', () => {
  it('should generate ID with stage prefix', () => {
    const id = generateSnapshotId('01-brainstorm');
    expect(id.startsWith('state_')).toBe(true);
    expect(id).toContain('_01');
  });

  it('should generate ID with timestamp format', () => {
    const id = generateSnapshotId('02-research');
    // Format: state_YYYY-MM-DDTHH-MM-SS_02
    expect(id).toMatch(/^state_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}_02$/);
  });

  it('should extract stage number for short ID', () => {
    const id = generateSnapshotId('06-implementation');
    expect(id.endsWith('_06')).toBe(true);
  });
});

describe('createSnapshot', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should create snapshot with default values', () => {
    const snapshot = createSnapshot('manual', {}, tempDir);

    expect(snapshot.id).toMatch(/^state_/);
    expect(snapshot.trigger).toBe('manual');
    expect(snapshot.stageId).toBe('01-brainstorm');
    expect(snapshot.stageName).toBe('Brainstorming');
    expect(snapshot.progress.completedTasks).toHaveLength(0);
    expect(snapshot.keyContext.decisions).toHaveLength(0);
  });

  it('should create snapshot with provided options', () => {
    const snapshot = createSnapshot('threshold', {
      completedTasks: ['Task 1', 'Task 2'],
      inProgressTasks: ['Task 3'],
      pendingTasks: ['Task 4', 'Task 5'],
      decisions: ['Decision A'],
      modifiedFiles: ['file1.ts', 'file2.ts'],
      activeIssues: ['Bug #123'],
      handoffRef: 'stages/01-brainstorm/HANDOFF.md',
      checkpointRef: 'cp-01-2024-01-01T00-00-00',
    }, tempDir);

    expect(snapshot.progress.completedTasks).toEqual(['Task 1', 'Task 2']);
    expect(snapshot.progress.inProgressTasks).toEqual(['Task 3']);
    expect(snapshot.progress.pendingTasks).toEqual(['Task 4', 'Task 5']);
    expect(snapshot.keyContext.decisions).toEqual(['Decision A']);
    expect(snapshot.keyContext.modifiedFiles).toEqual(['file1.ts', 'file2.ts']);
    expect(snapshot.keyContext.activeIssues).toEqual(['Bug #123']);
    expect(snapshot.recovery.handoffRef).toBe('stages/01-brainstorm/HANDOFF.md');
    expect(snapshot.recovery.checkpointRef).toBe('cp-01-2024-01-01T00-00-00');
  });

  it('should save snapshot to file', () => {
    const snapshot = createSnapshot('manual', {}, tempDir);
    const snapshotPath = join(tempDir, 'state', 'context', `${snapshot.id}.json`);

    expect(existsSync(snapshotPath)).toBe(true);

    const saved = JSON.parse(readFileSync(snapshotPath, 'utf-8'));
    expect(saved.id).toBe(snapshot.id);
    expect(saved.trigger).toBe('manual');
  });

  it('should include current context state', () => {
    updateContextState({ usagePercent: 50, tokensUsed: 100000 }, tempDir);
    const snapshot = createSnapshot('threshold', {}, tempDir);

    expect(snapshot.contextState.usagePercent).toBe(50);
    expect(snapshot.contextState.tokensUsed).toBe(100000);
  });
});

describe('listSnapshots', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return empty array when no snapshots exist', () => {
    const snapshots = listSnapshots(tempDir);
    expect(snapshots).toHaveLength(0);
  });

  it('should return empty array when context dir does not exist', () => {
    rmSync(join(tempDir, 'state', 'context'), { recursive: true });
    const snapshots = listSnapshots(tempDir);
    expect(snapshots).toHaveLength(0);
  });

  it('should list all snapshots', async () => {
    createSnapshot('manual', {}, tempDir);
    // Add delay to ensure different timestamps (snapshot IDs use seconds)
    await new Promise(resolve => setTimeout(resolve, 1100));
    createSnapshot('threshold', {}, tempDir);
    await new Promise(resolve => setTimeout(resolve, 1100));
    createSnapshot('task_complete', {}, tempDir);

    const snapshots = listSnapshots(tempDir);
    expect(snapshots.length).toBeGreaterThanOrEqual(3);
  });

  it('should sort by creation date (newest first)', async () => {
    // Create snapshots with delay to ensure different timestamps
    const first = createSnapshot('manual', {}, tempDir);
    // Snapshot IDs use seconds precision, so need >1s delay
    await new Promise(resolve => setTimeout(resolve, 1100));
    const second = createSnapshot('manual', {}, tempDir);

    const snapshots = listSnapshots(tempDir);

    // Second should be first (newest)
    expect(snapshots[0].id).toBe(second.id);
    expect(snapshots[1].id).toBe(first.id);
  });
});

describe('getLatestSnapshot', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return null when no snapshots exist', () => {
    const latest = getLatestSnapshot(tempDir);
    expect(latest).toBeNull();
  });

  it('should return most recent snapshot', () => {
    createSnapshot('manual', {}, tempDir);
    const second = createSnapshot('threshold', {}, tempDir);

    const latest = getLatestSnapshot(tempDir);

    expect(latest?.id).toBe(second.id);
    expect(latest?.trigger).toBe('threshold');
  });
});

describe('Task Logging', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  describe('getTaskLog', () => {
    it('should return empty array when no log exists', () => {
      const log = getTaskLog(tempDir);
      expect(log).toHaveLength(0);
    });

    it('should return saved task log', () => {
      const logPath = join(tempDir, 'state', 'context', TASK_LOG_FILE);
      const mockLog = [
        { taskId: 'task-1', description: 'Task 1', completedAt: new Date().toISOString(), stageId: '01-brainstorm' },
      ];
      writeFileSync(logPath, JSON.stringify(mockLog));

      const log = getTaskLog(tempDir);
      expect(log).toHaveLength(1);
      expect(log[0].description).toBe('Task 1');
    });
  });

  describe('logTaskCompletion', () => {
    it('should log task completion', () => {
      const task = logTaskCompletion('Completed feature X', '01-brainstorm', tempDir);

      expect(task.taskId).toMatch(/^task-/);
      expect(task.description).toBe('Completed feature X');
      expect(task.stageId).toBe('01-brainstorm');
      expect(task.completedAt).toBeDefined();
    });

    it('should append to existing log', () => {
      logTaskCompletion('Task 1', '01-brainstorm', tempDir);
      logTaskCompletion('Task 2', '01-brainstorm', tempDir);
      logTaskCompletion('Task 3', '01-brainstorm', tempDir);

      const log = getTaskLog(tempDir);
      expect(log).toHaveLength(3);
      expect(log.map(t => t.description)).toEqual(['Task 1', 'Task 2', 'Task 3']);
    });

    it('should create snapshot after task_save_frequency tasks', () => {
      // Default task_save_frequency is 5
      for (let i = 1; i <= 5; i++) {
        logTaskCompletion(`Task ${i}`, '01-brainstorm', tempDir);
      }

      const snapshots = listSnapshots(tempDir);
      expect(snapshots.some(s => s.trigger === 'task_complete')).toBe(true);
    });

    it('should create context directory if not exists', () => {
      rmSync(join(tempDir, 'state', 'context'), { recursive: true });

      logTaskCompletion('Task 1', '01-brainstorm', tempDir);

      expect(existsSync(join(tempDir, 'state', 'context'))).toBe(true);
    });
  });

  describe('getTasksSinceLastSnapshot', () => {
    it('should return all tasks when no snapshot exists', () => {
      logTaskCompletion('Task 1', '01-brainstorm', tempDir);
      logTaskCompletion('Task 2', '01-brainstorm', tempDir);

      const count = getTasksSinceLastSnapshot(tempDir);
      expect(count).toBe(2);
    });

    it('should return tasks completed after last snapshot', async () => {
      logTaskCompletion('Task 1', '01-brainstorm', tempDir);
      logTaskCompletion('Task 2', '01-brainstorm', tempDir);

      // Add delay to ensure snapshot timestamp is after task timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
      createSnapshot('manual', {}, tempDir);

      // Add delay to ensure task timestamp is after snapshot timestamp
      await new Promise(resolve => setTimeout(resolve, 100));
      logTaskCompletion('Task 3', '01-brainstorm', tempDir);

      const count = getTasksSinceLastSnapshot(tempDir);
      expect(count).toBe(1);
    });
  });
});

describe('snapshotToMarkdown', () => {
  it('should convert snapshot to markdown format', () => {
    const snapshot: ContextSnapshot = {
      id: 'state_2024-01-01T00-00-00_01',
      createdAt: '2024-01-01T00:00:00.000Z',
      trigger: 'threshold',
      contextState: {
        usagePercent: 55,
        tokensUsed: 110000,
        maxTokens: 200000,
        threshold: 'action',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
      stageId: '01-brainstorm',
      stageName: 'Brainstorming',
      progress: {
        completedTasks: ['Task 1', 'Task 2'],
        inProgressTasks: ['Task 3'],
        pendingTasks: ['Task 4'],
      },
      keyContext: {
        decisions: ['Decision A', 'Decision B'],
        modifiedFiles: ['file1.ts'],
        activeIssues: ['Issue #1'],
      },
      recovery: {
        resumeFrom: '01-brainstorm',
        handoffRef: 'HANDOFF.md',
      },
    };

    const md = snapshotToMarkdown(snapshot);

    expect(md).toContain('# 작업 상태 저장');
    expect(md).toContain('남은 컨텍스트: 45.0%');
    expect(md).toContain('저장 트리거: threshold');
    expect(md).toContain('01-brainstorm: Brainstorming');
    expect(md).toContain('- [x] Task 1');
    expect(md).toContain('- [x] Task 2');
    expect(md).toContain('- [ ] Task 3');
    expect(md).toContain('- Decision A');
    expect(md).toContain('- file1.ts');
    expect(md).toContain('- Issue #1');
    expect(md).toContain('HANDOFF.md 참조');
  });

  it('should handle empty arrays gracefully', () => {
    const snapshot: ContextSnapshot = {
      id: 'state_2024-01-01T00-00-00_01',
      createdAt: '2024-01-01T00:00:00.000Z',
      trigger: 'manual',
      contextState: {
        usagePercent: 20,
        tokensUsed: 40000,
        maxTokens: 200000,
        threshold: 'normal',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
      stageId: '01-brainstorm',
      stageName: 'Brainstorming',
      progress: {
        completedTasks: [],
        inProgressTasks: [],
        pendingTasks: [],
      },
      keyContext: {
        decisions: [],
        modifiedFiles: [],
        activeIssues: [],
      },
      recovery: {
        resumeFrom: '01-brainstorm',
      },
    };

    const md = snapshotToMarkdown(snapshot);

    expect(md).toContain('- (없음)');
    expect(md).toContain('HANDOFF.md 참조'); // Default when no handoffRef
  });
});
