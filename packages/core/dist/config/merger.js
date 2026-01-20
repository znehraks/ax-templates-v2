/**
 * @ax-templates/core - Configuration Merger
 * Merges multiple configuration sources with proper precedence
 */
import { merge, get, set, cloneDeep } from 'lodash-es';
// ============================================
// Deep Merge Utilities
// ============================================
/**
 * Deep merges two configuration objects
 * Later sources override earlier ones
 */
export function mergeConfigs(base, override) {
    return merge(cloneDeep(base), override);
}
/**
 * Merges multiple configuration objects in order
 */
export function mergeMultipleConfigs(...configs) {
    const validConfigs = configs.filter((c) => c !== undefined);
    if (validConfigs.length === 0) {
        return {};
    }
    return validConfigs.reduce((acc, config) => mergeConfigs(acc, config), {});
}
// ============================================
// Environment Variable Processing
// ============================================
/**
 * Parses an environment variable value to the appropriate type
 */
function parseEnvValue(value) {
    // Boolean
    if (value.toLowerCase() === 'true')
        return true;
    if (value.toLowerCase() === 'false')
        return false;
    // Number
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '')
        return num;
    // String (default)
    return value;
}
/**
 * Applies environment variables to a configuration object
 * Uses a mapping of config paths to environment variable names
 */
export function applyEnvironmentVariables(config, envMap) {
    const result = cloneDeep(config);
    for (const [configPath, envVar] of Object.entries(envMap)) {
        const envValue = process.env[envVar];
        if (envValue !== undefined) {
            const parsedValue = parseEnvValue(envValue);
            set(result, configPath, parsedValue);
        }
    }
    return result;
}
/**
 * Gets all environment variables that would affect the config
 */
export function getActiveEnvironmentOverrides(envMap) {
    const overrides = new Map();
    for (const [configPath, envVar] of Object.entries(envMap)) {
        const envValue = process.env[envVar];
        if (envValue !== undefined) {
            overrides.set(configPath, {
                envVar,
                value: parseEnvValue(envValue),
            });
        }
    }
    return overrides;
}
/**
 * Parses CLI flag overrides into config paths
 * Examples:
 *   --timeout=3600 -> timeouts.06-implementation = 3600
 *   --project-root=./my-app -> paths.project_root = ./my-app
 */
export function parseCLIOverrides(flags) {
    const overrides = [];
    const flagMap = {
        'timeout': 'timeouts.06-implementation',
        'project-root': 'paths.project_root',
        'stages-output': 'paths.stages_output',
        'state-dir': 'paths.state',
        'gemini-session': 'tmux.gemini_session',
        'codex-session': 'tmux.codex_session',
        'context-warning': 'context.warning',
        'context-action': 'context.action',
        'context-critical': 'context.critical',
        'auto-commit': 'git.auto_commit',
        'commit-lang': 'git.commit_language',
    };
    for (const [flag, value] of Object.entries(flags)) {
        if (value !== undefined && flag in flagMap) {
            overrides.push({
                path: flagMap[flag],
                value: typeof value === 'string' ? parseEnvValue(value) : value,
            });
        }
    }
    return overrides;
}
/**
 * Applies CLI overrides to a configuration object
 */
export function applyCLIOverrides(config, overrides) {
    const result = cloneDeep(config);
    for (const { path, value } of overrides) {
        set(result, path, value);
    }
    return result;
}
/**
 * Computes the difference between two configurations
 */
export function diffConfigs(oldConfig, newConfig) {
    const diffs = [];
    const compare = (oldObj, newObj, prefix = '') => {
        const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
        for (const key of allKeys) {
            const path = prefix ? `${prefix}.${key}` : key;
            const oldValue = get(oldObj, key);
            const newValue = get(newObj, key);
            if (oldValue === newValue)
                continue;
            if (typeof oldValue === 'object' &&
                typeof newValue === 'object' &&
                oldValue !== null &&
                newValue !== null &&
                !Array.isArray(oldValue) &&
                !Array.isArray(newValue)) {
                compare(oldValue, newValue, path);
            }
            else {
                diffs.push({ path, oldValue, newValue });
            }
        }
    };
    compare(oldConfig, newConfig);
    return diffs;
}
// ============================================
// Template Variable Resolution
// ============================================
/**
 * Resolves template variables in a string
 * Variables are in the format {{VARIABLE_NAME}}
 */
export function resolveTemplateVariables(template, variables) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        if (varName in variables) {
            return String(variables[varName]);
        }
        return match; // Keep unresolved variables as-is
    });
}
/**
 * Creates a variables object from configuration for template resolution
 */
export function configToTemplateVariables(config) {
    return {
        // Paths
        PROJECT_ROOT: config.paths.project_root,
        STAGES_OUTPUT: config.paths.stages_output,
        STATE_DIR: config.paths.state,
        CHECKPOINTS_DIR: config.paths.checkpoints,
        // tmux
        GEMINI_SESSION: config.tmux.gemini_session,
        CODEX_SESSION: config.tmux.codex_session,
        TMUX_TIMEOUT: config.tmux.output_timeout,
        // Context
        CONTEXT_WARNING: config.context.warning,
        CONTEXT_ACTION: config.context.action,
        CONTEXT_CRITICAL: config.context.critical,
        TASK_SAVE_FREQ: config.context.task_save_frequency,
        // Git
        COMMIT_LANGUAGE: config.git.commit_language,
        AUTO_COMMIT: config.git.auto_commit,
        // AI
        AI_GEMINI: config.ai.gemini,
        AI_CODEX: config.ai.codex,
        // Version
        AX_VERSION: config.ax_templates.version,
    };
}
//# sourceMappingURL=merger.js.map