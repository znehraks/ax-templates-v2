/**
 * @ax-templates/core - Stage Manager Tests
 * Tests for stage management functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stringify as yamlStringify } from 'yaml';
import {
  loadProgress,
  saveProgress,
  updateStageProgress,
  createInitialProgress,
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
  getProgressPath,
  PROGRESS_FILE,
  HANDOFF_FILE,
} from '../manager.js';
import type { PipelineProgress, StageProgress } from '../types.js';

// Test helpers
let tempDir: string;

function createTempDir(): string {
  const dir = join(tmpdir(), `ax-stage-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanupDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function setupTestProject(dir: string, options: { stages?: number } = {}): void {
  const { stages = 3 } = options;

  // Create directory structure
  mkdirSync(join(dir, 'state'), { recursive: true });
  mkdirSync(join(dir, 'config'), { recursive: true });

  // Create .ax-config.yaml
  const config = {
    ax_templates: { version: '2.0.0' },
    paths: {
      project_root: './',
      stages_output: './stages',
      state: './state',
      checkpoints: './state/checkpoints',
    },
  };
  writeFileSync(join(dir, '.ax-config.yaml'), yamlStringify(config));

  // Create pipeline.yaml
  const allStages = [
    {
      id: '01-brainstorm',
      name: 'Brainstorming',
      models: ['gemini'],
      mode: 'yolo',
      inputs: ['project_brief.md'],
      outputs: ['ideas.md', 'HANDOFF.md'],
      timeout: 3600,
    },
    {
      id: '02-research',
      name: 'Research',
      models: ['claude'],
      mode: 'plan',
      inputs: ['ideas.md'],
      outputs: ['research.md', 'HANDOFF.md'],
      timeout: 7200,
    },
    {
      id: '03-planning',
      name: 'Planning',
      models: ['gemini'],
      mode: 'plan',
      inputs: ['research.md'],
      outputs: ['architecture.md', 'HANDOFF.md'],
      timeout: 3600,
      checkpoint_required: true,
    },
  ];

  const pipeline = {
    name: 'Test Pipeline',
    version: '1.0.0',
    stages: allStages.slice(0, stages),
  };
  writeFileSync(join(dir, 'config', 'pipeline.yaml'), yamlStringify(pipeline));
}

function createStageOutputs(dir: string, stageId: string, files: string[]): void {
  const stageDir = join(dir, 'stages', stageId);
  const outputDir = join(stageDir, 'outputs');
  mkdirSync(outputDir, { recursive: true });
  for (const file of files) {
    // All output files go in outputs/ for validateStageOutputs
    writeFileSync(join(outputDir, file), `# ${file}\nTest content`);
    if (file === 'HANDOFF.md') {
      // HANDOFF.md also goes at stage root for validateTransition
      writeFileSync(join(stageDir, file), `# ${file}\nTest content`);
    }
  }
}

describe('Progress Management', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  describe('createInitialProgress', () => {
    it('should create initial progress with correct structure', () => {
      const progress = createInitialProgress();

      expect(progress.currentStage).toBeNull();
      expect(progress.stages).toEqual({});
      expect(progress.version).toBe('2.0.0');
      expect(progress.lastUpdated).toBeDefined();
    });
  });

  describe('loadProgress', () => {
    it('should return initial progress when file does not exist', () => {
      const progress = loadProgress(tempDir);

      expect(progress.currentStage).toBeNull();
      expect(progress.stages).toEqual({});
    });

    it('should load existing progress from file', () => {
      const existingProgress: PipelineProgress = {
        currentStage: '01-brainstorm',
        stages: {
          '01-brainstorm': {
            stageId: '01-brainstorm',
            status: 'in_progress',
            startedAt: '2024-01-01T00:00:00.000Z',
          },
        },
        lastUpdated: '2024-01-01T00:00:00.000Z',
        version: '2.0.0',
      };

      writeFileSync(
        join(tempDir, 'state', PROGRESS_FILE),
        JSON.stringify(existingProgress, null, 2)
      );

      const progress = loadProgress(tempDir);

      expect(progress.currentStage).toBe('01-brainstorm');
      expect(progress.stages['01-brainstorm'].status).toBe('in_progress');
    });
  });

  describe('saveProgress', () => {
    it('should save progress to file', () => {
      const progress: PipelineProgress = {
        currentStage: '01-brainstorm',
        stages: {},
        lastUpdated: '',
        version: '2.0.0',
      };

      saveProgress(progress, tempDir);

      const filePath = join(tempDir, 'state', PROGRESS_FILE);
      expect(existsSync(filePath)).toBe(true);

      const saved = JSON.parse(readFileSync(filePath, 'utf-8'));
      expect(saved.currentStage).toBe('01-brainstorm');
      expect(saved.lastUpdated).toBeDefined();
    });

    it('should create state directory if not exists', () => {
      const newDir = join(tempDir, 'new-project');
      mkdirSync(newDir);
      writeFileSync(join(newDir, '.ax-config.yaml'), yamlStringify({
        paths: { state: './state' },
      }));

      const progress: PipelineProgress = {
        currentStage: null,
        stages: {},
        lastUpdated: '',
        version: '2.0.0',
      };

      saveProgress(progress, newDir);

      expect(existsSync(join(newDir, 'state', PROGRESS_FILE))).toBe(true);
    });
  });

  describe('updateStageProgress', () => {
    it('should update specific stage progress', () => {
      const progress = updateStageProgress('01-brainstorm', {
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      }, tempDir);

      expect(progress.stages['01-brainstorm'].status).toBe('in_progress');
      expect(progress.stages['01-brainstorm'].stageId).toBe('01-brainstorm');
    });

    it('should merge with existing stage progress', () => {
      updateStageProgress('01-brainstorm', {
        status: 'in_progress',
        startedAt: '2024-01-01T00:00:00.000Z',
      }, tempDir);

      const progress = updateStageProgress('01-brainstorm', {
        status: 'completed',
        completedAt: '2024-01-01T01:00:00.000Z',
      }, tempDir);

      expect(progress.stages['01-brainstorm'].startedAt).toBe('2024-01-01T00:00:00.000Z');
      expect(progress.stages['01-brainstorm'].status).toBe('completed');
      expect(progress.stages['01-brainstorm'].completedAt).toBe('2024-01-01T01:00:00.000Z');
    });
  });
});

describe('Stage Navigation', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir, { stages: 3 });
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  describe('getAllStages', () => {
    it('should return all stages from pipeline', () => {
      const stages = getAllStages(tempDir);

      expect(stages).toHaveLength(3);
      expect(stages[0].id).toBe('01-brainstorm');
      expect(stages[1].id).toBe('02-research');
      expect(stages[2].id).toBe('03-planning');
    });
  });

  describe('getStage', () => {
    it('should return stage by ID', () => {
      const stage = getStage('02-research', tempDir);

      expect(stage?.id).toBe('02-research');
      expect(stage?.name).toBe('Research');
    });

    it('should return undefined for non-existent stage', () => {
      const stage = getStage('99-nonexistent', tempDir);
      expect(stage).toBeUndefined();
    });
  });

  describe('getCurrentStage', () => {
    it('should return null when no current stage', () => {
      const stage = getCurrentStage(tempDir);
      expect(stage).toBeNull();
    });

    it('should return current stage', () => {
      const progress: PipelineProgress = {
        currentStage: '02-research',
        stages: {},
        lastUpdated: new Date().toISOString(),
        version: '2.0.0',
      };
      writeFileSync(join(tempDir, 'state', PROGRESS_FILE), JSON.stringify(progress));

      const stage = getCurrentStage(tempDir);

      expect(stage?.id).toBe('02-research');
      expect(stage?.name).toBe('Research');
    });
  });

  describe('getNextStage', () => {
    it('should return next stage', () => {
      const next = getNextStage('01-brainstorm', tempDir);

      expect(next?.id).toBe('02-research');
    });

    it('should return null for last stage', () => {
      const next = getNextStage('03-planning', tempDir);
      expect(next).toBeNull();
    });

    it('should return null for non-existent stage', () => {
      const next = getNextStage('99-nonexistent', tempDir);
      expect(next).toBeNull();
    });
  });

  describe('getPreviousStage', () => {
    it('should return previous stage', () => {
      const prev = getPreviousStage('02-research', tempDir);

      expect(prev?.id).toBe('01-brainstorm');
    });

    it('should return null for first stage', () => {
      const prev = getPreviousStage('01-brainstorm', tempDir);
      expect(prev).toBeNull();
    });
  });

  describe('getFirstStage', () => {
    it('should return first stage', () => {
      const first = getFirstStage(tempDir);

      expect(first.id).toBe('01-brainstorm');
    });
  });
});

describe('Stage Validation', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  describe('validateStageInputs', () => {
    it('should return valid: false when inputs missing', () => {
      const result = validateStageInputs('02-research', tempDir);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('ideas.md');
    });

    it('should return valid: true when all inputs present', () => {
      // Create outputs from previous stage that are inputs to this stage
      createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

      const result = validateStageInputs('02-research', tempDir);

      expect(result.valid).toBe(true);
      expect(result.present).toContain('ideas.md');
      expect(result.missing).toHaveLength(0);
    });
  });

  describe('validateStageOutputs', () => {
    it('should return valid: false when outputs missing', () => {
      const result = validateStageOutputs('01-brainstorm', tempDir);

      expect(result.valid).toBe(false);
      expect(result.missing).toContain('ideas.md');
      expect(result.missing).toContain('HANDOFF.md');
    });

    it('should return valid: true when all outputs present', () => {
      createStageOutputs(tempDir, '01-brainstorm', ['ideas.md', 'HANDOFF.md']);

      const result = validateStageOutputs('01-brainstorm', tempDir);

      expect(result.valid).toBe(true);
      expect(result.present).toContain('ideas.md');
      expect(result.present).toContain('HANDOFF.md');
    });

    it('should track partial outputs', () => {
      createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

      const result = validateStageOutputs('01-brainstorm', tempDir);

      expect(result.valid).toBe(false);
      expect(result.present).toContain('ideas.md');
      expect(result.missing).toContain('HANDOFF.md');
    });
  });

  describe('validateTransition', () => {
    it('should fail when source stage not found', () => {
      const result = validateTransition('99-nonexistent', '02-research', tempDir);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Source stage not found: 99-nonexistent');
    });

    it('should fail when target stage not found', () => {
      const result = validateTransition('01-brainstorm', '99-nonexistent', tempDir);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Target stage not found: 99-nonexistent');
    });

    it('should fail when outputs missing', () => {
      const result = validateTransition('01-brainstorm', '02-research', tempDir);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing outputs'))).toBe(true);
    });

    it('should fail when HANDOFF.md missing', () => {
      createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

      const result = validateTransition('01-brainstorm', '02-research', tempDir);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HANDOFF.md not found - required for stage transition');
    });

    it('should pass with all requirements met', () => {
      createStageOutputs(tempDir, '01-brainstorm', ['ideas.md', 'HANDOFF.md']);

      const result = validateTransition('01-brainstorm', '02-research', tempDir);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn on non-sequential transition', () => {
      createStageOutputs(tempDir, '01-brainstorm', ['ideas.md', 'HANDOFF.md']);

      const result = validateTransition('01-brainstorm', '03-planning', tempDir);

      expect(result.warnings.some(w => w.includes('Non-sequential'))).toBe(true);
    });
  });
});

describe('Stage Execution', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  describe('startStage', () => {
    it('should start a stage and update progress', () => {
      const result = startStage('01-brainstorm', tempDir);

      expect(result.stageId).toBe('01-brainstorm');
      expect(result.status).toBe('in_progress');
      expect(result.startedAt).toBeDefined();

      const progress = loadProgress(tempDir);
      expect(progress.currentStage).toBe('01-brainstorm');
    });

    it('should throw for non-existent stage', () => {
      expect(() => startStage('99-nonexistent', tempDir)).toThrow('Stage not found');
    });
  });

  describe('completeStage', () => {
    it('should complete a stage', () => {
      startStage('01-brainstorm', tempDir);
      const result = completeStage('01-brainstorm', ['ideas.md', 'HANDOFF.md'], undefined, tempDir);

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
      expect(result.outputs).toContain('ideas.md');
    });

    it('should include checkpoint reference', () => {
      startStage('01-brainstorm', tempDir);
      const result = completeStage('01-brainstorm', [], 'cp-01-123', tempDir);

      expect(result.checkpointId).toBe('cp-01-123');
    });
  });

  describe('failStage', () => {
    it('should fail a stage with error', () => {
      startStage('01-brainstorm', tempDir);
      const result = failStage('01-brainstorm', 'Test error message', tempDir);

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Test error message');
      expect(result.completedAt).toBeDefined();
    });
  });
});

describe('Stage Summary', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return correct summary for empty progress', () => {
    const summary = getStageSummary(tempDir);

    expect(summary.total).toBe(3);
    expect(summary.completed).toBe(0);
    expect(summary.inProgress).toBe(0);
    expect(summary.pending).toBe(3);
    expect(summary.failed).toBe(0);
    expect(summary.skipped).toBe(0);
    expect(summary.currentStage).toBeNull();
    expect(summary.nextStage).toBe('01-brainstorm');
  });

  it('should return correct summary with progress', () => {
    // Complete first stage, start second
    completeStage('01-brainstorm', ['ideas.md'], undefined, tempDir);
    startStage('02-research', tempDir);

    const summary = getStageSummary(tempDir);

    expect(summary.completed).toBe(1);
    expect(summary.inProgress).toBe(1);
    expect(summary.pending).toBe(1);
    expect(summary.currentStage).toBe('02-research');
    expect(summary.nextStage).toBe('03-planning');
  });

  it('should handle failed stages', () => {
    startStage('01-brainstorm', tempDir);
    failStage('01-brainstorm', 'Error', tempDir);

    const summary = getStageSummary(tempDir);

    expect(summary.failed).toBe(1);
    expect(summary.pending).toBe(2);
  });
});
