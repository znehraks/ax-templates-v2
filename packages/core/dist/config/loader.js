/**
 * @ax-templates/core - Configuration Loader
 * Loads and parses configuration from YAML files
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { parse as parseYaml } from 'yaml';
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
export function getGlobalConfigDir() {
    return join(homedir(), GLOBAL_CONFIG_DIR);
}
/**
 * Gets the global configuration file path
 */
export function getGlobalConfigPath() {
    return join(getGlobalConfigDir(), 'config.yaml');
}
/**
 * Gets the project configuration file path
 */
export function getProjectConfigPath(projectDir = process.cwd()) {
    return resolve(projectDir, CONFIG_FILENAME);
}
/**
 * Gets the pipeline configuration file path
 */
export function getPipelineConfigPath(projectDir = process.cwd()) {
    return resolve(projectDir, 'config', PIPELINE_FILENAME);
}
// ============================================
// File Operations
// ============================================
/**
 * Reads and parses a YAML file
 */
export function readYamlFile(filePath) {
    if (!existsSync(filePath)) {
        return null;
    }
    try {
        const content = readFileSync(filePath, 'utf-8');
        return parseYaml(content);
    }
    catch (error) {
        throw new Error(`Failed to parse YAML file at ${filePath}: ${error}`);
    }
}
/**
 * Checks if a configuration file exists
 */
export function configExists(projectDir = process.cwd()) {
    return existsSync(getProjectConfigPath(projectDir));
}
/**
 * Loads configuration with full priority chain:
 * 1. Default values
 * 2. Global config (~/.ax/config.yaml)
 * 3. Project config (.ax-config.yaml)
 * 4. Environment variables
 * 5. Explicit overrides
 */
export function loadConfig(options = {}) {
    const { projectDir = process.cwd(), skipGlobal = false, skipEnv = false, overrides = {}, } = options;
    // Start with defaults
    let config = { ...DEFAULT_CONFIG };
    // Load global config if exists
    if (!skipGlobal) {
        const globalConfigPath = getGlobalConfigPath();
        const globalConfig = readYamlFile(globalConfigPath);
        if (globalConfig) {
            config = mergeConfigs(config, globalConfig);
        }
    }
    // Load project config if exists
    const projectConfigPath = getProjectConfigPath(projectDir);
    const projectConfig = readYamlFile(projectConfigPath);
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
export function loadPipelineConfig(projectDir = process.cwd()) {
    const pipelinePath = getPipelineConfigPath(projectDir);
    const pipelineConfig = readYamlFile(pipelinePath);
    if (pipelineConfig) {
        return PipelineConfigSchema.parse(pipelineConfig);
    }
    return DEFAULT_PIPELINE;
}
/**
 * Gets stage-specific configuration
 */
export function getStageConfig(stageId, projectDir = process.cwd()) {
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
export function validateConfigFile(filePath) {
    try {
        const content = readYamlFile(filePath);
        if (content === null) {
            return { valid: false, errors: ['File not found'] };
        }
        const result = AxConfigSchema.safeParse(content);
        if (result.success) {
            return { valid: true };
        }
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { valid: false, errors };
    }
    catch (error) {
        return { valid: false, errors: [`${error}`] };
    }
}
/**
 * Gets information about where each config value comes from
 */
export function getConfigSources(options = {}) {
    const sources = new Map();
    const { projectDir = process.cwd(), skipGlobal = false, skipEnv = false } = options;
    // Mark all defaults
    const markDefaults = (obj, prefix = '') => {
        for (const [key, value] of Object.entries(obj)) {
            const path = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                markDefaults(value, path);
            }
            else {
                sources.set(path, { source: 'default' });
            }
        }
    };
    markDefaults(DEFAULT_CONFIG);
    // Check global config
    if (!skipGlobal) {
        const globalPath = getGlobalConfigPath();
        const globalConfig = readYamlFile(globalPath);
        if (globalConfig) {
            const markGlobal = (obj, prefix = '') => {
                for (const [key, value] of Object.entries(obj)) {
                    const path = prefix ? `${prefix}.${key}` : key;
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        markGlobal(value, path);
                    }
                    else {
                        sources.set(path, { source: 'global', path: globalPath });
                    }
                }
            };
            markGlobal(globalConfig);
        }
    }
    // Check project config
    const projectPath = getProjectConfigPath(projectDir);
    const projectConfig = readYamlFile(projectPath);
    if (projectConfig) {
        const markProject = (obj, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const path = prefix ? `${prefix}.${key}` : key;
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    markProject(value, path);
                }
                else {
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
//# sourceMappingURL=loader.js.map