/**
 * @ax-templates/core - Test Setup
 * Global test utilities and helpers
 */

import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, vi } from 'vitest';

// ============================================
// Temporary Directory Management
// ============================================

let tempDirs: string[] = [];

/**
 * Creates a temporary project directory for testing
 */
export function createTempDir(prefix: string = 'ax-test'): string {
  const tempDir = join(tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tempDir, { recursive: true });
  tempDirs.push(tempDir);
  return tempDir;
}

/**
 * Cleans up all created temp directories
 */
export function cleanupTempDirs(): void {
  for (const dir of tempDirs) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  tempDirs = [];
}

/**
 * Creates a minimal ax-templates project structure for testing
 */
export function createTestProject(baseDir: string, options: {
  withConfig?: boolean;
  withPipeline?: boolean;
  withProgress?: boolean;
  configOverrides?: Record<string, unknown>;
} = {}): string {
  const {
    withConfig = true,
    withPipeline = false,
    withProgress = false,
    configOverrides = {},
  } = options;

  // Create base structure
  mkdirSync(join(baseDir, 'state'), { recursive: true });
  mkdirSync(join(baseDir, 'stages'), { recursive: true });
  mkdirSync(join(baseDir, 'config'), { recursive: true });

  // Create .ax-config.yaml if requested
  if (withConfig) {
    const config = {
      ax_templates: { version: '2.0.0' },
      paths: {
        project_root: './',
        stages_output: './stages',
        state: './state',
        checkpoints: './state/checkpoints',
      },
      ai: { gemini: true, codex: true },
      tmux: {
        gemini_session: 'ax-gemini',
        codex_session: 'ax-codex',
        output_timeout: 300,
      },
      context: {
        warning: 60,
        action: 50,
        critical: 40,
        task_save_frequency: 5,
      },
      mcp: {
        search: ['context7', 'exa'],
        browser: ['playwright'],
      },
      git: {
        commit_language: 'Korean',
        auto_commit: true,
      },
      ...configOverrides,
    };
    writeFileSync(
      join(baseDir, '.ax-config.yaml'),
      `# Test Config\n${JSON.stringify(config, null, 2).replace(/{/g, '').replace(/}/g, '').replace(/"/g, '').replace(/,/g, '')}`
    );

    // Write as proper YAML
    const yaml = require('yaml');
    writeFileSync(join(baseDir, '.ax-config.yaml'), yaml.stringify(config));
  }

  // Create pipeline.yaml if requested
  if (withPipeline) {
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
          id: '02-research',
          name: 'Research',
          models: ['claude'],
          mode: 'plan',
          inputs: ['ideas.md'],
          outputs: ['research.md', 'HANDOFF.md'],
          timeout: 7200,
        },
      ],
    };
    const yaml = require('yaml');
    writeFileSync(join(baseDir, 'config', 'pipeline.yaml'), yaml.stringify(pipeline));
  }

  // Create progress.json if requested
  if (withProgress) {
    const progress = {
      currentStage: null,
      stages: {},
      lastUpdated: new Date().toISOString(),
      version: '2.0.0',
    };
    writeFileSync(join(baseDir, 'state', 'progress.json'), JSON.stringify(progress, null, 2));
  }

  return baseDir;
}

/**
 * Creates a stage output directory with files
 */
export function createStageOutputs(
  baseDir: string,
  stageId: string,
  outputs: Record<string, string>
): void {
  const outputDir = join(baseDir, 'stages', stageId, 'outputs');
  mkdirSync(outputDir, { recursive: true });

  for (const [filename, content] of Object.entries(outputs)) {
    writeFileSync(join(outputDir, filename), content);
  }
}

// ============================================
// Environment Variable Management
// ============================================

const originalEnv: Record<string, string | undefined> = {};

/**
 * Sets environment variables for testing and stores originals
 */
export function setTestEnv(vars: Record<string, string>): void {
  for (const [key, value] of Object.entries(vars)) {
    if (!(key in originalEnv)) {
      originalEnv[key] = process.env[key];
    }
    process.env[key] = value;
  }
}

/**
 * Restores original environment variables
 */
export function restoreEnv(): void {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

// ============================================
// Mock Data Generators
// ============================================

/**
 * Creates a mock config object
 */
export function createMockConfig(overrides: Record<string, unknown> = {}) {
  return {
    ax_templates: { version: '2.0.0' },
    paths: {
      project_root: './',
      stages_output: './stages',
      state: './state',
      checkpoints: './state/checkpoints',
    },
    ai: { gemini: true, codex: true },
    tmux: {
      gemini_session: 'ax-gemini',
      codex_session: 'ax-codex',
      output_timeout: 300,
    },
    context: {
      warning: 60,
      action: 50,
      critical: 40,
      task_save_frequency: 5,
    },
    mcp: {
      search: ['context7', 'exa'],
      browser: ['playwright'],
    },
    git: {
      commit_language: 'Korean',
      auto_commit: true,
    },
    ...overrides,
  };
}

/**
 * Creates mock stage definitions
 */
export function createMockStages() {
  return [
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
}

// ============================================
// Global Hooks
// ============================================

// Export for use in tests that want automatic cleanup
export function setupTestHooks() {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTempDirs();
    restoreEnv();
  });
}
