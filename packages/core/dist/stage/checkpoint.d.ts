/**
 * @ax-templates/core - Checkpoint Manager
 * Creates and manages checkpoints for stage rollback
 */
import type { Checkpoint } from './types.js';
/**
 * Generates a unique checkpoint ID
 */
export declare function generateCheckpointId(stageId: string): string;
/**
 * Gets the checkpoints directory path
 */
export declare function getCheckpointsDir(projectDir?: string): string;
/**
 * Gets the path for a specific checkpoint
 */
export declare function getCheckpointPath(checkpointId: string, projectDir?: string): string;
/**
 * Creates a checkpoint for the current state
 */
export declare function createCheckpoint(stageId: string, description?: string, projectDir?: string): Checkpoint;
/**
 * Lists all checkpoints
 */
export declare function listCheckpoints(projectDir?: string): Checkpoint[];
/**
 * Gets a specific checkpoint
 */
export declare function getCheckpoint(checkpointId: string, projectDir?: string): Checkpoint | null;
/**
 * Gets checkpoints for a specific stage
 */
export declare function getCheckpointsForStage(stageId: string, projectDir?: string): Checkpoint[];
/**
 * Gets the latest checkpoint for a stage
 */
export declare function getLatestCheckpoint(stageId: string, projectDir?: string): Checkpoint | null;
export interface RestoreResult {
    success: boolean;
    checkpoint: Checkpoint;
    restoredFiles: string[];
    errors: string[];
}
/**
 * Restores a checkpoint
 */
export declare function restoreCheckpoint(checkpointId: string, projectDir?: string): RestoreResult;
//# sourceMappingURL=checkpoint.d.ts.map