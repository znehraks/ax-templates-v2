/**
 * @ax-templates/core - Stage Module
 * Stage management, validation, and lifecycle
 */
// Manager
export { PROGRESS_FILE, HANDOFF_FILE, getProgressPath, loadProgress, createInitialProgress, saveProgress, updateStageProgress, getAllStages, getStage, getCurrentStage, getNextStage, getPreviousStage, getFirstStage, validateStageInputs, validateStageOutputs, validateTransition, startStage, completeStage, failStage, getStageSummary, } from './manager.js';
// Handoff
export { generateHandoff, saveHandoff, loadHandoff, handoffExists, parseHandoff, } from './handoff.js';
// Checkpoint
export { generateCheckpointId, getCheckpointsDir, getCheckpointPath, createCheckpoint, listCheckpoints, getCheckpoint, getCheckpointsForStage, getLatestCheckpoint, restoreCheckpoint, } from './checkpoint.js';
//# sourceMappingURL=index.js.map