/**
 * ax-templates CLI - Next Command
 * Move to the next pipeline stage
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  loadProgress,
  getCurrentStage,
  getNextStage,
  getFirstStage,
  validateStageOutputs,
  handoffExists,
  completeStage,
} from '@ax-templates/core';
import { executeRunStage } from './run-stage.js';

export const nextCommand = new Command('next')
  .description('Move to the next pipeline stage')
  .option('--skip-validation', 'Skip output validation')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (options) => {
    await executeNext(options);
  });

async function executeNext(options: { skipValidation?: boolean; yes?: boolean } = {}) {
  const progress = loadProgress();
  const currentStage = getCurrentStage();
  const nextStage = currentStage ? getNextStage(currentStage.id) : getFirstStage();

  console.log();

  // Check if there's a current stage
  if (!currentStage) {
    console.log(chalk.yellow('현재 진행 중인 스테이지가 없습니다.'));

    if (nextStage) {
      console.log(chalk.white(`첫 번째 스테이지를 시작하시겠습니까?`));
      console.log(chalk.cyan(`  → ${nextStage.id}: ${nextStage.name}`));

      if (!options.yes) {
        const { confirm } = await inquirer.prompt([{
          type: 'confirm',
          name: 'confirm',
          message: '시작하시겠습니까?',
          default: true,
        }]);

        if (!confirm) {
          console.log(chalk.gray('취소되었습니다.'));
          return;
        }
      }

      await executeRunStage(nextStage.id, {});
    } else {
      console.log(chalk.green('🎉 모든 스테이지가 완료되었습니다!'));
    }
    return;
  }

  console.log(chalk.cyan.bold(`📍 현재 스테이지: ${currentStage.name}`));
  console.log();

  // Validate current stage outputs
  if (!options.skipValidation) {
    console.log(chalk.white('산출물 검증 중...'));
    const outputValidation = validateStageOutputs(currentStage.id);

    if (!outputValidation.valid) {
      console.log(chalk.red('✗ 필수 산출물 누락:'));
      for (const missing of outputValidation.missing) {
        console.log(chalk.red(`  - ${missing}`));
      }
      console.log();
      console.log(chalk.gray('검증 스킵: --skip-validation 옵션 사용'));

      if (!options.yes) {
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: '산출물이 누락되었습니다. 그래도 진행하시겠습니까?',
          default: false,
        }]);

        if (!proceed) {
          console.log(chalk.gray('취소되었습니다.'));
          return;
        }
      }
    } else {
      console.log(chalk.green('✓ 산출물 검증 완료'));
      for (const existing of outputValidation.present) {
        console.log(chalk.gray(`  ✓ ${existing}`));
      }
    }
  }

  // Check HANDOFF.md
  console.log();
  if (!handoffExists(currentStage.id)) {
    console.log(chalk.yellow('⚠️  HANDOFF.md가 생성되지 않았습니다.'));
    console.log(chalk.gray('생성: ax handoff'));

    if (!options.yes) {
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'HANDOFF.md 없이 진행하시겠습니까?',
        default: false,
      }]);

      if (!proceed) {
        console.log(chalk.gray('취소되었습니다.'));
        return;
      }
    }
  } else {
    console.log(chalk.green('✓ HANDOFF.md 존재'));
  }

  // Complete current stage
  console.log();
  console.log(chalk.white('현재 스테이지 완료 처리 중...'));
  completeStage(currentStage.id);
  console.log(chalk.green(`✓ ${currentStage.id} 완료됨`));

  // Move to next stage
  if (!nextStage) {
    console.log();
    console.log(chalk.green.bold('🎉 모든 파이프라인 스테이지가 완료되었습니다!'));
    console.log(chalk.gray('상태 확인: ax status'));
    return;
  }

  console.log();
  console.log(chalk.cyan(`→ 다음 스테이지: ${nextStage.id} - ${nextStage.name}`));

  if (!options.yes) {
    const { startNext } = await inquirer.prompt([{
      type: 'confirm',
      name: 'startNext',
      message: '다음 스테이지를 시작하시겠습니까?',
      default: true,
    }]);

    if (!startNext) {
      console.log(chalk.gray('다음 스테이지 시작이 취소되었습니다.'));
      console.log(chalk.gray(`수동 시작: ax run-stage ${nextStage.id}`));
      return;
    }
  }

  console.log();
  await executeRunStage(nextStage.id, {});
}
