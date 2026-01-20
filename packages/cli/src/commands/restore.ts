/**
 * ax-templates CLI - Restore Command
 * Restore from a checkpoint
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  listCheckpoints,
  getCheckpoint,
  restoreCheckpoint,
  type Checkpoint,
} from '@ax-templates/core';

export const restoreCommand = new Command('restore')
  .description('Restore from a checkpoint')
  .argument('[checkpoint-id]', 'Checkpoint ID to restore (defaults to latest)')
  .option('-f, --force', 'Skip confirmation')
  .option('--list', 'List available checkpoints')
  .action(async (checkpointId?: string, options?: { force?: boolean; list?: boolean }) => {
    if (options?.list) {
      await executeListCheckpoints();
    } else {
      await executeRestore(checkpointId, options);
    }
  });

async function executeListCheckpoints() {
  console.log();
  console.log(chalk.cyan.bold('📋 사용 가능한 체크포인트'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log();

  const checkpoints = listCheckpoints();

  if (checkpoints.length === 0) {
    console.log(chalk.gray('체크포인트가 없습니다.'));
    console.log(chalk.gray('생성: ax checkpoint'));
    return;
  }

  for (let i = 0; i < checkpoints.length; i++) {
    const cp = checkpoints[i];
    const label = i === 0 ? chalk.green(' (최신)') : '';

    console.log(`${chalk.cyan.bold(cp.id)}${label}`);
    console.log(`  스테이지: ${cp.stageId}`);
    console.log(`  시간: ${chalk.gray(cp.createdAt)}`);
    if (cp.description) {
      console.log(`  설명: ${cp.description}`);
    }
    console.log();
  }

  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.gray('복구: ax restore <checkpoint-id>'));
}

async function executeRestore(
  checkpointId?: string,
  options: { force?: boolean } = {}
) {
  // Find checkpoint
  let checkpoint: Checkpoint | null = null;

  if (checkpointId) {
    checkpoint = getCheckpoint(checkpointId);
    if (!checkpoint) {
      console.error(chalk.red(`체크포인트를 찾을 수 없습니다: ${checkpointId}`));
      console.log();
      console.log(chalk.gray('사용 가능한 체크포인트:'));
      await executeListCheckpoints();
      process.exit(1);
    }
  } else {
    // Get latest checkpoint (first in list since sorted by date desc)
    const checkpoints = listCheckpoints();
    checkpoint = checkpoints[0] ?? null;
    if (!checkpoint) {
      console.log(chalk.yellow('복구할 체크포인트가 없습니다.'));
      console.log(chalk.gray('체크포인트 생성: ax checkpoint'));
      return;
    }
    console.log(chalk.gray(`최신 체크포인트 사용: ${checkpoint.id}`));
  }

  console.log();
  console.log(chalk.cyan.bold(`🔄 체크포인트 복구`));
  console.log(chalk.gray('═'.repeat(50)));
  console.log();

  // Show checkpoint info
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

  console.log();
  console.log(chalk.white.bold('복구될 파일:'));
  for (const file of checkpoint.files) {
    console.log(chalk.gray(`  - ${file}`));
  }

  console.log();

  // Confirmation
  if (!options.force) {
    console.log(chalk.yellow('⚠️  주의: 현재 파일이 체크포인트 버전으로 덮어씌워집니다.'));

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: '체크포인트를 복구하시겠습니까?',
      default: false,
    }]);

    if (!confirm) {
      console.log(chalk.gray('취소되었습니다.'));
      return;
    }
  }

  // Execute restore
  console.log();
  console.log(chalk.white('복구 중...'));

  try {
    const result = restoreCheckpoint(checkpoint.id);

    console.log(chalk.green('✓ 체크포인트 복구 완료'));
    console.log();
    console.log(chalk.white.bold('복구 결과:'));
    console.log(`  복구된 파일: ${result.restoredFiles.length}개`);

    for (const file of result.restoredFiles) {
      console.log(chalk.gray(`    ✓ ${file}`));
    }

    if (result.errors.length > 0) {
      console.log();
      console.log(chalk.yellow('경고:'));
      for (const error of result.errors) {
        console.log(chalk.yellow(`  - ${error}`));
      }
    }

    // Suggest git checkout if git ref exists
    if (checkpoint.gitRef) {
      console.log();
      console.log(chalk.gray('Git 복구 (선택):'));
      console.log(chalk.gray(`  git checkout ${checkpoint.gitRef}`));
    }

    console.log();
    console.log(chalk.cyan(`현재 상태 확인: ax status`));

  } catch (error) {
    console.error(chalk.red('복구 실패:'), error);
    process.exit(1);
  }
}
