/**
 * ax-templates CLI - Run Stage Command
 * Execute a specific pipeline stage
 */
import { Command } from 'commander';
export declare const runStageCommand: Command;
export declare function executeRunStage(stageId: string, options?: {
    dryRun?: boolean;
    force?: boolean;
}): Promise<void>;
//# sourceMappingURL=run-stage.d.ts.map