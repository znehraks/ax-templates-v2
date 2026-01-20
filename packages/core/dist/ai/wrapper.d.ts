/**
 * @ax-templates/core - AI Wrapper
 * Abstraction layer for AI CLI calls (Gemini, Codex)
 */
import type { AIProvider, AICallResult, AICallOptions, AICallLog, TmuxSessionStatus } from './types.js';
/**
 * Gets all AI call logs
 */
export declare function getAICallLogs(projectDir?: string): AICallLog[];
/**
 * Logs an AI call
 */
export declare function logAICall(log: Omit<AICallLog, 'id'>, projectDir?: string): AICallLog;
/**
 * Updates an AI call log entry
 */
export declare function updateAICallLog(id: string, update: Partial<AICallLog>, projectDir?: string): void;
/**
 * Checks if tmux is available
 */
export declare function isTmuxAvailable(): boolean;
/**
 * Gets tmux session status
 */
export declare function getTmuxSessionStatus(sessionName: string): TmuxSessionStatus;
/**
 * Creates a tmux session if it doesn't exist
 */
export declare function ensureTmuxSession(sessionName: string): boolean;
/**
 * Checks if a CLI command is available
 */
export declare function isCLIAvailable(command: string): boolean;
/**
 * Checks availability of AI CLIs
 */
export declare function checkAIAvailability(): Record<AIProvider, boolean>;
/**
 * Executes an AI call via tmux
 */
export declare function executeAICall(options: AICallOptions, projectDir?: string): Promise<AICallResult>;
/**
 * Gets wrapper script path for a provider
 */
export declare function getWrapperScriptPath(provider: AIProvider, projectDir?: string): string;
/**
 * Executes AI call using wrapper script
 */
export declare function executeViaWrapper(provider: AIProvider, prompt: string, timeout?: number, projectDir?: string): Promise<AICallResult>;
//# sourceMappingURL=wrapper.d.ts.map