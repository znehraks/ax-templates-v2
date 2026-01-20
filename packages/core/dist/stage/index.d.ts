/**
 * @ax-templates/core - Stage Module
 * Stage management, validation, and lifecycle
 */
export type { StageStatus, StageProgress, PipelineProgress, StageExecutionResult, TransitionValidation, IOValidation, HandoffDocument, Checkpoint, } from './types.js';
export { PROGRESS_FILE, HANDOFF_FILE, getProgressPath, loadProgress, createInitialProgress, saveProgress, updateStageProgress, getAllStages, getStage, getCurrentStage, getNextStage, getPreviousStage, getFirstStage, validateStageInputs, validateStageOutputs, validateTransition, startStage, completeStage, failStage, getStageSummary, type StageSummary, } from './manager.js';
export { generateHandoff, saveHandoff, loadHandoff, handoffExists, parseHandoff, type GenerateHandoffOptions, } from './handoff.js';
export { generateCheckpointId, getCheckpointsDir, getCheckpointPath, createCheckpoint, listCheckpoints, getCheckpoint, getCheckpointsForStage, getLatestCheckpoint, restoreCheckpoint, type RestoreResult, } from './checkpoint.js';
//# sourceMappingURL=index.d.ts.map