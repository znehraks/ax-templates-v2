/**
 * @ax-templates/core - Context Manager
 * Manages context usage tracking and compression
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadConfig } from '../config/index.js';
import { getCurrentStage, loadProgress } from '../stage/index.js';
import type {
  ContextState,
  ContextThreshold,
  ContextSnapshot,
  ContextAction,
  TaskCompletion,
} from './types.js';

// ============================================
// Constants
// ============================================

export const CONTEXT_STATE_FILE = 'context_state.json';
export const SNAPSHOT_PREFIX = 'state_';
export const TASK_LOG_FILE = 'task_log.json';

// Default max tokens (Claude)
export const DEFAULT_MAX_TOKENS = 200000;

// ============================================
// Context State Management
// ============================================

/**
 * Gets the context state directory
 */
export function getContextDir(projectDir: string = process.cwd()): string {
  const config = loadConfig({ projectDir });
  return join(projectDir, config.paths.state, 'context');
}

/**
 * Gets the current context state
 */
export function getContextState(projectDir: string = process.cwd()): ContextState | null {
  const statePath = join(getContextDir(projectDir), CONTEXT_STATE_FILE);

  if (!existsSync(statePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Updates the context state
 */
export function updateContextState(
  state: Partial<ContextState>,
  projectDir: string = process.cwd()
): ContextState {
  const contextDir = getContextDir(projectDir);
  if (!existsSync(contextDir)) {
    mkdirSync(contextDir, { recursive: true });
  }

  const current = getContextState(projectDir) ?? {
    usagePercent: 0,
    tokensUsed: 0,
    maxTokens: DEFAULT_MAX_TOKENS,
    threshold: 'normal' as ContextThreshold,
    timestamp: new Date().toISOString(),
  };

  const updated: ContextState = {
    ...current,
    ...state,
    timestamp: new Date().toISOString(),
  };

  // Recalculate threshold
  updated.threshold = calculateThreshold(updated.usagePercent, projectDir);

  const statePath = join(contextDir, CONTEXT_STATE_FILE);
  writeFileSync(statePath, JSON.stringify(updated, null, 2));

  return updated;
}

/**
 * Calculates the threshold level based on remaining context percentage
 */
export function calculateThreshold(
  usagePercent: number,
  projectDir: string = process.cwd()
): ContextThreshold {
  const config = loadConfig({ projectDir });
  const remaining = 100 - usagePercent;

  if (remaining <= config.context.critical) {
    return 'critical';
  }
  if (remaining <= config.context.action) {
    return 'action';
  }
  if (remaining <= config.context.warning) {
    return 'warning';
  }
  return 'normal';
}

/**
 * Gets remaining context percentage
 */
export function getRemainingContext(projectDir: string = process.cwd()): number {
  const state = getContextState(projectDir);
  if (!state) return 100;
  return 100 - state.usagePercent;
}

// ============================================
// Context Actions
// ============================================

/**
 * Gets recommended actions based on current context state
 */
export function getRecommendedActions(
  projectDir: string = process.cwd()
): ContextAction[] {
  const state = getContextState(projectDir);
  if (!state) return [];

  const config = loadConfig({ projectDir });
  const remaining = 100 - state.usagePercent;
  const actions: ContextAction[] = [];

  if (state.threshold === 'warning') {
    actions.push({
      type: 'display_banner',
      message: `⚠️ Context Warning: ${remaining.toFixed(1)}% remaining`,
      priority: 'warning',
    });
  }

  if (state.threshold === 'action') {
    actions.push({
      type: 'save_snapshot',
      message: `💾 Auto-saving context state (${remaining.toFixed(1)}% remaining)`,
      priority: 'warning',
    });
    actions.push({
      type: 'suggest_compress',
      message: '📦 Consider compressing context with /context compress',
      priority: 'warning',
    });
  }

  if (state.threshold === 'critical') {
    actions.push({
      type: 'save_snapshot',
      message: `🚨 Critical: Force-saving context state (${remaining.toFixed(1)}% remaining)`,
      priority: 'critical',
    });
    actions.push({
      type: 'prompt_confirm',
      message: '⚠️ Context nearly exhausted. Clear context with /clear?',
      priority: 'critical',
    });
  }

  return actions;
}

/**
 * Formats context status for display
 */
export function formatContextStatus(projectDir: string = process.cwd()): string {
  const state = getContextState(projectDir);
  if (!state) {
    return '[Context: Unknown]';
  }

  const remaining = 100 - state.usagePercent;
  const tokensK = Math.round(state.tokensUsed / 1000);

  let icon = '🟢';
  if (state.threshold === 'warning') icon = '🟡';
  if (state.threshold === 'action') icon = '🟠';
  if (state.threshold === 'critical') icon = '🔴';

  return `[${icon} Context: ${remaining.toFixed(0)}% | ${tokensK}k tokens]`;
}

// ============================================
// Context Snapshots
// ============================================

/**
 * Generates a snapshot ID
 */
export function generateSnapshotId(stageId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const shortStage = stageId.split('-')[0];
  return `${SNAPSHOT_PREFIX}${timestamp}_${shortStage}`;
}

/**
 * Creates a context snapshot
 */
export function createSnapshot(
  trigger: ContextSnapshot['trigger'],
  options: {
    completedTasks?: string[];
    inProgressTasks?: string[];
    pendingTasks?: string[];
    decisions?: string[];
    modifiedFiles?: string[];
    activeIssues?: string[];
    handoffRef?: string;
    checkpointRef?: string;
  } = {},
  projectDir: string = process.cwd()
): ContextSnapshot {
  const contextDir = getContextDir(projectDir);
  if (!existsSync(contextDir)) {
    mkdirSync(contextDir, { recursive: true });
  }

  const state = getContextState(projectDir) ?? {
    usagePercent: 0,
    tokensUsed: 0,
    maxTokens: DEFAULT_MAX_TOKENS,
    threshold: 'normal' as ContextThreshold,
    timestamp: new Date().toISOString(),
  };

  const currentStage = getCurrentStage(projectDir);
  const stageId = currentStage?.id ?? 'unknown';
  const stageName = currentStage?.name ?? 'Unknown Stage';

  const snapshot: ContextSnapshot = {
    id: generateSnapshotId(stageId),
    createdAt: new Date().toISOString(),
    trigger,
    contextState: state,
    stageId,
    stageName,
    progress: {
      completedTasks: options.completedTasks ?? [],
      inProgressTasks: options.inProgressTasks ?? [],
      pendingTasks: options.pendingTasks ?? [],
    },
    keyContext: {
      decisions: options.decisions ?? [],
      modifiedFiles: options.modifiedFiles ?? [],
      activeIssues: options.activeIssues ?? [],
    },
    recovery: {
      resumeFrom: stageId,
      handoffRef: options.handoffRef,
      checkpointRef: options.checkpointRef,
    },
  };

  // Save snapshot
  const snapshotPath = join(contextDir, `${snapshot.id}.json`);
  writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

  return snapshot;
}

/**
 * Lists all context snapshots
 */
export function listSnapshots(projectDir: string = process.cwd()): ContextSnapshot[] {
  const contextDir = getContextDir(projectDir);

  if (!existsSync(contextDir)) {
    return [];
  }

  const snapshots: ContextSnapshot[] = [];
  const files = readdirSync(contextDir);

  for (const file of files) {
    if (file.startsWith(SNAPSHOT_PREFIX) && file.endsWith('.json')) {
      try {
        const content = readFileSync(join(contextDir, file), 'utf-8');
        snapshots.push(JSON.parse(content));
      } catch {
        // Skip invalid snapshots
      }
    }
  }

  // Sort by creation date (newest first)
  snapshots.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return snapshots;
}

/**
 * Gets the latest snapshot
 */
export function getLatestSnapshot(projectDir: string = process.cwd()): ContextSnapshot | null {
  const snapshots = listSnapshots(projectDir);
  return snapshots[0] ?? null;
}

// ============================================
// Task Completion Tracking
// ============================================

/**
 * Gets task completion log
 */
export function getTaskLog(projectDir: string = process.cwd()): TaskCompletion[] {
  const logPath = join(getContextDir(projectDir), TASK_LOG_FILE);

  if (!existsSync(logPath)) {
    return [];
  }

  try {
    return JSON.parse(readFileSync(logPath, 'utf-8'));
  } catch {
    return [];
  }
}

/**
 * Logs a completed task
 */
export function logTaskCompletion(
  description: string,
  stageId: string,
  projectDir: string = process.cwd()
): TaskCompletion {
  const contextDir = getContextDir(projectDir);
  if (!existsSync(contextDir)) {
    mkdirSync(contextDir, { recursive: true });
  }

  const log = getTaskLog(projectDir);
  const task: TaskCompletion = {
    taskId: `task-${Date.now()}`,
    description,
    completedAt: new Date().toISOString(),
    stageId,
  };

  log.push(task);

  const logPath = join(contextDir, TASK_LOG_FILE);
  writeFileSync(logPath, JSON.stringify(log, null, 2));

  // Check if we need to auto-save based on task frequency
  const config = loadConfig({ projectDir });
  if (log.length % config.context.task_save_frequency === 0) {
    createSnapshot('task_complete', {
      completedTasks: log.slice(-config.context.task_save_frequency).map(t => t.description),
    }, projectDir);
  }

  return task;
}

/**
 * Counts tasks completed since last snapshot
 */
export function getTasksSinceLastSnapshot(projectDir: string = process.cwd()): number {
  const log = getTaskLog(projectDir);
  const lastSnapshot = getLatestSnapshot(projectDir);

  if (!lastSnapshot) {
    return log.length;
  }

  return log.filter(t =>
    new Date(t.completedAt) > new Date(lastSnapshot.createdAt)
  ).length;
}

// ============================================
// Snapshot to Markdown
// ============================================

/**
 * Converts a snapshot to markdown format for HANDOFF
 */
export function snapshotToMarkdown(snapshot: ContextSnapshot): string {
  return `# 작업 상태 저장 - ${snapshot.createdAt}

## 컨텍스트 상태
- 남은 컨텍스트: ${(100 - snapshot.contextState.usagePercent).toFixed(1)}%
- 저장 트리거: ${snapshot.trigger}

## 현재 스테이지
${snapshot.stageId}: ${snapshot.stageName}

## 진행 상황
### 완료
${snapshot.progress.completedTasks.map(t => `- [x] ${t}`).join('\n') || '- (없음)'}

### 진행 중
${snapshot.progress.inProgressTasks.map(t => `- [ ] ${t}`).join('\n') || '- (없음)'}

### 대기
${snapshot.progress.pendingTasks.map(t => `- [ ] ${t}`).join('\n') || '- (없음)'}

## 핵심 컨텍스트
### 주요 결정사항
${snapshot.keyContext.decisions.map(d => `- ${d}`).join('\n') || '- (없음)'}

### 수정된 파일
${snapshot.keyContext.modifiedFiles.map(f => `- ${f}`).join('\n') || '- (없음)'}

### 활성 이슈
${snapshot.keyContext.activeIssues.map(i => `- ${i}`).join('\n') || '- (없음)'}

## 복구 지침
1. 이 파일 읽기
2. ${snapshot.recovery.handoffRef ? `${snapshot.recovery.handoffRef} 참조` : 'HANDOFF.md 참조'}
3. ${snapshot.stageId}의 ${snapshot.progress.inProgressTasks[0] ?? '마지막 작업'}부터 재개
`;
}
