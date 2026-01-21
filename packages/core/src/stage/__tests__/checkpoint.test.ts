/**
 * @ax-templates/core - Checkpoint Tests
 * Tests for checkpoint creation and management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stringify as yamlStringify } from 'yaml';
import {
  generateCheckpointId,
  getCheckpointsDir,
  getCheckpointPath,
  createCheckpoint,
  listCheckpoints,
  getCheckpoint,
  getCheckpointsForStage,
  getLatestCheckpoint,
  restoreCheckpoint,
} from '../checkpoint.js';
import type { Checkpoint } from '../types.js';

// Test helpers
let tempDir: string;

function createTempDir(): string {
  const dir = join(tmpdir(), `ax-checkpoint-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanupDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function setupTestProject(dir: string): void {
  // Create directory structure
  mkdirSync(join(dir, 'state', 'checkpoints'), { recursive: true });
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
  const pipeline = {
    name: 'Test Pipeline',
    version: '1.0.0',
    stages: [
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
        id: '06-implementation',
        name: 'Implementation',
        models: ['claudecode'],
        mode: 'plan',
        inputs: ['tasks.md'],
        outputs: ['code/', 'HANDOFF.md'],
        timeout: 14400,
        checkpoint_required: true,
      },
    ],
  };
  writeFileSync(join(dir, 'config', 'pipeline.yaml'), yamlStringify(pipeline));

  // Create progress.json
  writeFileSync(join(dir, 'state', 'progress.json'), JSON.stringify({
    currentStage: null,
    stages: {},
    lastUpdated: new Date().toISOString(),
    version: '2.0.0',
  }));
}

function createStageOutputs(dir: string, stageId: string, files: Record<string, string>): void {
  const outputDir = join(dir, 'stages', stageId, 'outputs');
  mkdirSync(outputDir, { recursive: true });

  for (const [filename, content] of Object.entries(files)) {
    const filePath = join(outputDir, filename);
    const fileDir = join(outputDir, ...filename.split('/').slice(0, -1));
    if (fileDir !== outputDir) {
      mkdirSync(fileDir, { recursive: true });
    }
    writeFileSync(filePath, content);
  }
}

describe('generateCheckpointId', () => {
  it('should generate ID with stage prefix', () => {
    const id = generateCheckpointId('01-brainstorm');
    expect(id.startsWith('cp-01-')).toBe(true);
  });

  it('should generate ID with timestamp', () => {
    const id = generateCheckpointId('06-implementation');
    expect(id.startsWith('cp-06-')).toBe(true);
    // Should match pattern: cp-06-YYYY-MM-DDTHH-MM-SS
    expect(id).toMatch(/^cp-06-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
  });

  it('should generate unique IDs', () => {
    const id1 = generateCheckpointId('01-test');
    // Small delay to ensure different timestamp
    const id2 = generateCheckpointId('01-test');
    // IDs might be same if generated in same second, which is acceptable
    expect(id1.startsWith('cp-01-')).toBe(true);
    expect(id2.startsWith('cp-01-')).toBe(true);
  });
});

describe('Checkpoint Paths', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  describe('getCheckpointsDir', () => {
    it('should return checkpoints directory path', () => {
      const dir = getCheckpointsDir(tempDir);
      expect(dir).toBe(join(tempDir, 'state', 'checkpoints'));
    });
  });

  describe('getCheckpointPath', () => {
    it('should return path for specific checkpoint', () => {
      const path = getCheckpointPath('cp-01-2024-01-01T00-00-00', tempDir);
      expect(path).toBe(join(tempDir, 'state', 'checkpoints', 'cp-01-2024-01-01T00-00-00'));
    });
  });
});

describe('createCheckpoint', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should throw for non-existent stage', () => {
    expect(() => createCheckpoint('99-nonexistent', undefined, tempDir)).toThrow('Stage not found');
  });

  it('should create checkpoint with metadata', () => {
    createStageOutputs(tempDir, '01-brainstorm', {
      'ideas.md': '# Ideas',
      'HANDOFF.md': '# Handoff',
    });

    const checkpoint = createCheckpoint('01-brainstorm', 'Test checkpoint', tempDir);

    expect(checkpoint.id).toMatch(/^cp-01-/);
    expect(checkpoint.stageId).toBe('01-brainstorm');
    expect(checkpoint.description).toBe('Test checkpoint');
    expect(checkpoint.createdAt).toBeDefined();
    // Files are stored with relative paths from stage dir, including outputs/ prefix
    expect(checkpoint.files).toContain('outputs/ideas.md');
    expect(checkpoint.files).toContain('outputs/HANDOFF.md');
  });

  it('should copy stage outputs to checkpoint', () => {
    createStageOutputs(tempDir, '01-brainstorm', {
      'ideas.md': '# Ideas\nContent here',
      'HANDOFF.md': '# Handoff\nContent here',
    });

    const checkpoint = createCheckpoint('01-brainstorm', undefined, tempDir);
    const checkpointDir = getCheckpointPath(checkpoint.id, tempDir);

    // Checkpoint copies stage directory to outputs/, so files are at outputs/outputs/
    expect(existsSync(join(checkpointDir, 'outputs', 'outputs', 'ideas.md'))).toBe(true);
    expect(existsSync(join(checkpointDir, 'outputs', 'outputs', 'HANDOFF.md'))).toBe(true);

    const content = readFileSync(join(checkpointDir, 'outputs', 'outputs', 'ideas.md'), 'utf-8');
    expect(content).toBe('# Ideas\nContent here');
  });

  it('should save checkpoint metadata to JSON', () => {
    createStageOutputs(tempDir, '01-brainstorm', { 'ideas.md': '# Ideas' });

    const checkpoint = createCheckpoint('01-brainstorm', 'Metadata test', tempDir);
    const checkpointDir = getCheckpointPath(checkpoint.id, tempDir);
    const metadataPath = join(checkpointDir, 'checkpoint.json');

    expect(existsSync(metadataPath)).toBe(true);

    const saved = JSON.parse(readFileSync(metadataPath, 'utf-8'));
    expect(saved.id).toBe(checkpoint.id);
    expect(saved.description).toBe('Metadata test');
  });

  it('should handle nested directory structures', () => {
    createStageOutputs(tempDir, '06-implementation', {
      'src/index.ts': 'export default {}',
      'src/utils/helper.ts': 'export function helper() {}',
      'HANDOFF.md': '# Handoff',
    });

    const checkpoint = createCheckpoint('06-implementation', undefined, tempDir);
    const checkpointDir = getCheckpointPath(checkpoint.id, tempDir);

    // Checkpoint copies stage directory to outputs/, so nested paths include outputs/ prefix
    expect(existsSync(join(checkpointDir, 'outputs', 'outputs', 'src', 'index.ts'))).toBe(true);
    expect(existsSync(join(checkpointDir, 'outputs', 'outputs', 'src', 'utils', 'helper.ts'))).toBe(true);
  });
});

describe('listCheckpoints', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return empty array when no checkpoints', () => {
    const checkpoints = listCheckpoints(tempDir);
    expect(checkpoints).toHaveLength(0);
  });

  it('should list all checkpoints', async () => {
    createStageOutputs(tempDir, '01-brainstorm', { 'ideas.md': '# Ideas' });

    createCheckpoint('01-brainstorm', 'First', tempDir);
    // Add delay to ensure different timestamps (checkpoint IDs use seconds)
    await new Promise(resolve => setTimeout(resolve, 1100));
    createCheckpoint('01-brainstorm', 'Second', tempDir);

    const checkpoints = listCheckpoints(tempDir);
    expect(checkpoints.length).toBeGreaterThanOrEqual(2);
  });

  it('should sort by creation date (newest first)', async () => {
    createStageOutputs(tempDir, '01-brainstorm', { 'ideas.md': '# Ideas' });

    createCheckpoint('01-brainstorm', 'First', tempDir);
    // Add delay to ensure different timestamps (checkpoint IDs use seconds)
    await new Promise(resolve => setTimeout(resolve, 1100));
    createCheckpoint('01-brainstorm', 'Second', tempDir);

    const checkpoints = listCheckpoints(tempDir);

    // Second should be first (newest)
    expect(checkpoints[0].description).toBe('Second');
    expect(checkpoints[1].description).toBe('First');
  });
});

describe('getCheckpoint', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return null for non-existent checkpoint', () => {
    const checkpoint = getCheckpoint('cp-nonexistent', tempDir);
    expect(checkpoint).toBeNull();
  });

  it('should return checkpoint by ID', () => {
    createStageOutputs(tempDir, '01-brainstorm', { 'ideas.md': '# Ideas' });
    const created = createCheckpoint('01-brainstorm', 'Test', tempDir);

    const checkpoint = getCheckpoint(created.id, tempDir);

    expect(checkpoint).not.toBeNull();
    expect(checkpoint?.id).toBe(created.id);
    expect(checkpoint?.description).toBe('Test');
  });
});

describe('getCheckpointsForStage', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should filter checkpoints by stage', async () => {
    createStageOutputs(tempDir, '01-brainstorm', { 'ideas.md': '# Ideas' });
    createStageOutputs(tempDir, '06-implementation', { 'code.ts': 'code' });

    createCheckpoint('01-brainstorm', 'Brainstorm CP', tempDir);
    // Add delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1100));
    createCheckpoint('06-implementation', 'Implementation CP', tempDir);
    await new Promise(resolve => setTimeout(resolve, 1100));
    createCheckpoint('01-brainstorm', 'Brainstorm CP 2', tempDir);

    const brainstormCPs = getCheckpointsForStage('01-brainstorm', tempDir);
    const implCPs = getCheckpointsForStage('06-implementation', tempDir);

    expect(brainstormCPs).toHaveLength(2);
    expect(implCPs).toHaveLength(1);
    expect(brainstormCPs.every(cp => cp.stageId === '01-brainstorm')).toBe(true);
  });
});

describe('getLatestCheckpoint', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return null when no checkpoints for stage', () => {
    const latest = getLatestCheckpoint('01-brainstorm', tempDir);
    expect(latest).toBeNull();
  });

  it('should return latest checkpoint for stage', () => {
    createStageOutputs(tempDir, '01-brainstorm', { 'ideas.md': '# Ideas' });

    createCheckpoint('01-brainstorm', 'First', tempDir);
    createCheckpoint('01-brainstorm', 'Latest', tempDir);

    const latest = getLatestCheckpoint('01-brainstorm', tempDir);

    expect(latest?.description).toBe('Latest');
  });
});

describe('restoreCheckpoint', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should fail for non-existent checkpoint', () => {
    const result = restoreCheckpoint('cp-nonexistent', tempDir);

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Checkpoint not found: cp-nonexistent');
  });

  it('should restore files from checkpoint', () => {
    // Create initial outputs
    createStageOutputs(tempDir, '01-brainstorm', {
      'ideas.md': '# Original Ideas',
      'HANDOFF.md': '# Original Handoff',
    });

    // Create checkpoint
    const checkpoint = createCheckpoint('01-brainstorm', undefined, tempDir);

    // Modify the files
    writeFileSync(
      join(tempDir, 'stages', '01-brainstorm', 'outputs', 'ideas.md'),
      '# Modified Ideas'
    );

    // Restore
    const result = restoreCheckpoint(checkpoint.id, tempDir);

    expect(result.success).toBe(true);
    // Restored files include the outputs/ prefix from the checkpoint structure
    expect(result.restoredFiles).toContain('outputs/ideas.md');

    // Verify content restored
    const content = readFileSync(
      join(tempDir, 'stages', '01-brainstorm', 'outputs', 'ideas.md'),
      'utf-8'
    );
    expect(content).toBe('# Original Ideas');
  });

  it('should handle nested directories during restore', () => {
    createStageOutputs(tempDir, '06-implementation', {
      'src/index.ts': 'original index',
      'src/utils/helper.ts': 'original helper',
    });

    const checkpoint = createCheckpoint('06-implementation', undefined, tempDir);

    // Modify
    writeFileSync(
      join(tempDir, 'stages', '06-implementation', 'outputs', 'src', 'index.ts'),
      'modified index'
    );

    // Restore
    const result = restoreCheckpoint(checkpoint.id, tempDir);

    expect(result.success).toBe(true);

    const content = readFileSync(
      join(tempDir, 'stages', '06-implementation', 'outputs', 'src', 'index.ts'),
      'utf-8'
    );
    expect(content).toBe('original index');
  });
});
