/**
 * @ax-templates/core - Configuration Module
 * Configuration loading, parsing, and merging utilities
 */
// Schema and types
export { 
// Schemas
AxConfigSchema, PathsSchema, AIConfigSchema, TmuxConfigSchema, ContextConfigSchema, MCPConfigSchema, CommitTypeSchema, GitConfigSchema, TimeoutsSchema, StageDefinitionSchema, PipelineConfigSchema, AxTemplatesMetaSchema, 
// Validation helpers
parseConfig, validatePartialConfig, isValidConfig, } from './schema.js';
// Defaults
export { DEFAULT_CONFIG, DEFAULT_STAGES, DEFAULT_PIPELINE, ENV_VAR_MAP, } from './defaults.js';
// Loader
export { CONFIG_FILENAME, GLOBAL_CONFIG_DIR, PIPELINE_FILENAME, getGlobalConfigDir, getGlobalConfigPath, getProjectConfigPath, getPipelineConfigPath, readYamlFile, configExists, loadConfig, loadPipelineConfig, getStageConfig, validateConfigFile, getConfigSources, } from './loader.js';
// Merger
export { mergeConfigs, mergeMultipleConfigs, applyEnvironmentVariables, getActiveEnvironmentOverrides, parseCLIOverrides, applyCLIOverrides, diffConfigs, resolveTemplateVariables, configToTemplateVariables, } from './merger.js';
//# sourceMappingURL=index.js.map