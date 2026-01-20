/**
 * @ax-templates/core - Configuration Module
 * Configuration loading, parsing, and merging utilities
 */

// Schema and types
export {
  // Schemas
  AxConfigSchema,
  PathsSchema,
  AIConfigSchema,
  TmuxConfigSchema,
  ContextConfigSchema,
  MCPConfigSchema,
  CommitTypeSchema,
  GitConfigSchema,
  TimeoutsSchema,
  StageDefinitionSchema,
  PipelineConfigSchema,
  AxTemplatesMetaSchema,

  // Types
  type AxConfig,
  type Paths,
  type AIConfig,
  type TmuxConfig,
  type ContextConfig,
  type MCPConfig,
  type CommitType,
  type GitConfig,
  type Timeouts,
  type StageDefinition,
  type PipelineConfig,
  type AxTemplatesMeta,

  // Validation helpers
  parseConfig,
  validatePartialConfig,
  isValidConfig,
} from './schema.js';

// Defaults
export {
  DEFAULT_CONFIG,
  DEFAULT_STAGES,
  DEFAULT_PIPELINE,
  ENV_VAR_MAP,
} from './defaults.js';

// Loader
export {
  CONFIG_FILENAME,
  GLOBAL_CONFIG_DIR,
  PIPELINE_FILENAME,
  getGlobalConfigDir,
  getGlobalConfigPath,
  getProjectConfigPath,
  getPipelineConfigPath,
  readYamlFile,
  configExists,
  loadConfig,
  loadPipelineConfig,
  getStageConfig,
  validateConfigFile,
  getConfigSources,
  type LoadConfigOptions,
  type ConfigSource,
} from './loader.js';

// Merger
export {
  mergeConfigs,
  mergeMultipleConfigs,
  applyEnvironmentVariables,
  getActiveEnvironmentOverrides,
  parseCLIOverrides,
  applyCLIOverrides,
  diffConfigs,
  resolveTemplateVariables,
  configToTemplateVariables,
  type CLIOverride,
  type ConfigDiff,
} from './merger.js';
