/**
 * @ax-templates/core - Checkpoint Manager
 * Creates and manages checkpoints for stage rollback
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { loadConfig } from '../config/index.js';
import { getStage, updateStageProgress } from './manager.js';
// ============================================
// Checkpoint ID Generation
// ============================================
/**
 * Generates a unique checkpoint ID
 */
export function generateCheckpointId(stageId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const shortStage = stageId.split('-')[0]; // e.g., "06" from "06-implementation"
    return `cp-${shortStage}-${timestamp}`;
}
// ============================================
// Checkpoint Operations
// ============================================
/**
 * Gets the checkpoints directory path
 */
export function getCheckpointsDir(projectDir = process.cwd()) {
    const config = loadConfig({ projectDir });
    return join(projectDir, config.paths.checkpoints);
}
/**
 * Gets the path for a specific checkpoint
 */
export function getCheckpointPath(checkpointId, projectDir = process.cwd()) {
    return join(getCheckpointsDir(projectDir), checkpointId);
}
/**
 * Creates a checkpoint for the current state
 */
export function createCheckpoint(stageId, description, projectDir = process.cwd()) {
    const stage = getStage(stageId, projectDir);
    if (!stage) {
        throw new Error(`Stage not found: ${stageId}`);
    }
    const config = loadConfig({ projectDir });
    const checkpointId = generateCheckpointId(stageId);
    const checkpointDir = getCheckpointPath(checkpointId, projectDir);
    // Create checkpoint directory
    if (!existsSync(checkpointDir)) {
        mkdirSync(checkpointDir, { recursive: true });
    }
    // Collect files to checkpoint
    const files = [];
    const stageOutputDir = join(projectDir, config.paths.stages_output, stageId);
    if (existsSync(stageOutputDir)) {
        const collectFiles = (dir, basePath = '') => {
            const entries = readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = join(dir, entry.name);
                const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
                if (entry.isDirectory()) {
                    collectFiles(fullPath, relativePath);
                }
                else {
                    files.push(relativePath);
                }
            }
        };
        collectFiles(stageOutputDir);
    }
    // Get git ref if in a git repo
    let gitRef;
    try {
        gitRef = execSync('git rev-parse HEAD', {
            cwd: projectDir,
            encoding: 'utf-8',
        }).trim();
    }
    catch {
        // Not in a git repo, skip
    }
    // Create checkpoint metadata
    const checkpoint = {
        id: checkpointId,
        stageId,
        createdAt: new Date().toISOString(),
        description,
        gitRef,
        files,
    };
    // Save checkpoint metadata
    const metadataPath = join(checkpointDir, 'checkpoint.json');
    writeFileSync(metadataPath, JSON.stringify(checkpoint, null, 2));
    // Copy stage outputs to checkpoint
    if (existsSync(stageOutputDir)) {
        const targetDir = join(checkpointDir, 'outputs');
        mkdirSync(targetDir, { recursive: true });
        // Simple recursive copy
        const copyDir = (src, dest) => {
            mkdirSync(dest, { recursive: true });
            const entries = readdirSync(src, { withFileTypes: true });
            for (const entry of entries) {
                const srcPath = join(src, entry.name);
                const destPath = join(dest, entry.name);
                if (entry.isDirectory()) {
                    copyDir(srcPath, destPath);
                }
                else {
                    const content = readFileSync(srcPath);
                    writeFileSync(destPath, content);
                }
            }
        };
        copyDir(stageOutputDir, targetDir);
    }
    // Update stage progress with checkpoint reference
    updateStageProgress(stageId, { checkpointId }, projectDir);
    return checkpoint;
}
/**
 * Lists all checkpoints
 */
