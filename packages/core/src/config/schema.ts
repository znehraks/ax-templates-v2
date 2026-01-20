/**
 * @ax-templates/core - Configuration Schema
 * Zod-based schema definitions for .ax-config.yaml
 */

import { z } from 'zod';

// ============================================
// Sub-schemas
// ============================================

/** Path configuration schema */
export const PathsSchema = z.object({
  project_root: z.string().default('./'),
  stages_output: z.string().default('./stages'),
  state: z.string().default('./state'),
  checkpoints: z.string().default('./state/checkpoints'),
});

/** AI CLI configuration schema */
export const AIConfigSchema = z.object({
  gemini: z.boolean().default(true),
  codex: z.boolean().default(true),
});

/** tmux session configuration schema */
export const TmuxConfigSchema = z.object({
  gemini_session: z.string().default('ax-gemini'),
  codex_session: z.string().default('ax-codex'),
  output_timeout: z.number().default(300),
});

/** Context management thresholds schema */
export const ContextConfigSchema = z.object({
  warning: z.number().min(0).max(100).default(60),
  action: z.number().min(0).max(100).default(50),
  critical: z.number().min(0).max(100).default(40),
  task_save_frequency: z.number().min(1).default(5),
});

/** MCP server configuration schema */
export const MCPConfigSchema = z.object({
  search: z.array(z.string()).default(['context7', 'exa']),
  browser: z.array(z.string()).default(['playwright']),
});

/** Commit type configuration per stage */
export const CommitTypeSchema = z.object({
  type: z.enum(['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'ci', 'chore']),
  scope: z.string(),
});

/** Git configuration schema */
export const GitConfigSchema = z.object({
  commit_language: z.enum(['Korean', 'English', 'Japanese', 'Chinese']).default('Korean'),
  auto_commit: z.boolean().default(true),
  commit_types: z.record(z.string(), CommitTypeSchema).optional(),
});

/** Stage timeout configuration (stage ID -> seconds) */
export const TimeoutsSchema = z.record(z.string(), z.number());

// ============================================
// Stage Configuration
// ============================================

/** Single stage definition */
export const StageDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  models: z.array(z.string()),
  mode: z.string(),
  container: z.boolean().optional(),
  sandbox: z.boolean().optional(),
  mcp_servers: z.array(z.string()).optional(),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  timeout: z.number().default(3600),
  checkpoint_required: z.boolean().optional(),
});

/** Pipeline configuration */
export const PipelineConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  stages: z.array(StageDefinitionSchema),
});

// ============================================
// Main Configuration Schema
// ============================================

/** ax-templates metadata */
export const AxTemplatesMetaSchema = z.object({
  version: z.string().default('2.0.0'),
});

/** Complete .ax-config.yaml schema */
export const AxConfigSchema = z.object({
  ax_templates: AxTemplatesMetaSchema.default({ version: '2.0.0' }),
  paths: PathsSchema.default({}),
  ai: AIConfigSchema.default({}),
  tmux: TmuxConfigSchema.default({}),
  context: ContextConfigSchema.default({}),
  mcp: MCPConfigSchema.default({}),
  git: GitConfigSchema.default({}),
  timeouts: TimeoutsSchema.optional(),
});

// ============================================
// Type Exports
// ============================================

export type Paths = z.infer<typeof PathsSchema>;
export type AIConfig = z.infer<typeof AIConfigSchema>;
export type TmuxConfig = z.infer<typeof TmuxConfigSchema>;
export type ContextConfig = z.infer<typeof ContextConfigSchema>;
export type MCPConfig = z.infer<typeof MCPConfigSchema>;
export type CommitType = z.infer<typeof CommitTypeSchema>;
export type GitConfig = z.infer<typeof GitConfigSchema>;
export type Timeouts = z.infer<typeof TimeoutsSchema>;
export type StageDefinition = z.infer<typeof StageDefinitionSchema>;
export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
export type AxTemplatesMeta = z.infer<typeof AxTemplatesMetaSchema>;
export type AxConfig = z.infer<typeof AxConfigSchema>;

// ============================================
// Validation Helpers
// ============================================

/**
 * Validates and parses configuration with defaults
 */
export function parseConfig(config: unknown): AxConfig {
  return AxConfigSchema.parse(config);
}

/**
 * Validates configuration without applying defaults (for partial updates)
 */
export function validatePartialConfig(config: unknown): Partial<AxConfig> {
  return AxConfigSchema.partial().parse(config);
}

/**
 * Checks if a configuration is valid
 */
export function isValidConfig(config: unknown): boolean {
  return AxConfigSchema.safeParse(config).success;
}
