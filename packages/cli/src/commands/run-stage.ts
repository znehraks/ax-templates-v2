/**
 * ax-templates CLI - Run Stage Command
 * Execute a specific pipeline stage
 */

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import {
  loadConfig,
  getStage,
  getStageConfig,
  loadProgress,
  startStage,
  completeStage,
  failStage,
  validateStageInputs,
  validateTransition,
  handoffExists,
  loadHandoff,
  formatContextStatus,
  getPreviousStage,
} from '@ax-templates/core';
import * as fs from 'fs';
import * as path from 'path';

export const runStageCommand = new Command('run-stage')
  .description('Run a specific pipeline stage')
  .argument('<stage-id>', 'Stage ID to run')
  .option('--dry-run', 'Validate inputs without starting')
  .option('--force', 'Force start even if validation fails')
  .action(async (stageId: string, options) => {
    await executeRunStage(stageId, options);
  });

export async function executeRunStage(
  stageId: string,
  options: { dryRun?: boolean; force?: boolean } = {}
) {
  const config = loadConfig();
  const stage = getStage(stageId);

  if (!stage) {
    console.error(chalk.red(`스테이지를 찾을 수 없습니다: ${stageId}`));
    process.exit(1);
  }

  const progress = loadProgress();
  const stageProgress = progress.stages[stageId];

  console.log();
  console.log(chalk.cyan.bold(`🚀 스테이지 실행: ${stage.name}`));
  console.log(chalk.gray('═'.repeat(50)));
  console.log();

  // Check if already completed
  if (stageProgress?.status === 'completed' && !options.force) {
    console.log(chalk.yellow('⚠️  이 스테이지는 이미 완료되었습니다.'));
    console.log(chalk.gray('강제 재실행: --force 옵션 사용'));
    return;
  }

  // Check if already in progress
  if (stageProgress?.status === 'in_progress' && !options.force) {
    console.log(chalk.yellow('⚠️  이 스테이지가 이미 진행 중입니다.'));
    console.log(chalk.gray('강제 재시작: --force 옵션 사용'));
    return;
  }

  // Validate transition from previous stage
  const previousStage = getPreviousStage(stageId);
  if (previousStage) {
    console.log(chalk.white('의존성 검증 중...'));
    const transition = validateTransition(previousStage.id, stageId);

    if (!transition.valid) {
      console.log(chalk.red('✗ 전환 불가:'));
      for (const reason of transition.errors) {
        console.log(chalk.red(`  - ${reason}`));
      }

      if (!options.force) {
        console.log();
        console.log(chalk.gray('강제 실행: --force 옵션 사용'));
        process.exit(1);
      } else {
        console.log(chalk.yellow('--force 옵션으로 강제 진행'));
      }
    } else {
      console.log(chalk.green('✓ 의존성 충족'));
    }

    // Check for HANDOFF.md from previous stage
    if (handoffExists(previousStage.id)) {
      console.log(chalk.green(`✓ ${previousStage.id} HANDOFF.md 존재`));
    } else {
      console.log(chalk.yellow(`⚠️  ${previousStage.id} HANDOFF.md 없음`));
    }
  }

  console.log();

  // Validate inputs
  console.log(chalk.white('입력 검증 중...'));
  const inputValidation = validateStageInputs(stageId);

  if (!inputValidation.valid) {
    console.log(chalk.red('✗ 필수 입력 파일 누락:'));
    for (const missing of inputValidation.missing) {
      console.log(chalk.red(`  - ${missing}`));
    }

    if (!options.force) {
      console.log();
      console.log(chalk.gray('강제 실행: --force 옵션 사용'));
      process.exit(1);
    } else {
      console.log(chalk.yellow('--force 옵션으로 강제 진행'));
    }
  } else {
    console.log(chalk.green('✓ 입력 검증 완료'));
    for (const existing of inputValidation.present) {
      console.log(chalk.gray(`  - ${existing}`));
    }
  }

  console.log();

  // Dry run mode
  if (options.dryRun) {
    console.log(chalk.cyan('🔍 Dry Run 모드 - 실제 실행 없음'));
    console.log();
    showStageInfo(stage);
    return;
  }

  // Start stage
  console.log(chalk.white('스테이지 시작...'));
  startStage(stageId);
  console.log(chalk.green('✓ 스테이지 상태 업데이트됨'));

  console.log();

  // Show stage information
  showStageInfo(stage);

  // Show context status
  console.log();
  console.log(chalk.yellow(formatContextStatus()));

  // Load previous handoff if exists
  if (previousStage && handoffExists(previousStage.id)) {
    console.log();
    console.log(chalk.white.bold('📋 이전 스테이지 핸드오프:'));
    const handoff = loadHandoff(previousStage.id);
    if (handoff) {
      console.log(chalk.gray('─'.repeat(40)));
      // Show first 500 chars of handoff
      const preview = handoff.substring(0, 500);
      console.log(chalk.gray(preview));
      if (handoff.length > 500) {
        console.log(chalk.gray('...'));
        console.log(chalk.gray(`전체 내용: stages/${previousStage.id}/HANDOFF.md`));
      }
    }
  }

  console.log();
  console.log(chalk.cyan('─'.repeat(50)));
  console.log(chalk.white('스테이지가 시작되었습니다.'));
  console.log(chalk.gray(`스테이지 지침: stages/${stageId}/CLAUDE.md`));
  console.log(chalk.gray(`완료 후: ax handoff 실행`));
}

function showStageInfo(stage: ReturnType<typeof getStage>) {
  if (!stage) return;

  const stageConfig = getStageConfig(stage.id);

  const infoContent = [
    `${chalk.white.bold('AI 모델:')} ${stage.models.join(', ')}`,
    `${chalk.white.bold('실행 모드:')} ${stage.mode}`,
    `${chalk.white.bold('타임아웃:')} ${stageConfig.timeout}초`,
    `${chalk.white.bold('체크포인트:')} ${stage.checkpoint_required ? '필수' : '선택'}`,
  ].join('\n');

  console.log(boxen(infoContent, {
    padding: { left: 2, right: 2, top: 0, bottom: 0 },
    borderStyle: 'round',
    borderColor: 'gray',
    title: stage.name,
    titleAlignment: 'center',
  }));

  // Show outputs to generate
  if (stage.outputs.length > 0) {
    console.log();
    console.log(chalk.white.bold('생성할 산출물:'));
    for (const output of stage.outputs) {
      console.log(chalk.gray(`  □ ${output}`));
    }
  }
}
