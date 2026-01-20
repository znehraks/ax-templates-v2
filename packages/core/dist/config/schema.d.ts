/**
 * @ax-templates/core - Configuration Schema
 * Zod-based schema definitions for .ax-config.yaml
 */
import { z } from 'zod';
/** Path configuration schema */
export declare const PathsSchema: z.ZodObject<{
    project_root: z.ZodDefault<z.ZodString>;
    stages_output: z.ZodDefault<z.ZodString>;
    state: z.ZodDefault<z.ZodString>;
    checkpoints: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    project_root: string;
    stages_output: string;
    state: string;
    checkpoints: string;
}, {
    project_root?: string | undefined;
    stages_output?: string | undefined;
    state?: string | undefined;
    checkpoints?: string | undefined;
}>;
/** AI CLI configuration schema */
export declare const AIConfigSchema: z.ZodObject<{
    gemini: z.ZodDefault<z.ZodBoolean>;
    codex: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    gemini: boolean;
    codex: boolean;
}, {
    gemini?: boolean | undefined;
    codex?: boolean | undefined;
}>;
/** tmux session configuration schema */
export declare const TmuxConfigSchema: z.ZodObject<{
    gemini_session: z.ZodDefault<z.ZodString>;
    codex_session: z.ZodDefault<z.ZodString>;
    output_timeout: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    gemini_session: string;
    codex_session: string;
    output_timeout: number;
}, {
    gemini_session?: string | undefined;
    codex_session?: string | undefined;
    output_timeout?: number | undefined;
}>;
/** Context management thresholds schema */
export declare const ContextConfigSchema: z.ZodObject<{
    warning: z.ZodDefault<z.ZodNumber>;
    action: z.ZodDefault<z.ZodNumber>;
    critical: z.ZodDefault<z.ZodNumber>;
    task_save_frequency: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    warning: number;
    action: number;
    critical: number;
    task_save_frequency: number;
}, {
    warning?: number | undefined;
    action?: number | undefined;
    critical?: number | undefined;
    task_save_frequency?: number | undefined;
}>;
/** MCP server configuration schema */
export declare const MCPConfigSchema: z.ZodObject<{
    search: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    browser: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    search: string[];
    browser: string[];
}, {
    search?: string[] | undefined;
    browser?: string[] | undefined;
}>;
/** Commit type configuration per stage */
export declare const CommitTypeSchema: z.ZodObject<{
    type: z.ZodEnum<["feat", "fix", "docs", "style", "refactor", "test", "ci", "chore"]>;
    scope: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
    scope: string;
}, {
    type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
    scope: string;
}>;
/** Git configuration schema */
export declare const GitConfigSchema: z.ZodObject<{
    commit_language: z.ZodDefault<z.ZodEnum<["Korean", "English", "Japanese", "Chinese"]>>;
    auto_commit: z.ZodDefault<z.ZodBoolean>;
    commit_types: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        type: z.ZodEnum<["feat", "fix", "docs", "style", "refactor", "test", "ci", "chore"]>;
        scope: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
        scope: string;
    }, {
        type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
        scope: string;
    }>>>;
}, "strip", z.ZodTypeAny, {
    commit_language: "Korean" | "English" | "Japanese" | "Chinese";
    auto_commit: boolean;
    commit_types?: Record<string, {
        type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
        scope: string;
    }> | undefined;
}, {
    commit_language?: "Korean" | "English" | "Japanese" | "Chinese" | undefined;
    auto_commit?: boolean | undefined;
    commit_types?: Record<string, {
        type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
        scope: string;
    }> | undefined;
}>;
/** Stage timeout configuration (stage ID -> seconds) */
export declare const TimeoutsSchema: z.ZodRecord<z.ZodString, z.ZodNumber>;
/** Single stage definition */
export declare const StageDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    models: z.ZodArray<z.ZodString, "many">;
    mode: z.ZodString;
    container: z.ZodOptional<z.ZodBoolean>;
    sandbox: z.ZodOptional<z.ZodBoolean>;
    mcp_servers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    inputs: z.ZodArray<z.ZodString, "many">;
    outputs: z.ZodArray<z.ZodString, "many">;
    timeout: z.ZodDefault<z.ZodNumber>;
    checkpoint_required: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    models: string[];
    mode: string;
    inputs: string[];
    outputs: string[];
    timeout: number;
    description?: string | undefined;
    container?: boolean | undefined;
    sandbox?: boolean | undefined;
    mcp_servers?: string[] | undefined;
    checkpoint_required?: boolean | undefined;
}, {
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
    timeout?: number | undefined;
    checkpoint_required?: boolean | undefined;
}>;
/** Pipeline configuration */
export declare const PipelineConfigSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    stages: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        models: z.ZodArray<z.ZodString, "many">;
        mode: z.ZodString;
        container: z.ZodOptional<z.ZodBoolean>;
        sandbox: z.ZodOptional<z.ZodBoolean>;
        mcp_servers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        inputs: z.ZodArray<z.ZodString, "many">;
        outputs: z.ZodArray<z.ZodString, "many">;
        timeout: z.ZodDefault<z.ZodNumber>;
        checkpoint_required: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        models: string[];
        mode: string;
        inputs: string[];
        outputs: string[];
        timeout: number;
        description?: string | undefined;
        container?: boolean | undefined;
        sandbox?: boolean | undefined;
        mcp_servers?: string[] | undefined;
        checkpoint_required?: boolean | undefined;
    }, {
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
        timeout?: number | undefined;
        checkpoint_required?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    stages: {
        id: string;
        name: string;
        models: string[];
        mode: string;
        inputs: string[];
        outputs: string[];
        timeout: number;
        description?: string | undefined;
        container?: boolean | undefined;
        sandbox?: boolean | undefined;
        mcp_servers?: string[] | undefined;
        checkpoint_required?: boolean | undefined;
    }[];
    description?: string | undefined;
}, {
    name: string;
    version: string;
    stages: {
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
        timeout?: number | undefined;
        checkpoint_required?: boolean | undefined;
    }[];
    description?: string | undefined;
}>;
/** ax-templates metadata */
export declare const AxTemplatesMetaSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    version: string;
}, {
    version?: string | undefined;
}>;
/** Complete .ax-config.yaml schema */
export declare const AxConfigSchema: z.ZodObject<{
    ax_templates: z.ZodDefault<z.ZodObject<{
        version: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        version: string;
    }, {
        version?: string | undefined;
    }>>;
    paths: z.ZodDefault<z.ZodObject<{
        project_root: z.ZodDefault<z.ZodString>;
        stages_output: z.ZodDefault<z.ZodString>;
        state: z.ZodDefault<z.ZodString>;
        checkpoints: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        project_root: string;
        stages_output: string;
        state: string;
        checkpoints: string;
    }, {
        project_root?: string | undefined;
        stages_output?: string | undefined;
        state?: string | undefined;
        checkpoints?: string | undefined;
    }>>;
    ai: z.ZodDefault<z.ZodObject<{
        gemini: z.ZodDefault<z.ZodBoolean>;
        codex: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        gemini: boolean;
        codex: boolean;
    }, {
        gemini?: boolean | undefined;
        codex?: boolean | undefined;
    }>>;
    tmux: z.ZodDefault<z.ZodObject<{
        gemini_session: z.ZodDefault<z.ZodString>;
        codex_session: z.ZodDefault<z.ZodString>;
        output_timeout: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        gemini_session: string;
        codex_session: string;
        output_timeout: number;
    }, {
        gemini_session?: string | undefined;
        codex_session?: string | undefined;
        output_timeout?: number | undefined;
    }>>;
    context: z.ZodDefault<z.ZodObject<{
        warning: z.ZodDefault<z.ZodNumber>;
        action: z.ZodDefault<z.ZodNumber>;
        critical: z.ZodDefault<z.ZodNumber>;
        task_save_frequency: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        warning: number;
        action: number;
        critical: number;
        task_save_frequency: number;
    }, {
        warning?: number | undefined;
        action?: number | undefined;
        critical?: number | undefined;
        task_save_frequency?: number | undefined;
    }>>;
    mcp: z.ZodDefault<z.ZodObject<{
        search: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        browser: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        search: string[];
        browser: string[];
    }, {
        search?: string[] | undefined;
        browser?: string[] | undefined;
    }>>;
    git: z.ZodDefault<z.ZodObject<{
        commit_language: z.ZodDefault<z.ZodEnum<["Korean", "English", "Japanese", "Chinese"]>>;
        auto_commit: z.ZodDefault<z.ZodBoolean>;
        commit_types: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
            type: z.ZodEnum<["feat", "fix", "docs", "style", "refactor", "test", "ci", "chore"]>;
            scope: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
            scope: string;
        }, {
            type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
            scope: string;
        }>>>;
    }, "strip", z.ZodTypeAny, {
        commit_language: "Korean" | "English" | "Japanese" | "Chinese";
        auto_commit: boolean;
        commit_types?: Record<string, {
            type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
            scope: string;
        }> | undefined;
    }, {
        commit_language?: "Korean" | "English" | "Japanese" | "Chinese" | undefined;
        auto_commit?: boolean | undefined;
        commit_types?: Record<string, {
            type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
            scope: string;
        }> | undefined;
    }>>;
    timeouts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    ax_templates: {
        version: string;
    };
    paths: {
        project_root: string;
        stages_output: string;
        state: string;
        checkpoints: string;
    };
    ai: {
        gemini: boolean;
        codex: boolean;
    };
    tmux: {
        gemini_session: string;
        codex_session: string;
        output_timeout: number;
    };
    context: {
        warning: number;
        action: number;
        critical: number;
        task_save_frequency: number;
    };
    mcp: {
        search: string[];
        browser: string[];
    };
    git: {
        commit_language: "Korean" | "English" | "Japanese" | "Chinese";
        auto_commit: boolean;
        commit_types?: Record<string, {
            type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
            scope: string;
        }> | undefined;
    };
    timeouts?: Record<string, number> | undefined;
}, {
    ax_templates?: {
        version?: string | undefined;
    } | undefined;
    paths?: {
        project_root?: string | undefined;
        stages_output?: string | undefined;
        state?: string | undefined;
        checkpoints?: string | undefined;
    } | undefined;
    ai?: {
        gemini?: boolean | undefined;
        codex?: boolean | undefined;
    } | undefined;
    tmux?: {
        gemini_session?: string | undefined;
        codex_session?: string | undefined;
        output_timeout?: number | undefined;
    } | undefined;
    context?: {
        warning?: number | undefined;
        action?: number | undefined;
        critical?: number | undefined;
        task_save_frequency?: number | undefined;
    } | undefined;
    mcp?: {
        search?: string[] | undefined;
        browser?: string[] | undefined;
    } | undefined;
    git?: {
        commit_language?: "Korean" | "English" | "Japanese" | "Chinese" | undefined;
        auto_commit?: boolean | undefined;
        commit_types?: Record<string, {
            type: "feat" | "fix" | "docs" | "style" | "refactor" | "test" | "ci" | "chore";
            scope: string;
        }> | undefined;
    } | undefined;
    timeouts?: Record<string, number> | undefined;
}>;
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
/**
 * Validates and parses configuration with defaults
 */
export declare function parseConfig(config: unknown): AxConfig;
/**
 * Validates configuration without applying defaults (for partial updates)
 */
export declare function validatePartialConfig(config: unknown): Partial<AxConfig>;
/**
 * Checks if a configuration is valid
 */
export declare function isValidConfig(config: unknown): boolean;
//# sourceMappingURL=schema.d.ts.map