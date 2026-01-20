/**
 * @ax-templates/core - AI Wrapper
 * Abstraction layer for AI CLI calls (Gemini, Codex)
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { loadConfig } from '../config/index.js';
// ============================================
// AI Call Logging
// ============================================
const AI_LOG_FILE = 'ai_calls.json';
/**
 * Gets the AI call log file path
 */
function getAILogPath(projectDir = process.cwd()) {
    const config = loadConfig({ projectDir });
    return join(projectDir, config.paths.state, AI_LOG_FILE);
}
/**
 * Gets all AI call logs
 */
export function getAICallLogs(projectDir = process.cwd()) {
    const logPath = getAILogPath(projectDir);
    if (!existsSync(logPath)) {
        return [];
    }
    try {
        return JSON.parse(readFileSync(logPath, 'utf-8'));
    }
    catch {
        return [];
    }
}
/**
 * Logs an AI call
 */
export function logAICall(log, projectDir = process.cwd()) {
    const logPath = getAILogPath(projectDir);
    const dir = dirname(logPath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    const logs = getAICallLogs(projectDir);
    const entry = {
        ...log,
        id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    logs.push(entry);
    writeFileSync(logPath, JSON.stringify(logs, null, 2));
    return entry;
}
/**
 * Updates an AI call log entry
 */
export function updateAICallLog(id, update, projectDir = process.cwd()) {
    const logPath = getAILogPath(projectDir);
    const logs = getAICallLogs(projectDir);
    const index = logs.findIndex(l => l.id === id);
    if (index !== -1) {
        logs[index] = { ...logs[index], ...update };
        writeFileSync(logPath, JSON.stringify(logs, null, 2));
    }
}
// ============================================
// tmux Session Management
// ============================================
/**
 * Checks if tmux is available
 */
export function isTmuxAvailable() {
    try {
        execSync('which tmux', { stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Gets tmux session status
 */
export function getTmuxSessionStatus(sessionName) {
    const result = {
        name: sessionName,
        exists: false,
        attached: false,
        windowCount: 0,
    };
    try {
        const output = execSync(`tmux list-sessions -F "#{session_name}:#{session_attached}:#{session_windows}"`, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        const lines = output.trim().split('\n');
        for (const line of lines) {
            const [name, attached, windows] = line.split(':');
            if (name === sessionName) {
                result.exists = true;
                result.attached = attached === '1';
                result.windowCount = parseInt(windows, 10) || 0;
                break;
            }
        }
    }
    catch {
        // Session doesn't exist or tmux not running
    }
    return result;
}
/**
 * Creates a tmux session if it doesn't exist
 */
export function ensureTmuxSession(sessionName) {
    const status = getTmuxSessionStatus(sessionName);
    if (status.exists) {
        return true;
    }
    try {
        execSync(`tmux new-session -d -s "${sessionName}"`, { stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
// ============================================
// CLI Availability Checks
// ============================================
/**
 * Checks if a CLI command is available
 */
export function isCLIAvailable(command) {
    try {
        execSync(`which ${command}`, { stdio: 'pipe' });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Checks availability of AI CLIs
 */
export function checkAIAvailability() {
    return {
        gemini: isCLIAvailable('gemini'),
        codex: isCLIAvailable('codex'),
        claude: true, // Always available as it's the host
        claudecode: true,
    };
}
// ============================================
// AI Call Execution
// ============================================
/**
 * Executes an AI call via tmux
 */
export async function executeAICall(options, projectDir = process.cwd()) {
    const { provider, prompt, timeout, outputFile } = options;
    const config = loadConfig({ projectDir });
    const startTime = Date.now();
    // Create log entry
    const logEntry = logAICall({
        provider,
        timestamp: new Date().toISOString(),
        prompt: prompt.slice(0, 200) + (prompt.length > 200 ? '...' : ''),
        outputFile,
        status: 'pending',
    }, projectDir);
    try {
        // Check CLI availability
        if (!isCLIAvailable(provider)) {
            throw new Error(`${provider} CLI not found. Please install it first.`);
        }
        // Check tmux
        if (!isTmuxAvailable()) {
            throw new Error('tmux is required for AI CLI calls. Please install it.');
        }
        // Get session name from config
        const sessionName = provider === 'gemini'
            ? config.tmux.gemini_session
            : config.tmux.codex_session;
        // Ensure session exists
        if (!ensureTmuxSession(sessionName)) {
            throw new Error(`Failed to create tmux session: ${sessionName}`);
        }
        // Prepare output file
        const tempOutput = outputFile ?? `/tmp/ax-${provider}-${Date.now()}.txt`;
        const actualTimeout = timeout ?? config.tmux.output_timeout;
        // Execute via tmux with wait-for synchronization
        const channel = `ax-${provider}-done-${Date.now()}`;
        const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/'/g, "'\\''");
        // Send command to tmux
        execSync(`tmux send-keys -t "${sessionName}" '${provider} "${escapedPrompt}" 2>&1 | tee ${tempOutput}; tmux wait-for -S ${channel}' Enter`, { stdio: 'pipe' });
        // Wait for completion with timeout
        try {
            execSync(`tmux wait-for -t ${actualTimeout} ${channel}`, { stdio: 'pipe' });
        }
        catch {
            // Timeout - try to read partial output
        }
        // Read output
        let output = '';
        if (existsSync(tempOutput)) {
            output = readFileSync(tempOutput, 'utf-8');
        }
        const duration = Date.now() - startTime;
        // Update log
        updateAICallLog(logEntry.id, {
            status: 'success',
            duration,
        }, projectDir);
        return {
            success: true,
            provider,
            output,
            duration,
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : String(error);
        // Update log
        updateAICallLog(logEntry.id, {
            status: 'failure',
            duration,
            error: errorMsg,
        }, projectDir);
        return {
            success: false,
            provider,
            output: '',
            duration,
            error: errorMsg,
        };
    }
}
/**
 * Gets wrapper script path for a provider
 */
export function getWrapperScriptPath(provider, projectDir = process.cwd()) {
    const scriptName = `${provider}-wrapper.sh`;
    return join(projectDir, 'scripts', scriptName);
}
/**
 * Executes AI call using wrapper script
 */
export async function executeViaWrapper(provider, prompt, timeout, projectDir = process.cwd()) {
    const wrapperPath = getWrapperScriptPath(provider, projectDir);
    if (!existsSync(wrapperPath)) {
        return executeAICall({ provider, prompt, timeout }, projectDir);
    }
    const config = loadConfig({ projectDir });
    const actualTimeout = timeout ?? config.tmux.output_timeout;
    const startTime = Date.now();
    // Create log entry
    const logEntry = logAICall({
        provider,
        timestamp: new Date().toISOString(),
        prompt: prompt.slice(0, 200) + (prompt.length > 200 ? '...' : ''),
        status: 'pending',
    }, projectDir);
    try {
        const result = execSync(`bash "${wrapperPath}" "${prompt}" ${actualTimeout}`, {
            encoding: 'utf-8',
            cwd: projectDir,
            maxBuffer: 10 * 1024 * 1024, // 10MB
        });
        const duration = Date.now() - startTime;
        updateAICallLog(logEntry.id, {
            status: 'success',
            duration,
        }, projectDir);
        return {
            success: true,
            provider,
            output: result,
            duration,
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : String(error);
        updateAICallLog(logEntry.id, {
            status: 'failure',
            duration,
            error: errorMsg,
        }, projectDir);
        return {
            success: false,
            provider,
            output: '',
            duration,
            error: errorMsg,
        };
    }
}
//# sourceMappingURL=wrapper.js.map