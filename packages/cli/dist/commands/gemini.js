/**
 * ax-templates CLI - Gemini Command
 * Invoke Gemini CLI via tmux
 */
import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import { loadConfig, isCLIAvailable, getTmuxSessionStatus, ensureTmuxSession, executeAICall, logAICall, updateAICallLog, } from '@ax-templates/core';
export const geminiCommand = new Command('gemini')
    .description('Invoke Gemini CLI')
    .argument('<prompt>', 'Prompt text or path to prompt file')
    .option('-o, --output <file>', 'Output file path')
    .option('--no-wait', 'Do not wait for response')
    .option('--timeout <seconds>', 'Response timeout in seconds', parseInt)
    .option('--raw', 'Pass prompt directly without file processing')
    .action(async (prompt, options) => {
    await executeGemini(prompt, options);
});
async function executeGemini(prompt, options = {}) {
    const config = loadConfig();
    // Check if Gemini is enabled
    if (!config.ai.gemini) {
        console.error(chalk.red('Gemini CLI가 비활성화되어 있습니다.'));
        console.log(chalk.gray('활성화: ax config set ai.gemini true'));
        process.exit(1);
    }
    // Check if Gemini CLI is available
    const isAvailable = isCLIAvailable('gemini');
    if (!isAvailable) {
        console.error(chalk.red('Gemini CLI를 찾을 수 없습니다.'));
        console.log(chalk.gray('설치: https://github.com/google-gemini/gemini-cli'));
        process.exit(1);
    }
    console.log();
    console.log(chalk.cyan.bold('🤖 Gemini CLI 호출'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log();
    // Resolve prompt
    let promptContent;
    let promptSource;
    if (options.raw) {
        promptContent = prompt;
        promptSource = 'inline';
    }
    else if (fs.existsSync(prompt)) {
        promptContent = fs.readFileSync(prompt, 'utf-8');
        promptSource = prompt;
        console.log(chalk.gray(`프롬프트 파일: ${prompt}`));
    }
    else {
        promptContent = prompt;
        promptSource = 'inline';
    }
    // Show prompt preview
    const previewLength = 200;
    const preview = promptContent.length > previewLength
        ? promptContent.substring(0, previewLength) + '...'
        : promptContent;
    console.log(chalk.gray('프롬프트:'));
    console.log(chalk.gray(preview));
    console.log();
    // Log AI call start
    const logEntry = logAICall({
        provider: 'gemini',
        timestamp: new Date().toISOString(),
        promptFile: promptSource !== 'inline' ? promptSource : undefined,
        prompt: promptContent.substring(0, 500),
        status: 'pending',
    });
    // Ensure tmux session
    const sessionName = config.tmux.gemini_session;
    console.log(chalk.white(`tmux 세션: ${sessionName}`));
    const sessionStatus = getTmuxSessionStatus(sessionName);
    if (!sessionStatus.exists) {
        console.log(chalk.yellow('세션 생성 중...'));
        ensureTmuxSession(sessionName);
    }
    else {
        console.log(chalk.green('✓ 세션 활성'));
    }
    // Execute
    console.log();
    console.log(chalk.white('Gemini 호출 중...'));
    const timeout = options.timeout || config.tmux.output_timeout;
    try {
        const result = await executeAICall({
            provider: 'gemini',
            prompt: promptContent,
            outputFile: options.output,
            timeout,
        });
        if (result.success) {
            console.log(chalk.green('✓ Gemini 응답 수신'));
            // Update log
            updateAICallLog(logEntry.id, {
                status: 'success',
                outputFile: options.output,
                duration: result.duration,
            });
            // Show output location or content
            if (options.output) {
                console.log(chalk.gray(`출력 파일: ${options.output}`));
            }
            else if (result.output) {
                console.log();
                console.log(chalk.white.bold('응답:'));
                console.log(chalk.gray('─'.repeat(40)));
                console.log(result.output);
            }
        }
        else {
            console.log(chalk.red('✗ Gemini 호출 실패'));
            updateAICallLog(logEntry.id, {
                status: 'failure',
                error: result.error,
                duration: result.duration,
            });
            if (result.error) {
                console.log(chalk.red(`오류: ${result.error}`));
            }
            process.exit(1);
        }
    }
    catch (error) {
        console.log(chalk.red('✗ Gemini 호출 실패'));
        updateAICallLog(logEntry.id, {
            status: 'failure',
            error: error.message,
        });
        console.error(chalk.red(`오류: ${error.message}`));
        process.exit(1);
    }
    console.log();
    console.log(chalk.gray(`세션 연결: tmux attach -t ${sessionName}`));
}
//# sourceMappingURL=gemini.js.map