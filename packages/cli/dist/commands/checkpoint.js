/**
 * ax-templates CLI - Checkpoint Command
 * Create and manage checkpoints
 */
import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { loadConfig, getCurrentStage, getStage, createCheckpoint, listCheckpoints, getCheckpoint, getCheckpointsForStage, } from '@ax-templates/core';
export const checkpointCommand = new Command('checkpoint')
    .description('Create or manage checkpoints')
    .argument('[action]', 'Action: create, list, show (default: create)')
    .argument('[checkpoint-id]', 'Checkpoint ID for show action')
    .option('-m, --message <message>', 'Checkpoint description')
    .option('-s, --stage <stage-id>', 'Stage ID (defaults to current)')
    .action(async (action, checkpointId, options) => {
    const normalizedAction = action || 'create';
    switch (normalizedAction) {
        case 'create':
            await executeCreateCheckpoint(options);
            break;
        case 'list':
            await executeListCheckpoints(options?.stage);
            break;
        case 'show':
            await executeShowCheckpoint(checkpointId);
            break;
        default:
            console.error(chalk.red(`알 수 없는 액션: ${action}`));
            console.log(chalk.gray('사용 가능: create, list, show'));
            process.exit(1);
    }
});
async function executeCreateCheckpoint(options = {}) {
    const config = loadConfig();
    const stage = options.stage ? getStage(options.stage) : getCurrentStage();
    if (!stage) {
        console.error(chalk.red('스테이지를 지정하거나 진행 중인 스테이지가 필요합니다.'));
        process.exit(1);
    }
    console.log();
    console.log(chalk.cyan.bold(`📸 체크포인트 생성: ${stage.name}`));
    console.log(chalk.gray('═'.repeat(50)));
    console.log();
    // Get description
    let description = options.message;
    if (!description) {
        const answers = await inquirer.prompt([{
                type: 'input',
                name: 'description',
                message: '체크포인트 설명:',
                default: `${stage.id} 체크포인트`,
                validate: (input) => input.trim() ? true : '설명을 입력하세요.',
            }]);
        description = answers.description;
    }
    console.log(chalk.white('체크포인트 생성 중...'));
    try {
        const checkpoint = createCheckpoint(stage.id, description);
        console.log(chalk.green('✓ 체크포인트 생성 완료'));
        console.log();
        console.log(chalk.white.bold('체크포인트 정보:'));
        console.log(`  ID: ${chalk.cyan(checkpoint.id)}`);
        console.log(`  스테이지: ${checkpoint.stageId}`);
        console.log(`  시간: ${checkpoint.createdAt}`);
        if (checkpoint.description) {
            console.log(`  설명: ${checkpoint.description}`);
        }
        if (checkpoint.gitRef) {
            console.log(`  Git Ref: ${checkpoint.gitRef}`);
        }
        console.log(`  파일 수: ${checkpoint.files.length}`);
        console.log();
        console.log(chalk.gray(`복구: ax restore ${checkpoint.id}`));
    }
    catch (error) {
        console.error(chalk.red('체크포인트 생성 실패:'), error);
        process.exit(1);
    }
}
async function executeListCheckpoints(stageId) {
    console.log();
    if (stageId) {
        const stage = getStage(stageId);
        if (!stage) {
            console.error(chalk.red(`스테이지를 찾을 수 없습니다: ${stageId}`));
            process.exit(1);
        }
        console.log(chalk.cyan.bold(`📋 ${stage.name} 체크포인트 목록`));
        console.log(chalk.gray('═'.repeat(50)));
        console.log();
        const checkpoints = getCheckpointsForStage(stageId);
        displayCheckpoints(checkpoints);
    }
    else {
        console.log(chalk.cyan.bold('📋 전체 체크포인트 목록'));
        console.log(chalk.gray('═'.repeat(50)));
        console.log();
        const checkpoints = listCheckpoints();
        displayCheckpoints(checkpoints);
    }
}
function displayCheckpoints(checkpoints) {
    if (checkpoints.length === 0) {
        console.log(chalk.gray('체크포인트가 없습니다.'));
        console.log(chalk.gray('생성: ax checkpoint create'));
        return;
    }
    for (const cp of checkpoints) {
        console.log(chalk.cyan.bold(cp.id));
        console.log(`  스테이지: ${cp.stageId}`);
        console.log(`  시간: ${chalk.gray(cp.createdAt)}`);
        if (cp.description) {
            console.log(`  설명: ${cp.description}`);
        }
        if (cp.gitRef) {
            console.log(`  Git: ${chalk.gray(cp.gitRef.substring(0, 8))}`);
        }
        console.log();
    }
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray(`총 ${checkpoints.length}개 체크포인트`));
}
async function executeShowCheckpoint(checkpointId) {
    if (!checkpointId) {
        // Show latest checkpoint
        const checkpoints = listCheckpoints();
        if (checkpoints.length === 0) {
            console.log(chalk.gray('체크포인트가 없습니다.'));
            return;
        }
        checkpointId = checkpoints[0].id;
    }
    const checkpoint = getCheckpoint(checkpointId);
    if (!checkpoint) {
        console.error(chalk.red(`체크포인트를 찾을 수 없습니다: ${checkpointId}`));
        const checkpoints = listCheckpoints();
        if (checkpoints.length > 0) {
            console.log(chalk.gray('사용 가능한 체크포인트:'));
            for (const cp of checkpoints.slice(0, 5)) {
                console.log(chalk.gray(`  - ${cp.id}`));
            }
        }
        process.exit(1);
    }
    console.log();
    console.log(chalk.cyan.bold(`📸 체크포인트 상세: ${checkpoint.id}`));
    console.log(chalk.gray('═'.repeat(50)));
    console.log();
    console.log(chalk.white.bold('기본 정보:'));
    console.log(`  스테이지: ${checkpoint.stageId}`);
    console.log(`  시간: ${checkpoint.createdAt}`);
    if (checkpoint.description) {
        console.log(`  설명: ${checkpoint.description}`);
    }
    if (checkpoint.gitRef) {
        console.log(`  Git Ref: ${checkpoint.gitRef}`);
    }
    console.log();
    console.log(chalk.white.bold('포함된 파일:'));
    for (const file of checkpoint.files) {
        console.log(chalk.gray(`  - ${file}`));
    }
    console.log();
    console.log(chalk.gray(`복구: ax restore ${checkpoint.id}`));
}
//# sourceMappingURL=checkpoint.js.map