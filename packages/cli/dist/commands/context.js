/**
 * ax-templates CLI - Context Command
 * Manage context/token usage
 */
import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { loadConfig, getContextState, updateContextState, getRecommendedActions, formatContextStatus, createSnapshot, listSnapshots, snapshotToMarkdown, } from '@ax-templates/core';
import * as fs from 'fs';
import * as path from 'path';
export const contextCommand = new Command('context')
    .description('Manage context/token usage')
    .argument('[action]', 'Action: status, update, snapshot, history (default: status)')
    .option('-p, --percent <number>', 'Set usage percent', parseFloat)
    .option('-t, --tokens <number>', 'Set used tokens', parseInt)
    .option('--max <number>', 'Set max tokens', parseInt)
    .option('-s, --stage <stage-id>', 'Stage ID for snapshot')
    .action(async (action, options) => {
    const normalizedAction = action || 'status';
    switch (normalizedAction) {
        case 'status':
            await executeStatus();
            break;
        case 'update':
            await executeUpdate(options);
            break;
        case 'snapshot':
            await executeSnapshot(options);
            break;
        case 'history':
            await executeHistory();
            break;
        default:
            console.error(chalk.red(`알 수 없는 액션: ${action}`));
            console.log(chalk.gray('사용 가능: status, update, snapshot, history'));
            process.exit(1);
    }
});
async function executeStatus() {
    const config = loadConfig();
    const state = getContextState();
    console.log();
    console.log(chalk.cyan.bold('🧠 컨텍스트 상태'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log();
    if (!state) {
        console.log(chalk.gray('컨텍스트 상태가 없습니다.'));
        console.log(chalk.gray('업데이트: ax context update --percent 10'));
        return;
    }
    // Calculate remaining percent from usage percent
    const remainingPercent = 100 - state.usagePercent;
    const remainingTokens = state.maxTokens - state.tokensUsed;
    // Status bar
    const statusBar = createContextBar(remainingPercent);
    const threshold = state.threshold;
    const thresholdColor = getThresholdColor(threshold);
    console.log(chalk.white.bold('현재 상태:'));
    console.log(`  ${statusBar} ${thresholdColor(`${remainingPercent.toFixed(1)}%`)}`);
    console.log();
    // Details box
    const detailsContent = [
        `${chalk.white('남은 비율:')} ${remainingPercent.toFixed(1)}%`,
        `${chalk.white('남은 토큰:')} ${remainingTokens.toLocaleString()}`,
        `${chalk.white('사용 토큰:')} ${state.tokensUsed.toLocaleString()}`,
        `${chalk.white('최대 토큰:')} ${state.maxTokens.toLocaleString()}`,
        `${chalk.white('상태:')} ${thresholdColor(threshold)}`,
    ].join('\n');
    console.log(boxen(detailsContent, {
        padding: { left: 2, right: 2, top: 0, bottom: 0 },
        borderStyle: 'round',
        borderColor: getThresholdBorderColor(threshold),
    }));
    // Thresholds
    console.log();
    console.log(chalk.white.bold('임계값 설정:'));
    console.log(`  ${chalk.yellow('⚠️  경고:')} ${config.context.warning}%`);
    console.log(`  ${chalk.rgb(255, 165, 0)('⚡ 액션:')} ${config.context.action}%`);
    console.log(`  ${chalk.red('🚨 크리티컬:')} ${config.context.critical}%`);
    // Recommended actions
    const actions = getRecommendedActions();
    if (actions.length > 0) {
        console.log();
        console.log(chalk.white.bold('권장 조치:'));
        for (const action of actions) {
            const icon = action.priority === 'critical' ? '🚨' : action.priority === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`  ${icon} ${action.message}`);
        }
    }
    // Last update
    if (state.timestamp) {
        console.log();
        console.log(chalk.gray(`마지막 업데이트: ${state.timestamp}`));
    }
}
async function executeUpdate(options) {
    console.log();
    console.log(chalk.cyan.bold('🔄 컨텍스트 업데이트'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log();
    const currentState = getContextState();
    const updates = {};
    if (options.percent !== undefined) {
        if (options.percent < 0 || options.percent > 100) {
            console.error(chalk.red('퍼센트는 0-100 사이여야 합니다.'));
            process.exit(1);
        }
        updates.usagePercent = options.percent;
        const currentUsage = currentState?.usagePercent ?? 0;
        console.log(`  사용 비율: ${currentUsage}% → ${chalk.cyan(options.percent + '%')}`);
    }
    if (options.tokens !== undefined) {
        updates.tokensUsed = options.tokens;
        const currentTokens = currentState?.tokensUsed ?? 0;
        console.log(`  사용 토큰: ${currentTokens.toLocaleString()} → ${chalk.cyan(options.tokens.toLocaleString())}`);
    }
    if (options.max !== undefined) {
        updates.maxTokens = options.max;
        const currentMax = currentState?.maxTokens ?? 200000;
        console.log(`  최대 토큰: ${currentMax.toLocaleString()} → ${chalk.cyan(options.max.toLocaleString())}`);
    }
    if (Object.keys(updates).length === 0) {
        console.log(chalk.yellow('업데이트할 값이 없습니다.'));
        console.log(chalk.gray('사용법: ax context update --percent 25 --tokens 50000'));
        return;
    }
    updateContextState(updates);
    console.log();
    console.log(chalk.green('✓ 컨텍스트 상태 업데이트됨'));
    // Show new status
    console.log();
    console.log(chalk.yellow(formatContextStatus()));
}
async function executeSnapshot(options) {
    console.log();
    console.log(chalk.cyan.bold('📸 컨텍스트 스냅샷 생성'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log();
    const snapshot = createSnapshot('manual', {});
    console.log(chalk.green('✓ 스냅샷 생성 완료'));
    console.log();
    console.log(chalk.white.bold('스냅샷 정보:'));
    console.log(`  ID: ${chalk.cyan(snapshot.id)}`);
    console.log(`  시간: ${snapshot.createdAt}`);
    console.log(`  스테이지: ${snapshot.stageId}`);
    console.log(`  트리거: ${snapshot.trigger}`);
    console.log(`  남은 컨텍스트: ${(100 - snapshot.contextState.usagePercent).toFixed(1)}%`);
    // Generate markdown recovery file
    const markdown = snapshotToMarkdown(snapshot);
    const config = loadConfig();
    const snapshotDir = path.join(config.paths.state, 'context');
    if (!fs.existsSync(snapshotDir)) {
        fs.mkdirSync(snapshotDir, { recursive: true });
    }
    const mdPath = path.join(snapshotDir, `state_${snapshot.id}.md`);
    fs.writeFileSync(mdPath, markdown, 'utf-8');
    console.log();
    console.log(chalk.gray(`복구 파일: ${mdPath}`));
}
async function executeHistory() {
    console.log();
    console.log(chalk.cyan.bold('📜 컨텍스트 스냅샷 히스토리'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log();
    const snapshots = listSnapshots();
    if (snapshots.length === 0) {
        console.log(chalk.gray('스냅샷이 없습니다.'));
        console.log(chalk.gray('생성: ax context snapshot'));
        return;
    }
    for (const snapshot of snapshots) {
        const remainingPercent = 100 - snapshot.contextState.usagePercent;
        const threshold = snapshot.contextState.threshold;
        const thresholdColor = getThresholdColor(threshold);
        console.log(chalk.white.bold(snapshot.id));
        console.log(`  시간: ${chalk.gray(snapshot.createdAt)}`);
        console.log(`  스테이지: ${snapshot.stageId}`);
        console.log(`  트리거: ${snapshot.trigger}`);
        console.log(`  컨텍스트: ${thresholdColor(remainingPercent.toFixed(1) + '%')}`);
        console.log();
    }
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray(`총 ${snapshots.length}개 스냅샷`));
}
function createContextBar(remainingPercent, width = 20) {
    const filled = Math.round((remainingPercent / 100) * width);
    const empty = width - filled;
    let barColor = chalk.green;
    if (remainingPercent <= 40) {
        barColor = chalk.red;
    }
    else if (remainingPercent <= 50) {
        barColor = chalk.rgb(255, 165, 0); // orange
    }
    else if (remainingPercent <= 60) {
        barColor = chalk.yellow;
    }
    return barColor('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}
function getThresholdColor(threshold) {
    switch (threshold) {
        case 'critical':
            return chalk.red;
        case 'action':
            return chalk.rgb(255, 165, 0);
        case 'warning':
            return chalk.yellow;
        default:
            return chalk.green;
    }
}
function getThresholdBorderColor(threshold) {
    switch (threshold) {
        case 'critical':
            return 'red';
        case 'action':
            return 'yellow';
        case 'warning':
            return 'yellow';
        default:
            return 'green';
    }
}
//# sourceMappingURL=context.js.map