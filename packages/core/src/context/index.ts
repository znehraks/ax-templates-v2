/**
 * @ax-templates/core - Context Module
 * Context usage tracking, compression, and state management
 */

// Types
export type {
  ContextThreshold,
  ContextState,
  ContextSnapshot,
  CompressionStrategy,
  ContextAction,
  TaskCompletion,
} from './types.js';

// Manager
export {
  CONTEXT_STATE_FILE,
  SNAPSHOT_PREFIX,
  TASK_LOG_FILE,
  DEFAULT_MAX_TOKENS,
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
} from './manager.js';
