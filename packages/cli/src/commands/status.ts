/**
 * ax-templates CLI - Status Command
 * Display pipeline status
 */

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import {
  loadConfig,
  loadProgress,
  getAllStages,
  getStageSummary,
  formatContextStatus,
  getContextState,
  type StageProgress,
} from '@ax-templates/core';

export const statusCommand = new Command('status')
  .description('Display pipeline status')
  .option('-v, --verbose', 'Show detailed status')
  .action(async (options) => {
    await executeStatus(options);
  });

async function executeStatus(options: { verbose?: boolean } = {}) {
  const config = loadConfig();
  const progress = loadProgress();
  const summary = getStageSummary();
  const stages = getAllStages();

  console.log();
  console.log(chalk.cyan.bold('📊 Pipeline Status'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log();

  // Context status
  console.log(chalk.yellow(formatContextStatus()));
  console.log();

  // Progress bar
  const progressBar = createProgressBar(summary.completed, summary.total);
  console.log(`진행률: ${progressBar} ${summary.completed}/${summary.total}`);
  console.log();

  // Stage overview
  console.log(chalk.white.bold('스테이지 현황:'));
  console.log();

  for (const stage of stages) {
    const stageProgress = progress.stages[stage.id];
    const icon = getStatusIcon(stageProgress?.status);
    const statusText = getStatusText(stageProgress?.status);
    const isCurrent = progress.currentStage === stage.id;

    let line = `  ${icon} ${stage.id.padEnd(20)} ${statusText}`;

    if (isCurrent) {
      line = chalk.cyan.bold(line + ' ← 현재');
    } else if (stageProgress?.status === 'completed') {
      line = chalk.green(line);
    } else if (stageProgress?.status === 'failed') {
      line = chalk.red(line);
    } else {
      line = chalk.gray(line);
    }

    console.log(line);

    if (options.verbose && stageProgress) {
      if (stageProgress.startedAt) {
        console.log(chalk.gray(`      시작: ${stageProgress.startedAt}`));
      }
      if (stageProgress.completedAt) {
        console.log(chalk.gray(`      완료: ${stageProgress.completedAt}`));
      }
      if (stageProgress.checkpointId) {
        console.log(chalk.gray(`      체크포인트: ${stageProgress.checkpointId}`));
      }
    }
  }

  console.log();

  // Summary box
  const summaryContent = [
    `${chalk.green('✓ 완료:')} ${summary.completed}`,
    `${chalk.yellow('→ 진행 중:')} ${summary.inProgress}`,
    `${chalk.gray('○ 대기:')} ${summary.pending}`,
    `${chalk.red('✗ 실패:')} ${summary.failed}`,
  ].join('  │  ');

  console.log(boxen(summaryContent, {
    padding: { left: 2, right: 2, top: 0, bottom: 0 },
    borderStyle: 'round',
    borderColor: 'gray',
  }));

  // Next action
  if (summary.nextStage) {
    console.log();
    console.log(chalk.white(`다음 스테이지: ${chalk.cyan(summary.nextStage)}`));
    console.log(chalk.gray(`실행: ax run-stage ${summary.nextStage} 또는 ax next`));
  }
}

function createProgressBar(completed: number, total: number, width: number = 20): string {
  const percent = total > 0 ? completed / total : 0;
  const filled = Math.round(percent * width);
  const empty = width - filled;

  return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

function getStatusIcon(status?: string): string {
  switch (status) {
    case 'completed':
      return '✓';
    case 'in_progress':
      return '●';
    case 'failed':
      return '✗';
    case 'skipped':
      return '○';
    default:
      return '○';
  }
}

function getStatusText(status?: string): string {
  switch (status) {
    case 'completed':
      return '완료';
    case 'in_progress':
      return '진행 중';
    case 'failed':
      return '실패';
    case 'skipped':
      return '스킵';
    default:
      return '대기';
  }
}
