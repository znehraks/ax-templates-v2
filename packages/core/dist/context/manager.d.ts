/**
 * @ax-templates/core - Context Manager
 * Manages context usage tracking and compression
 */
import type { ContextState, ContextThreshold, ContextSnapshot, ContextAction, TaskCompletion } from './types.js';
export declare const CONTEXT_STATE_FILE = "context_state.json";
export declare const SNAPSHOT_PREFIX = "state_";
export declare const TASK_LOG_FILE = "task_log.json";
export declare const DEFAULT_MAX_TOKENS = 200000;
/**
 * Gets the context state directory
 */
export declare function getContextDir(projectDir?: string): string;
/**
 * Gets the current context state
 */
export declare function getContextState(projectDir?: string): ContextState | null;
/**
 * Updates the context state
 */
export declare function updateContextState(state: Partial<ContextState>, projectDir?: string): ContextState;
/**
 * Calculates the threshold level based on remaining context percentage
 */
export declare function calculateThreshold(usagePercent: number, projectDir?: string): ContextThreshold;
/**
 * Gets remaining context percentage
 */
export declare function getRemainingContext(projectDir?: string): number;
/**
 * Gets recommended actions based on current context state
 */
export declare function getRecommendedActions(projectDir?: string): ContextAction[];
/**
 * Formats context status for display
 */
export declare function formatContextStatus(projectDir?: string): string;
/**
 * Generates a snapshot ID
 */
export declare function generateSnapshotId(stageId: string): string;
/**
 * Creates a context snapshot
 */
export declare function createSnapshot(trigger: ContextSnapshot['trigger'], options?: {
    completedTasks?: string[];
    inProgressTasks?: string[];
    pendingTasks?: string[];
    decisions?: string[];
    modifiedFiles?: string[];
    activeIssues?: string[];
    handoffRef?: string;
    checkpointRef?: string;
}, projectDir?: string): ContextSnapshot;
/**
 * Lists all context snapshots
 */
export declare function listSnapshots(projectDir?: string): ContextSnapshot[];
/**
 * Gets the latest snapshot
 */
export declare function getLatestSnapshot(projectDir?: string): ContextSnapshot | null;
/**
 * Gets task completion log
 */
export declare function getTaskLog(projectDir?: string): TaskCompletion[];
/**
 * Logs a completed task
 */
export declare function logTaskCompletion(description: string, stageId: string, projectDir?: string): TaskCompletion;
/**
 * Counts tasks completed since last snapshot
 */
export declare function getTasksSinceLastSnapshot(projectDir?: string): number;
/**
 * Converts a snapshot to markdown format for HANDOFF
 */
export declare function snapshotToMarkdown(snapshot: ContextSnapshot): string;
//# sourceMappingURL=manager.d.ts.map