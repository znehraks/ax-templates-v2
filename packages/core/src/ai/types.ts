/**
 * @ax-templates/core - AI Types
 * Type definitions for AI CLI abstraction
 */

/** Supported AI providers */
export type AIProvider = 'gemini' | 'codex' | 'claude' | 'claudecode';

/** AI call result */
export interface AICallResult {
  success: boolean;
  provider: AIProvider;
  output: string;
  duration: number;
  error?: string;
}

/** AI call options */
export interface AICallOptions {
  provider: AIProvider;
  prompt: string;
  timeout?: number;
  outputFile?: string;
}

/** AI call log entry */
export interface AICallLog {
  id: string;
  provider: AIProvider;
  timestamp: string;
  prompt: string;
  promptFile?: string;
  outputFile?: string;
  status: 'pending' | 'success' | 'failure';
  duration?: number;
  error?: string;
}

/** tmux session status */
export interface TmuxSessionStatus {
  name: string;
  exists: boolean;
  attached: boolean;
  windowCount: number;
}
