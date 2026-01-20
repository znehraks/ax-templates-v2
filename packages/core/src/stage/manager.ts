/**
 * @ax-templates/core - Stage Manager
 * Manages stage execution, transitions, and validation
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadConfig, loadPipelineConfig, type StageDefinition } from '../config/index.js';
import type {
  StageProgress,
  PipelineProgress,
  StageExecutionResult,
  TransitionValidation,
  IOValidation,
  HandoffDocument,
  Checkpoint,
} from './types.js';

// ============================================
// Constants
// ============================================

export const PROGRESS_FILE = 'progress.json';
export const HANDOFF_FILE = 'HANDOFF.md';

// ============================================
// Progress Management
// ============================================

/**
 * Gets the progress file path
 */
export function getProgressPath(projectDir: string = process.cwd()): string {
  const config = loadConfig({ projectDir });
  return join(projectDir, config.paths.state, PROGRESS_FILE);
}

/**
 * Loads pipeline progress from file
 */
export function loadProgress(projectDir: string = process.cwd()): PipelineProgress {
  const progressPath = getProgressPath(projectDir);

  if (!existsSync(progressPath)) {
    return createInitialProgress();
  }

  try {
    const content = readFileSync(progressPath, 'utf-8');
    return JSON.parse(content) as PipelineProgress;
  } catch {
    return createInitialProgress();
  }
}

/**
 * Creates initial progress state
 */
export function createInitialProgress(): PipelineProgress {
  return {
    currentStage: null,
    stages: {},
    lastUpdated: new Date().toISOString(),
    version: '2.0.0',
  };
}

/**
 * Saves pipeline progress to file
 */
