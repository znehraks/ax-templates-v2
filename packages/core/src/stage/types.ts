/**
 * @ax-templates/core - Stage Types
 * Type definitions for stage management
 */

/** Stage execution status */
export type StageStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'skipped';

/** Stage progress information */
export interface StageProgress {
  stageId: string;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  checkpointId?: string;
  outputs?: string[];
}

/** Pipeline progress state */
export interface PipelineProgress {
  currentStage: string | null;
  stages: Record<string, StageProgress>;
  lastUpdated: string;
  version: string;
}

/** Stage execution result */
export interface StageExecutionResult {
  success: boolean;
  stageId: string;
  duration: number;
  outputs: string[];
  handoffPath?: string;
  checkpointId?: string;
  error?: string;
}

/** Stage transition validation result */
export interface TransitionValidation {
  valid: boolean;
  fromStage: string;
  toStage: string;
  errors: string[];
  warnings: string[];
}

/** Stage input/output validation */
export interface IOValidation {
  valid: boolean;
  missing: string[];
  present: string[];
}

/** Handoff document structure */
export interface HandoffDocument {
  stageId: string;
  stageName: string;
  completedAt: string;

  // Summary
  summary: {
    completedTasks: string[];
    keyDecisions: string[];
    successfulApproaches: string[];
    failedApproaches: string[];
  };

  // Outputs
  outputs: {
    path: string;
    description?: string;
  }[];

  // Next stage
  nextStage: {
    id: string;
    name: string;
    immediateActions: string[];
    prerequisites: string[];
  };

  // Context
  context: {
    checkpointRef?: string;
    aiCalls?: {
      model: string;
      time: string;
      prompt: string;
      result: string;
      status: 'success' | 'failure';
    }[];
  };
}

/** Checkpoint data */
export interface Checkpoint {
  id: string;
  stageId: string;
  createdAt: string;
  description?: string;
  gitRef?: string;
  files: string[];
}
