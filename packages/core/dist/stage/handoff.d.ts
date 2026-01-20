/**
 * @ax-templates/core - Handoff Generator
 * Generates HANDOFF.md documents for stage transitions
 */
import type { HandoffDocument } from './types.js';
export interface GenerateHandoffOptions {
    stageId: string;
    projectDir?: string;
    completedTasks?: string[];
    keyDecisions?: string[];
    successfulApproaches?: string[];
    failedApproaches?: string[];
    outputDescriptions?: Record<string, string>;
    immediateActions?: string[];
    prerequisites?: string[];
    checkpointRef?: string;
    aiCalls?: HandoffDocument['context']['aiCalls'];
    notes?: string;
}
/**
 * Generates a HANDOFF.md document for a stage
 */
export declare function generateHandoff(options: GenerateHandoffOptions): string;
/**
 * Saves a HANDOFF.md document
 */
export declare function saveHandoff(stageId: string, content: string, projectDir?: string): string;
/**
 * Loads a HANDOFF.md document
 */
export declare function loadHandoff(stageId: string, projectDir?: string): string | null;
/**
 * Checks if a handoff exists for a stage
 */
export declare function handoffExists(stageId: string, projectDir?: string): boolean;
/**
 * Parses a HANDOFF.md document to extract key information
 */
export declare function parseHandoff(content: string): Partial<HandoffDocument>;
//# sourceMappingURL=handoff.d.ts.map