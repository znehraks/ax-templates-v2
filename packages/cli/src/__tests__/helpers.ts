/**
 * @ax-templates/cli - Test Helpers
 * Utilities for CLI E2E testing
 */

import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync, spawn } from 'node:child_process';
import { stringify as yamlStringify } from 'yaml';

// ============================================
// Temporary Project Management
// ============================================

let tempProjects: string[] = [];

/**
 * Creates a temporary project for testing
 */
export function createTempProject(name: string = 'test-project'): string {
  const tempDir = join(tmpdir(), `ax-cli-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(tempDir, { recursive: true });
  tempProjects.push(tempDir);
  return tempDir;
}

/**
 * Cleans up a specific temp project
 */
export function cleanupTempProject(projectDir: string): void {
  if (existsSync(projectDir)) {
    rmSync(projectDir, { recursive: true, force: true });
  }
  tempProjects = tempProjects.filter(p => p !== projectDir);
}

/**
 * Cleans up all temp projects
 */
export function cleanupAllTempProjects(): void {
  for (const dir of tempProjects) {
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  tempProjects = [];
}

// ============================================
// Project Setup Utilities
// ============================================

/**
 * Creates a fully initialized ax-templates project
 */
export function createInitializedProject(baseDir: string, options: {
  projectName?: string;
  stages?: number;
} = {}): string {
  const { projectName = 'test-app', stages = 10 } = options;

  // Create directory structure
  mkdirSync(join(baseDir, 'state', 'checkpoints'), { recursive: true });
  mkdirSync(join(baseDir, 'state', 'context'), { recursive: true });
  mkdirSync(join(baseDir, 'state', 'handoffs'), { recursive: true });
  mkdirSync(join(baseDir, 'config'), { recursive: true });

  // Create all stage directories
  const stageNames = [
    '01-brainstorm',
    '02-research',
    '03-planning',
    '04-ui-ux',
    '05-task-management',
    '06-implementation',
    '07-refactoring',
    '08-qa',
    '09-testing',
    '10-deployment',
  ];

  for (let i = 0; i < Math.min(stages, stageNames.length); i++) {
    mkdirSync(join(baseDir, 'stages', stageNames[i], 'outputs'), { recursive: true });
    mkdirSync(join(baseDir, 'stages', stageNames[i], 'inputs'), { recursive: true });
    mkdirSync(join(baseDir, 'stages', stageNames[i], 'prompts'), { recursive: true });
  }

  // Create .ax-config.yaml
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
  };
  writeFileSync(join(baseDir, '.ax-config.yaml'), yamlStringify(config));

  // Create pipeline.yaml
  const pipeline = createDefaultPipeline(stages);
  writeFileSync(join(baseDir, 'config', 'pipeline.yaml'), yamlStringify(pipeline));

  // Create progress.json
  const progress = {
    currentStage: null,
    stages: {},
    lastUpdated: new Date().toISOString(),
    version: '2.0.0',
  };
  writeFileSync(join(baseDir, 'state', 'progress.json'), JSON.stringify(progress, null, 2));

  return baseDir;
}

/**
 * Creates default pipeline configuration
 */
function createDefaultPipeline(stageCount: number = 10) {
  const allStages = [
    {
      id: '01-brainstorm',
      name: 'Brainstorming',
      models: ['gemini', 'claudecode'],
      mode: 'yolo',
      container: true,
      inputs: ['project_brief.md'],
      outputs: ['ideas.md', 'requirements_analysis.md', 'HANDOFF.md'],
      timeout: 3600,
    },
    {
      id: '02-research',
      name: 'Research',
      models: ['claude'],
      mode: 'plan',
      inputs: ['requirements_analysis.md'],
      outputs: ['tech_research.md', 'feasibility_report.md', 'HANDOFF.md'],
      timeout: 7200,
    },
    {
      id: '03-planning',
      name: 'Planning',
      models: ['gemini'],
      mode: 'plan',
      inputs: ['tech_research.md'],
      outputs: ['architecture.md', 'project_plan.md', 'HANDOFF.md'],
      timeout: 3600,
    },
    {
      id: '04-ui-ux',
      name: 'UI/UX Planning',
      models: ['gemini'],
      mode: 'plan',
      inputs: ['architecture.md'],
      outputs: ['wireframes.md', 'design_system.md', 'HANDOFF.md'],
      timeout: 3600,
    },
    {
      id: '05-task-management',
      name: 'Task Management',
      models: ['claudecode'],
      mode: 'plan',
      inputs: ['project_plan.md'],
      outputs: ['tasks.md', 'sprint_plan.md', 'HANDOFF.md'],
      timeout: 1800,
    },
    {
      id: '06-implementation',
      name: 'Implementation',
      models: ['claudecode'],
      mode: 'plan_sandbox',
      sandbox: true,
      inputs: ['tasks.md'],
      outputs: ['source_code/', 'HANDOFF.md'],
      timeout: 14400,
      checkpoint_required: true,
    },
    {
      id: '07-refactoring',
      name: 'Refactoring',
      models: ['codex'],
      mode: 'deep_dive',
      inputs: ['source_code/'],
      outputs: ['refactored_code/', 'HANDOFF.md'],
      timeout: 7200,
      checkpoint_required: true,
    },
    {
      id: '08-qa',
      name: 'QA',
      models: ['claudecode'],
      mode: 'plan_sandbox',
      inputs: ['refactored_code/'],
      outputs: ['qa_report.md', 'HANDOFF.md'],
      timeout: 3600,
    },
    {
      id: '09-testing',
      name: 'Testing & E2E',
      models: ['codex'],
      mode: 'sandbox_playwright',
      inputs: ['source_code/'],
      outputs: ['tests/', 'test_report.md', 'HANDOFF.md'],
      timeout: 7200,
    },
    {
      id: '10-deployment',
      name: 'CI/CD & Deployment',
      models: ['claudecode'],
      mode: 'headless',
      inputs: ['tests/'],
      outputs: ['.github/workflows/', 'deployment_log.md'],
      timeout: 3600,
    },
  ];

  return {
    name: 'Test Pipeline',
    version: '1.0.0',
    description: 'Test pipeline for E2E testing',
    stages: allStages.slice(0, stageCount),
  };
}

/**
 * Sets up stage outputs for testing
 */
export function setupStageOutputs(
  baseDir: string,
  stageId: string,
  files: Record<string, string>
): void {
  const outputDir = join(baseDir, 'stages', stageId, 'outputs');
  mkdirSync(outputDir, { recursive: true });

  for (const [filename, content] of Object.entries(files)) {
    const filePath = join(outputDir, filename);
    const dir = join(outputDir, filename.includes('/') ? filename.split('/').slice(0, -1).join('/') : '');
    if (dir !== outputDir) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, content);
  }
}

/**
 * Updates progress.json with stage status
 */
export function setStageProgress(
  baseDir: string,
  stageId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  options: { checkpointId?: string; outputs?: string[] } = {}
): void {
  const progressPath = join(baseDir, 'state', 'progress.json');
  const progress = JSON.parse(require('fs').readFileSync(progressPath, 'utf-8'));

  progress.stages[stageId] = {
    stageId,
    status,
    startedAt: status !== 'pending' ? new Date().toISOString() : undefined,
    completedAt: status === 'completed' ? new Date().toISOString() : undefined,
    ...options,
  };

  if (status === 'in_progress') {
    progress.currentStage = stageId;
  }

  progress.lastUpdated = new Date().toISOString();
  writeFileSync(progressPath, JSON.stringify(progress, null, 2));
}

// ============================================
// CLI Execution Helpers
// ============================================

export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  error?: Error;
}

/**
 * Runs the CLI command and returns the result
 */
export async function runCli(
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
  } = {}
): Promise<CLIResult> {
  const { cwd = process.cwd(), env = {}, timeout = 10000 } = options;

  const cliPath = join(__dirname, '..', '..', '..', 'bin', 'ax.js');

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn('node', [cliPath, ...args], {
      cwd,
      env: { ...process.env, ...env },
      timeout,
    });

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('error', (error) => {
      resolve({ stdout, stderr, exitCode: null, error });
    });

    proc.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
  });
}

/**
 * Runs CLI command synchronously (for simple tests)
 */
export function runCliSync(
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string>;
  } = {}
): CLIResult {
  const { cwd = process.cwd(), env = {} } = options;
  const cliPath = join(__dirname, '..', '..', '..', 'bin', 'ax.js');

  try {
    const stdout = execSync(`node ${cliPath} ${args.join(' ')}`, {
      cwd,
      env: { ...process.env, ...env },
      encoding: 'utf-8',
    });

    return { stdout, stderr: '', exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || '',
      exitCode: error.status || 1,
      error,
    };
  }
}

// ============================================
// Assertion Helpers
// ============================================

/**
 * Checks if a file exists in the project
 */
export function fileExists(baseDir: string, ...paths: string[]): boolean {
  return existsSync(join(baseDir, ...paths));
}

/**
 * Reads a JSON file from the project
 */
export function readJsonFile(baseDir: string, ...paths: string[]): unknown {
  const content = require('fs').readFileSync(join(baseDir, ...paths), 'utf-8');
  return JSON.parse(content);
}

/**
 * Reads a text file from the project
 */
export function readTextFile(baseDir: string, ...paths: string[]): string {
  return require('fs').readFileSync(join(baseDir, ...paths), 'utf-8');
}