export function saveProgress(progress: PipelineProgress, projectDir: string = process.cwd()): void {
  const progressPath = getProgressPath(projectDir);
  const dir = dirname(progressPath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  progress.lastUpdated = new Date().toISOString();
  writeFileSync(progressPath, JSON.stringify(progress, null, 2));
}

/**
 * Updates stage progress
 */
export function updateStageProgress(
  stageId: string,
  update: Partial<StageProgress>,
  projectDir: string = process.cwd()
): PipelineProgress {
  const progress = loadProgress(projectDir);

  progress.stages[stageId] = {
    ...progress.stages[stageId],
    stageId,
    ...update,
  };

  saveProgress(progress, projectDir);
  return progress;
}

// ============================================
// Stage Navigation
// ============================================

/**
 * Gets all stages from pipeline configuration
 */
export function getAllStages(projectDir: string = process.cwd()): StageDefinition[] {
  const pipeline = loadPipelineConfig(projectDir);
  return pipeline.stages;
}

/**
 * Gets a stage by ID
 */
export function getStage(stageId: string, projectDir: string = process.cwd()): StageDefinition | undefined {
  const stages = getAllStages(projectDir);
  return stages.find(s => s.id === stageId);
}

/**
 * Gets the current stage
 */
export function getCurrentStage(projectDir: string = process.cwd()): StageDefinition | null {
  const progress = loadProgress(projectDir);
  if (!progress.currentStage) return null;
  return getStage(progress.currentStage, projectDir) ?? null;
}

/**
 * Gets the next stage after the given stage
 */
export function getNextStage(currentStageId: string, projectDir: string = process.cwd()): StageDefinition | null {
  const stages = getAllStages(projectDir);
  const currentIndex = stages.findIndex(s => s.id === currentStageId);

  if (currentIndex === -1 || currentIndex >= stages.length - 1) {
    return null;
  }

  return stages[currentIndex + 1];
}

/**
 * Gets the previous stage
 */
export function getPreviousStage(currentStageId: string, projectDir: string = process.cwd()): StageDefinition | null {
  const stages = getAllStages(projectDir);
  const currentIndex = stages.findIndex(s => s.id === currentStageId);

  if (currentIndex <= 0) {
    return null;
  }

  return stages[currentIndex - 1];
}

/**
 * Gets the first stage
 */
export function getFirstStage(projectDir: string = process.cwd()): StageDefinition {
  const stages = getAllStages(projectDir);
  return stages[0];
}

// ============================================
// Stage Validation
// ============================================

/**
 * Validates stage inputs exist
 */
export function validateStageInputs(
  stageId: string,
  projectDir: string = process.cwd()
): IOValidation {
  const stage = getStage(stageId, projectDir);
  if (!stage) {
    return { valid: false, missing: [], present: [] };
  }

  const config = loadConfig({ projectDir });
  const prevStage = getPreviousStage(stageId, projectDir);
  const inputsDir = prevStage
    ? join(projectDir, config.paths.stages_output, prevStage.id, 'outputs')
    : join(projectDir, config.paths.stages_output, stageId, 'inputs');

  const missing: string[] = [];
  const present: string[] = [];

  for (const input of stage.inputs) {
    const inputPath = join(inputsDir, input);
    if (existsSync(inputPath)) {
      present.push(input);
    } else {
      missing.push(input);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
  };
}

/**
 * Validates stage outputs exist
 */
export function validateStageOutputs(
  stageId: string,
  projectDir: string = process.cwd()
): IOValidation {
  const stage = getStage(stageId, projectDir);
  if (!stage) {
    return { valid: false, missing: [], present: [] };
  }

  const config = loadConfig({ projectDir });
  const outputsDir = join(projectDir, config.paths.stages_output, stageId, 'outputs');

  const missing: string[] = [];
  const present: string[] = [];

  for (const output of stage.outputs) {
    const outputPath = join(outputsDir, output);
    if (existsSync(outputPath)) {
      present.push(output);
    } else {
      missing.push(output);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
  };
}

/**
 * Validates a stage transition
 */
export function validateTransition(
  fromStageId: string,
  toStageId: string,
  projectDir: string = process.cwd()
): TransitionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const pipeline = loadPipelineConfig(projectDir);
  const fromStage = getStage(fromStageId, projectDir);
  const toStage = getStage(toStageId, projectDir);

  // Check stages exist
  if (!fromStage) {
    errors.push(`Source stage not found: ${fromStageId}`);
  }
  if (!toStage) {
    errors.push(`Target stage not found: ${toStageId}`);
  }

  if (errors.length > 0) {
    return { valid: false, fromStage: fromStageId, toStage: toStageId, errors, warnings };
  }

  // Check outputs exist
  const outputValidation = validateStageOutputs(fromStageId, projectDir);
  if (!outputValidation.valid) {
    errors.push(`Missing outputs: ${outputValidation.missing.join(', ')}`);
  }

  // Check HANDOFF.md exists
  const config = loadConfig({ projectDir });
  const handoffPath = join(projectDir, config.paths.stages_output, fromStageId, HANDOFF_FILE);
  if (!existsSync(handoffPath)) {
    errors.push('HANDOFF.md not found - required for stage transition');
  }

  // Check checkpoint for stages that require it
  if (fromStage!.checkpoint_required) {
    const progress = loadProgress(projectDir);
    const stageProgress = progress.stages[fromStageId];
    if (!stageProgress?.checkpointId) {
      warnings.push('Checkpoint recommended for this stage but not created');
    }
  }

  // Check sequential order
  const stages = getAllStages(projectDir);
  const fromIndex = stages.findIndex(s => s.id === fromStageId);
  const toIndex = stages.findIndex(s => s.id === toStageId);

  if (toIndex !== fromIndex + 1) {
    warnings.push(`Non-sequential transition: skipping ${toIndex - fromIndex - 1} stage(s)`);
  }

  return {
    valid: errors.length === 0,
    fromStage: fromStageId,
    toStage: toStageId,
    errors,
    warnings,
  };
}

// ============================================
// Stage Execution
// ============================================

/**
 * Starts a stage
 */
export function startStage(stageId: string, projectDir: string = process.cwd()): StageProgress {
  const stage = getStage(stageId, projectDir);
  if (!stage) {
    throw new Error(`Stage not found: ${stageId}`);
  }

  const progress = loadProgress(projectDir);
  progress.currentStage = stageId;

  const stageProgress: StageProgress = {
    stageId,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
  };

  progress.stages[stageId] = stageProgress;
  saveProgress(progress, projectDir);

  return stageProgress;
}

/**
 * Completes a stage
 */
export function completeStage(
  stageId: string,
  outputs: string[] = [],
  checkpointId?: string,
  projectDir: string = process.cwd()
): StageProgress {
  const progress = loadProgress(projectDir);

  const stageProgress: StageProgress = {
    ...progress.stages[stageId],
    stageId,
    status: 'completed',
    completedAt: new Date().toISOString(),
    outputs,
    checkpointId,
  };

  progress.stages[stageId] = stageProgress;
  saveProgress(progress, projectDir);

  return stageProgress;
}

/**
 * Fails a stage
 */
export function failStage(
  stageId: string,
  error: string,
  projectDir: string = process.cwd()
): StageProgress {
  const progress = loadProgress(projectDir);

  const stageProgress: StageProgress = {
    ...progress.stages[stageId],
    stageId,
    status: 'failed',
    completedAt: new Date().toISOString(),
    error,
  };

  progress.stages[stageId] = stageProgress;
  saveProgress(progress, projectDir);

  return stageProgress;
}

// ============================================
// Stage Summary
// ============================================

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
export function getStageSummary(projectDir: string = process.cwd()): StageSummary {
  const progress = loadProgress(projectDir);
  const stages = getAllStages(projectDir);

  let completed = 0;
  let inProgress = 0;
  let failed = 0;
  let skipped = 0;

  for (const stage of stages) {
    const stageProgress = progress.stages[stage.id];
    if (!stageProgress) continue;

    switch (stageProgress.status) {
      case 'completed':
        completed++;
        break;
      case 'in_progress':
        inProgress++;
        break;
      case 'failed':
        failed++;
        break;
      case 'skipped':
        skipped++;
        break;
    }
  }

  const pending = stages.length - completed - inProgress - failed - skipped;

  let nextStage: string | null = null;
  if (progress.currentStage) {
    const next = getNextStage(progress.currentStage, projectDir);
    nextStage = next?.id ?? null;
  } else if (completed === 0 && inProgress === 0) {
    nextStage = stages[0]?.id ?? null;
  }

  return {
    total: stages.length,
    completed,
    inProgress,
    pending,
    failed,
    skipped,
    currentStage: progress.currentStage,
    nextStage,
  };
}
