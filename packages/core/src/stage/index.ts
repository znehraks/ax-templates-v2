/**
 * @ax-templates/core - Stage Module
 * Stage management, validation, and lifecycle
 */

// Types
export type {
  StageStatus,
  StageProgress,
  PipelineProgress,
  StageExecutionResult,
  TransitionValidation,
  IOValidation,
  HandoffDocument,
  Checkpoint,
} from './types.js';

// Manager
export {
  PROGRESS_FILE,
  HANDOFF_FILE,
  getProgressPath,
  loadProgress,
  createInitialProgress,
  saveProgress,
  updateStageProgress,
  getAllStages,
  getStage,
  getCurrentStage,
  getNextStage,
  getPreviousStage,
  getFirstStage,
  validateStageInputs,
  validateStageOutputs,
  validateTransition,
  startStage,
  completeStage,
  failStage,
  getStageSummary,
  type StageSummary,
} from './manager.js';

// Handoff
export {
  generateHandoff,
  saveHandoff,
  loadHandoff,
  handoffExists,
  parseHandoff,
  type GenerateHandoffOptions,
} from './handoff.js';

// Checkpoint
export {
  generateCheckpointId,
  getCheckpointsDir,
  getCheckpointPath,
  createCheckpoint,
  listCheckpoints,
  getCheckpoint,
  getCheckpointsForStage,
  getLatestCheckpoint,
  restoreCheckpoint,
  type RestoreResult,
} from './checkpoint.js';