export function listCheckpoints(projectDir = process.cwd()) {
    const checkpointsDir = getCheckpointsDir(projectDir);
    if (!existsSync(checkpointsDir)) {
        return [];
    }
    const checkpoints = [];
    const entries = readdirSync(checkpointsDir, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory() && entry.name.startsWith('cp-')) {
            const metadataPath = join(checkpointsDir, entry.name, 'checkpoint.json');
            if (existsSync(metadataPath)) {
                try {
                    const content = readFileSync(metadataPath, 'utf-8');
                    checkpoints.push(JSON.parse(content));
                }
                catch {
                    // Skip invalid checkpoints
                }
            }
        }
    }
    // Sort by creation date (newest first)
    checkpoints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return checkpoints;
}
/**
 * Gets a specific checkpoint
 */
export function getCheckpoint(checkpointId, projectDir = process.cwd()) {
    const checkpointDir = getCheckpointPath(checkpointId, projectDir);
    const metadataPath = join(checkpointDir, 'checkpoint.json');
    if (!existsSync(metadataPath)) {
        return null;
    }
    try {
        const content = readFileSync(metadataPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Gets checkpoints for a specific stage
 */
export function getCheckpointsForStage(stageId, projectDir = process.cwd()) {
    const allCheckpoints = listCheckpoints(projectDir);
    return allCheckpoints.filter(cp => cp.stageId === stageId);
}
/**
 * Gets the latest checkpoint for a stage
 */
export function getLatestCheckpoint(stageId, projectDir = process.cwd()) {
    const checkpoints = getCheckpointsForStage(stageId, projectDir);
    return checkpoints[0] ?? null;
}
/**
 * Restores a checkpoint
 */
export function restoreCheckpoint(checkpointId, projectDir = process.cwd()) {
    const checkpoint = getCheckpoint(checkpointId, projectDir);
    if (!checkpoint) {
        return {
            success: false,
            checkpoint: { id: checkpointId, stageId: '', createdAt: '', files: [] },
            restoredFiles: [],
            errors: [`Checkpoint not found: ${checkpointId}`],
        };
    }
    const config = loadConfig({ projectDir });
    const checkpointDir = getCheckpointPath(checkpointId, projectDir);
    const checkpointOutputsDir = join(checkpointDir, 'outputs');
    const targetDir = join(projectDir, config.paths.stages_output, checkpoint.stageId);
    const restoredFiles = [];
    const errors = [];
    if (!existsSync(checkpointOutputsDir)) {
        return {
            success: false,
            checkpoint,
            restoredFiles: [],
            errors: ['Checkpoint outputs directory not found'],
        };
    }
    try {
        // Restore files
        const restoreDir = (src, dest, relativePath = '') => {
            mkdirSync(dest, { recursive: true });
            const entries = readdirSync(src, { withFileTypes: true });
            for (const entry of entries) {
                const srcPath = join(src, entry.name);
                const destPath = join(dest, entry.name);
                const filePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
                if (entry.isDirectory()) {
                    restoreDir(srcPath, destPath, filePath);
                }
                else {
                    try {
                        const content = readFileSync(srcPath);
                        writeFileSync(destPath, content);
                        restoredFiles.push(filePath);
                    }
                    catch (err) {
                        errors.push(`Failed to restore ${filePath}: ${err}`);
                    }
                }
            }
        };
        restoreDir(checkpointOutputsDir, targetDir);
        // Restore git state if available
        if (checkpoint.gitRef) {
            try {
                // Create a branch at the checkpoint
                const branchName = `restore-${checkpointId}`;
                execSync(`git checkout -b ${branchName} ${checkpoint.gitRef}`, {
                    cwd: projectDir,
                    stdio: 'pipe',
                });
            }
            catch {
                // Git restore failed, but files are restored
                errors.push('Git checkout failed - files restored but git state not changed');
            }
        }
        return {
            success: errors.length === 0,
            checkpoint,
            restoredFiles,
            errors,
        };
    }
    catch (err) {
        return {
            success: false,
            checkpoint,
            restoredFiles,
            errors: [`Restore failed: ${err}`],
        };
    }
}
//# sourceMappingURL=checkpoint.js.map