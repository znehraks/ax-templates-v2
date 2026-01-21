/**
 * @ax-templates/core - Loader Tests
 * Tests for configuration loading functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';
import { stringify as yamlStringify } from 'yaml';
import {
  loadConfig,
  loadPipelineConfig,
  getStageConfig,
  configExists,
  readYamlFile,
  validateConfigFile,
  getGlobalConfigDir,
  getGlobalConfigPath,
  getProjectConfigPath,
  getPipelineConfigPath,
  getConfigSources,
  CONFIG_FILENAME,
  PIPELINE_FILENAME,
} from '../loader.js';
import { DEFAULT_CONFIG, DEFAULT_PIPELINE } from '../defaults.js';

// Test helpers
let tempDir: string;

function createTempDir(): string {
  const dir = join(tmpdir(), `ax-loader-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanupDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function writeYamlFile(path: string, content: object): void {
  const dir = join(path, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(path, yamlStringify(content));
}

describe('Path Functions', () => {
  it('getGlobalConfigDir returns correct path', () => {
    const expected = join(homedir(), '.ax');
    expect(getGlobalConfigDir()).toBe(expected);
  });

  it('getGlobalConfigPath returns correct path', () => {
    const expected = join(homedir(), '.ax', 'config.yaml');
    expect(getGlobalConfigPath()).toBe(expected);
  });

  it('getProjectConfigPath returns correct path', () => {
    const projectDir = '/test/project';
    expect(getProjectConfigPath(projectDir)).toBe(join(projectDir, CONFIG_FILENAME));
  });

  it('getPipelineConfigPath returns correct path', () => {
    const projectDir = '/test/project';
    expect(getPipelineConfigPath(projectDir)).toBe(join(projectDir, 'config', PIPELINE_FILENAME));
  });
});

describe('readYamlFile', () => {
  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return null for non-existent file', () => {
    const result = readYamlFile(join(tempDir, 'nonexistent.yaml'));
    expect(result).toBeNull();
  });

  it('should parse valid YAML file', () => {
    const filePath = join(tempDir, 'test.yaml');
    writeYamlFile(filePath, { name: 'test', value: 123 });

    const result = readYamlFile<{ name: string; value: number }>(filePath);
    expect(result?.name).toBe('test');
    expect(result?.value).toBe(123);
  });

  it('should throw error for invalid YAML', () => {
    const filePath = join(tempDir, 'invalid.yaml');
    writeFileSync(filePath, '{ invalid yaml: [unclosed');

    expect(() => readYamlFile(filePath)).toThrow();
  });
});

describe('configExists', () => {
  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return false when config does not exist', () => {
    expect(configExists(tempDir)).toBe(false);
  });

  it('should return true when config exists', () => {
    writeYamlFile(join(tempDir, CONFIG_FILENAME), {});
    expect(configExists(tempDir)).toBe(true);
  });
});

describe('loadConfig', () => {
  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupDir(tempDir);
    // Clean up any env vars
    delete process.env.AX_PROJECT_ROOT;
    delete process.env.AX_CONTEXT_WARNING;
  });

  it('should return defaults when no config file exists', () => {
    const config = loadConfig({ projectDir: tempDir, skipGlobal: true });

    expect(config.ax_templates.version).toBe('2.0.0');
    expect(config.paths.project_root).toBe(DEFAULT_CONFIG.paths.project_root);
    expect(config.context.warning).toBe(DEFAULT_CONFIG.context.warning);
  });

  it('should load project config and merge with defaults', () => {
    const projectConfig = {
      paths: { project_root: './my-app' },
      context: { warning: 70 },
    };
    writeYamlFile(join(tempDir, CONFIG_FILENAME), projectConfig);

    const config = loadConfig({ projectDir: tempDir, skipGlobal: true });

    expect(config.paths.project_root).toBe('./my-app');
    expect(config.context.warning).toBe(70);
    expect(config.context.action).toBe(50); // default
    expect(config.ai.gemini).toBe(true); // default
  });

  it('should apply environment variables', () => {
    process.env.AX_PROJECT_ROOT = './env-project';
    process.env.AX_CONTEXT_WARNING = '75';

    const config = loadConfig({ projectDir: tempDir, skipGlobal: true });

    expect(config.paths.project_root).toBe('./env-project');
    expect(config.context.warning).toBe(75);
  });

  it('should skip environment variables when skipEnv is true', () => {
    process.env.AX_PROJECT_ROOT = './env-project';

    const config = loadConfig({ projectDir: tempDir, skipGlobal: true, skipEnv: true });

    expect(config.paths.project_root).toBe('./'); // default, not env value
  });

  it('should apply explicit overrides', () => {
    const config = loadConfig({
      projectDir: tempDir,
      skipGlobal: true,
      overrides: {
        paths: { project_root: './override' },
        ai: { gemini: false },
      },
    });

    expect(config.paths.project_root).toBe('./override');
    expect(config.ai.gemini).toBe(false);
  });

  it('should respect priority: defaults < project < env < overrides', () => {
    // Project config
    writeYamlFile(join(tempDir, CONFIG_FILENAME), {
      paths: { project_root: './project' },
    });

    // Env
    process.env.AX_PROJECT_ROOT = './env';

    // Override
    const config = loadConfig({
      projectDir: tempDir,
      skipGlobal: true,
      overrides: { paths: { project_root: './override' } },
    });

    expect(config.paths.project_root).toBe('./override');
  });
});

describe('loadPipelineConfig', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    mkdirSync(join(tempDir, 'config'), { recursive: true });
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return default pipeline when file does not exist', () => {
    const pipeline = loadPipelineConfig(tempDir);

    expect(pipeline.name).toBe(DEFAULT_PIPELINE.name);
    expect(pipeline.stages).toEqual(DEFAULT_PIPELINE.stages);
  });

  it('should load pipeline config from file', () => {
    const customPipeline = {
      name: 'Custom Pipeline',
      version: '2.0.0',
      stages: [
        {
          id: '01-custom',
          name: 'Custom Stage',
          models: ['custom'],
          mode: 'custom',
          inputs: ['input.md'],
          outputs: ['output.md'],
        },
      ],
    };

    writeYamlFile(join(tempDir, 'config', PIPELINE_FILENAME), customPipeline);
    const pipeline = loadPipelineConfig(tempDir);

    expect(pipeline.name).toBe('Custom Pipeline');
    expect(pipeline.version).toBe('2.0.0');
    expect(pipeline.stages).toHaveLength(1);
    expect(pipeline.stages[0].id).toBe('01-custom');
  });
});

describe('getStageConfig', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    mkdirSync(join(tempDir, 'config'), { recursive: true });

    // Create pipeline with stages
    const pipeline = {
      name: 'Test Pipeline',
      version: '1.0.0',
      stages: [
        {
          id: '01-brainstorm',
          name: 'Brainstorming',
          models: ['gemini'],
          mode: 'yolo',
          inputs: ['brief.md'],
          outputs: ['ideas.md'],
          timeout: 3600,
        },
        {
          id: '06-implementation',
          name: 'Implementation',
          models: ['claudecode'],
          mode: 'plan',
          inputs: ['tasks.md'],
          outputs: ['code/'],
          timeout: 14400,
        },
      ],
    };
    writeYamlFile(join(tempDir, 'config', PIPELINE_FILENAME), pipeline);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return stage config', () => {
    const stage = getStageConfig('01-brainstorm', tempDir);

    expect(stage.id).toBe('01-brainstorm');
    expect(stage.name).toBe('Brainstorming');
    expect(stage.timeout).toBe(3600);
  });

  it('should throw error for non-existent stage', () => {
    expect(() => getStageConfig('99-nonexistent', tempDir)).toThrow('Stage not found');
  });

  it('should use custom timeout from config', () => {
    // Add custom timeout in project config
    writeYamlFile(join(tempDir, CONFIG_FILENAME), {
      timeouts: {
        '01-brainstorm': 7200,
      },
    });

    const stage = getStageConfig('01-brainstorm', tempDir);
    expect(stage.timeout).toBe(7200);
  });
});

describe('validateConfigFile', () => {
  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return valid: false for non-existent file', () => {
    const result = validateConfigFile(join(tempDir, 'nonexistent.yaml'));

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('File not found');
  });

  it('should return valid: true for valid config', () => {
    const filePath = join(tempDir, 'config.yaml');
    writeYamlFile(filePath, {
      ax_templates: { version: '2.0.0' },
      paths: { project_root: './app' },
    });

    const result = validateConfigFile(filePath);

    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should return errors for invalid config', () => {
    const filePath = join(tempDir, 'config.yaml');
    writeYamlFile(filePath, {
      context: { warning: 200 }, // Invalid: > 100
    });

    const result = validateConfigFile(filePath);

    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });
});

describe('getConfigSources', () => {
  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupDir(tempDir);
    delete process.env.AX_PROJECT_ROOT;
  });

  it('should mark default sources', () => {
    const sources = getConfigSources({ projectDir: tempDir, skipGlobal: true });

    expect(sources.get('paths.project_root')?.source).toBe('default');
    expect(sources.get('context.warning')?.source).toBe('default');
  });

  it('should mark project sources', () => {
    writeYamlFile(join(tempDir, CONFIG_FILENAME), {
      paths: { project_root: './custom' },
    });

    const sources = getConfigSources({ projectDir: tempDir, skipGlobal: true });

    expect(sources.get('paths.project_root')?.source).toBe('project');
  });

  it('should mark env sources', () => {
    process.env.AX_PROJECT_ROOT = './env';

    const sources = getConfigSources({ projectDir: tempDir, skipGlobal: true });

    expect(sources.get('paths.project_root')?.source).toBe('env');
    expect(sources.get('paths.project_root')?.path).toBe('AX_PROJECT_ROOT');
  });
});
