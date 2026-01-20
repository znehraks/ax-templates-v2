/**
 * @ax-templates/core - Configuration Loader
 * Loads and parses configuration from YAML files
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import type { AxConfig, PipelineConfig } from './schema.js';
import { parseConfig, AxConfigSchema, PipelineConfigSchema } from './schema.js';
import { DEFAULT_CONFIG, DEFAULT_PIPELINE, ENV_VAR_MAP } from './defaults.js';
import { mergeConfigs, applyEnvironmentVariables } from './merger.js';

// ============================================
// Constants
// ============================================

export const CONFIG_FILENAME = '.ax-config.yaml';
export const GLOBAL_CONFIG_DIR = '.ax';
export const PIPELINE_FILENAME = 'pipeline.yaml';

// ============================================
// Configuration Paths
// ============================================

/**
 * Gets the global configuration directory path
 */
export function getGlobalConfigDir(): string {
  return join(homedir(), GLOBAL_CONFIG_DIR);
}

/**
 * Gets the global configuration file path
 */
export function getGlobalConfigPath(): string {
  return join(getGlobalConfigDir(), 'config.yaml');
}

/**
 * Gets the project configuration file path
 */
export function getProjectConfigPath(projectDir: string = process.cwd()): string {
  return resolve(projectDir, CONFIG_FILENAME);
}

/**
 * Gets the pipeline configuration file path
 */
export function getPipelineConfigPath(projectDir: string = process.cwd()): string {
  return resolve(projectDir, 'config', PIPELINE_FILENAME);
}

// ============================================
// File Operations
// ============================================

/**
 * Reads and parses a YAML file
 */
export function readYamlFile<T>(filePath: string): T | null {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    return parseYaml(content) as T;
  } catch (error) {
    throw new Error(`Failed to parse YAML file at ${filePath}: ${error}`);
  }
}

/**
 * Checks if a configuration file exists
 */
export function configExists(projectDir: string = process.cwd()): boolean {
  return existsSync(getProjectConfigPath(projectDir));
}

// ============================================
// Configuration Loading
// ============================================

export interface LoadConfigOptions {
  /** Project directory (defaults to cwd) */
  projectDir?: string;
  /** Skip global config loading */
  skipGlobal?: boolean;
  /** Skip environment variable loading */
  skipEnv?: boolean;
  /** Additional overrides to apply */
  overrides?: Partial<AxConfig>;
}

/**
 * Loads configuration with full priority chain:
 * 1. Default values
 * 2. Global config (~/.ax/config.yaml)
 * 3. Project config (.ax-config.yaml)
 * 4. Environment variables
 * 5. Explicit overrides
 */
export function loadConfig(options: LoadConfigOptions = {}): AxConfig {
  const {
    projectDir = process.cwd(),
    skipGlobal = false,
    skipEnv = false,
    overrides = {},
  } = options;

  // Start with defaults
  let config = { ...DEFAULT_CONFIG };

  // Load global config if exists
  if (!skipGlobal) {
    const globalConfigPath = getGlobalConfigPath();
    const globalConfig = readYamlFile<Partial<AxConfig>>(globalConfigPath);
    if (globalConfig) {
      config = mergeConfigs(config, globalConfig);
    }
  }

  // Load project config if exists
  const projectConfigPath = getProjectConfigPath(projectDir);
  const projectConfig = readYamlFile<Partial<AxConfig>>(projectConfigPath);
  if (projectConfig) {
    config = mergeConfigs(config, projectConfig);
  }

  // Apply environment variables
  if (!skipEnv) {
    config = applyEnvironmentVariables(config, ENV_VAR_MAP);
  }

  // Apply explicit overrides
  if (Object.keys(overrides).length > 0) {
    config = mergeConfigs(config, overrides);
  }

  // Validate and return
  return parseConfig(config);
}

/**
 * Loads pipeline configuration
 */
export function loadPipelineConfig(projectDir: string = process.cwd()): PipelineConfig {
  const pipelinePath = getPipelineConfigPath(projectDir);
  const pipelineConfig = readYamlFile<PipelineConfig>(pipelinePath);

  if (pipelineConfig) {
    return PipelineConfigSchema.parse(pipelineConfig);
  }

  return DEFAULT_PIPELINE;
}

/**
 * Gets stage-specific configuration
 */
export function getStageConfig(stageId: string, projectDir: string = process.cwd()) {
  const pipeline = loadPipelineConfig(projectDir);
  const stage = pipeline.stages.find(s => s.id === stageId);

  if (!stage) {
    throw new Error(`Stage not found: ${stageId}`);
  }

  // Load project config for timeouts
  const config = loadConfig({ projectDir });
  const timeout = config.timeouts?.[stageId] ?? stage.timeout;

  return {
    ...stage,
    timeout,
  };
}

// ============================================
// Configuration Validation
// ============================================

/**
 * Validates a configuration file
 */
export function validateConfigFile(filePath: string): { valid: boolean; errors?: string[] } {
  try {
    const content = readYamlFile<unknown>(filePath);
    if (content === null) {
      return { valid: false, errors: ['File not found'] };
    }

    const result = AxConfigSchema.safeParse(content);
    if (result.success) {
      return { valid: true };
    }

    const errors = result.error.errors.map(
      e => `${e.path.join('.')}: ${e.message}`
    );
    return { valid: false, errors };
  } catch (error) {
    return { valid: false, errors: [`${error}`] };
  }
}

// ============================================
// Configuration Debugging
// ============================================

export interface ConfigSource {
  source: 'default' | 'global' | 'project' | 'env' | 'override';
  path?: string;
}

/**
 * Gets information about where each config value comes from
 */
export function getConfigSources(options: LoadConfigOptions = {}): Map<string, ConfigSource> {
  const sources = new Map<string, ConfigSource>();
  const { projectDir = process.cwd(), skipGlobal = false, skipEnv = false } = options;

  // Mark all defaults
  const markDefaults = (obj: object, prefix = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        markDefaults(value, path);
      } else {
        sources.set(path, { source: 'default' });
      }
    }
  };
  markDefaults(DEFAULT_CONFIG);

  // Check global config
  if (!skipGlobal) {
    const globalPath = getGlobalConfigPath();
    const globalConfig = readYamlFile<object>(globalPath);
    if (globalConfig) {
      const markGlobal = (obj: object, prefix = '') => {
        for (const [key, value] of Object.entries(obj)) {
          const path = prefix ? `${prefix}.${key}` : key;
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            markGlobal(value, path);
          } else {
            sources.set(path, { source: 'global', path: globalPath });
          }
        }
      };
      markGlobal(globalConfig);
    }
  }

  // Check project config
  const projectPath = getProjectConfigPath(projectDir);
  const projectConfig = readYamlFile<object>(projectPath);
  if (projectConfig) {
    const markProject = (obj: object, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          markProject(value, path);
        } else {
          sources.set(path, { source: 'project', path: projectPath });
        }
      }
    };
    markProject(projectConfig);
  }

  // Check environment variables
  if (!skipEnv) {
    for (const [configPath, envVar] of Object.entries(ENV_VAR_MAP)) {
      if (process.env[envVar] !== undefined) {
        sources.set(configPath, { source: 'env', path: envVar });
      }
    }
  }

  return sources;
}
