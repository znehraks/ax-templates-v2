/**
 * @ax-templates/core - Configuration Merger
 * Merges multiple configuration sources with proper precedence
 */
import type { AxConfig } from './schema.js';
/**
 * Deep merges two configuration objects
 * Later sources override earlier ones
 */
export declare function mergeConfigs<T extends object>(base: T, override: Partial<T>): T;
/**
 * Merges multiple configuration objects in order
 */
export declare function mergeMultipleConfigs<T extends object>(...configs: Array<Partial<T> | undefined>): T;
/**
 * Applies environment variables to a configuration object
 * Uses a mapping of config paths to environment variable names
 */
export declare function applyEnvironmentVariables(config: AxConfig, envMap: Record<string, string>): AxConfig;
/**
 * Gets all environment variables that would affect the config
 */
export declare function getActiveEnvironmentOverrides(envMap: Record<string, string>): Map<string, {
    envVar: string;
    value: string | number | boolean;
}>;
export interface CLIOverride {
    path: string;
    value: string | number | boolean;
}
/**
 * Parses CLI flag overrides into config paths
 * Examples:
 *   --timeout=3600 -> timeouts.06-implementation = 3600
 *   --project-root=./my-app -> paths.project_root = ./my-app
 */
export declare function parseCLIOverrides(flags: Record<string, unknown>): CLIOverride[];
/**
 * Applies CLI overrides to a configuration object
 */
export declare function applyCLIOverrides(config: AxConfig, overrides: CLIOverride[]): AxConfig;
export interface ConfigDiff {
    path: string;
    oldValue: unknown;
    newValue: unknown;
}
/**
 * Computes the difference between two configurations
 */
export declare function diffConfigs(oldConfig: AxConfig, newConfig: AxConfig): ConfigDiff[];
/**
 * Resolves template variables in a string
 * Variables are in the format {{VARIABLE_NAME}}
 */
export declare function resolveTemplateVariables(template: string, variables: Record<string, string | number | boolean>): string;
/**
 * Creates a variables object from configuration for template resolution
 */
export declare function configToTemplateVariables(config: AxConfig): Record<string, string | number | boolean>;
//# sourceMappingURL=merger.d.ts.map