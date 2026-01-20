/**
 * @ax-templates/core - Stage Manager
 * Manages stage execution, transitions, and validation
 */
import { type StageDefinition } from '../config/index.js';
import type { StageProgress, PipelineProgress, TransitionValidation, IOValidation } from './types.js';
export declare const PROGRESS_FILE = "progress.json";
export declare const HANDOFF_FILE = "HANDOFF.md";
/**
 * Gets the progress file path
 */
export declare function getProgressPath(projectDir?: string): string;
/**
 * Loads pipeline progress from file
 */
export declare function loadProgress(projectDir?: string): PipelineProgress;
/**
 * Creates initial progress state
 */
export declare function createInitialProgress(): PipelineProgress;
/**
 * Saves pipeline progress to file
 */
export declare function saveProgress(progress: PipelineProgress, projectDir?: string): void;
/**
 * Updates stage progress
 */
export declare function updateStageProgress(stageId: string, update: Partial<StageProgress>, projectDir?: string): PipelineProgress;
/**
 * Gets all stages from pipeline configuration
 */
export declare function getAllStages(projectDir?: string): StageDefinition[];
/**
 * Gets a stage by ID
 */
export declare function getStage(stageId: string, projectDir?: string): StageDefinition | undefined;
/**
 * Gets the current stage
 */
export declare function getCurrentStage(projectDir?: string): StageDefinition | null;
/**
 * Gets the next stage after the given stage
 */
export declare function getNextStage(currentStageId: string, projectDir?: string): StageDefinition | null;
/**
 * Gets the previous stage
 */
export declare function getPreviousStage(currentStageId: string, projectDir?: string): StageDefinition | null;
/**
 * Gets the first stage
 */
export declare function getFirstStage(projectDir?: string): StageDefinition;
/**
 * Validates stage inputs exist
 */
export declare function validateStageInputs(stageId: string, projectDir?: string): IOValidation;
/**
 * Validates stage outputs exist
 */
export declare function validateStageOutputs(stageId: string, projectDir?: string): IOValidation;
/**
 * Validates a stage transition
 */
export declare function validateTransition(fromStageId: string, toStageId: string, projectDir?: string): TransitionValidation;
/**
 * Starts a stage
 */
export declare function startStage(stageId: string, projectDir?: string): StageProgress;
/**
 * Completes a stage
 */
export declare function completeStage(stageId: string, outputs?: string[], checkpointId?: string, projectDir?: string): StageProgress;
/**
 * Fails a stage
 */
export declare function failStage(stageId: string, error: string, projectDir?: string): StageProgress;
export interface StageSummary {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    failed: number;
    skipped: number;
    currentStage: string | null;
    nextStage: string | null;
}
/**
 * Gets a summary of pipeline progress
 */
export declare function getStageSummary(projectDir?: string): StageSummary;
//# sourceMappingURL=manager.d.ts.map