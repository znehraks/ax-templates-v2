/**
 * @ax-templates/core - Context Types
 * Type definitions for context management
 */
/** Context threshold levels */
export type ContextThreshold = 'normal' | 'warning' | 'action' | 'critical';
/** Context state snapshot */
export interface ContextState {
    /** Current context usage percentage (0-100) */
    usagePercent: number;
    /** Estimated tokens used */
    tokensUsed: number;
    /** Maximum tokens available */
    maxTokens: number;
    /** Current threshold level */
    threshold: ContextThreshold;
    /** Timestamp of measurement */
    timestamp: string;
}
/** Context snapshot for recovery */
export interface ContextSnapshot {
    id: string;
    createdAt: string;
    trigger: 'threshold' | 'task_complete' | 'manual' | 'stage_transition';
    contextState: ContextState;
    stageId: string;
    stageName: string;
    progress: {
        completedTasks: string[];
        inProgressTasks: string[];
        pendingTasks: string[];
    };
    keyContext: {
        decisions: string[];
        modifiedFiles: string[];
        activeIssues: string[];
    };
    recovery: {
        resumeFrom: string;
        handoffRef?: string;
        checkpointRef?: string;
    };
}
/** Compression strategy */
export interface CompressionStrategy {
    name: string;
    description: string;
    priority: number;
    apply: (snapshot: ContextSnapshot) => string;
}
/** Context action recommendation */
export interface ContextAction {
    type: 'display_banner' | 'save_snapshot' | 'suggest_compress' | 'require_clear' | 'prompt_confirm';
    message: string;
    priority: 'info' | 'warning' | 'critical';
}
/** Task completion tracking */
export interface TaskCompletion {
    taskId: string;
    description: string;
    completedAt: string;
    stageId: string;
}
//# sourceMappingURL=types.d.ts.map