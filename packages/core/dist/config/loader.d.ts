/**
 * @ax-templates/core - Configuration Loader
 * Loads and parses configuration from YAML files
 */
import type { AxConfig, PipelineConfig } from './schema.js';
export declare const CONFIG_FILENAME = ".ax-config.yaml";
export declare const GLOBAL_CONFIG_DIR = ".ax";
export declare const PIPELINE_FILENAME = "pipeline.yaml";
/**
 * Gets the global configuration directory path
 */
export declare function getGlobalConfigDir(): string;
/**
 * Gets the global configuration file path
 */
export declare function getGlobalConfigPath(): string;
/**
 * Gets the project configuration file path
 */
export declare function getProjectConfigPath(projectDir?: string): string;
/**
 * Gets the pipeline configuration file path
 */
export declare function getPipelineConfigPath(projectDir?: string): string;
/**
 * Reads and parses a YAML file
 */
export declare function readYamlFile<T>(filePath: string): T | null;
/**
 * Checks if a configuration file exists
 */
export declare function configExists(projectDir?: string): boolean;
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
export declare function loadConfig(options?: LoadConfigOptions): AxConfig;
/**
 * Loads pipeline configuration
 */
export declare function loadPipelineConfig(projectDir?: string): PipelineConfig;
/**
 * Gets stage-specific configuration
 */
export declare function getStageConfig(stageId: string, projectDir?: string): {
    timeout: number;
    id: string;
    name: string;
    models: string[];
    mode: string;
    inputs: string[];
    outputs: string[];
    description?: string | undefined;
    container?: boolean | undefined;
    sandbox?: boolean | undefined;
    mcp_servers?: string[] | undefined;
    checkpoint_required?: boolean | undefined;
};
/**
 * Validates a configuration file
 */
export declare function validateConfigFile(filePath: string): {
    valid: boolean;
    errors?: string[];
};
export interface ConfigSource {
    source: 'default' | 'global' | 'project' | 'env' | 'override';
    path?: string;
}
/**
 * Gets information about where each config value comes from
 */
export declare function getConfigSources(options?: LoadConfigOptions): Map<string, ConfigSource>;
//# sourceMappingURL=loader.d.ts.map