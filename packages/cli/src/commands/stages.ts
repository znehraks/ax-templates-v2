/**
 * ax-templates CLI - Stages Command
 * List and display stage information
 */

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import {
  getAllStages,
  getStage,
  loadProgress,
  getStageConfig,
  getPreviousStage,
  type StageDefinition,
} from '@ax-templates/core';

export const stagesCommand = new Command('stages')
  .description('List all pipeline stages')
  .argument('[stage-id]', 'Show details for a specific stage')
  .option('-a, --all', 'Show all details including inputs/outputs')
  .action(async (stageId?: string, options?: { all?: boolean }) => {
    if (stageId) {
      await showStageDetails(stageId, options?.all);
    } else {
      await listStages();
    }
  });

async function listStages() {
  const stages = getAllStages();
  const progress = loadProgress();

  console.log();
  console.log(chalk.cyan.bold('📋 파이프라인 스테이지'));
  console.log(chalk.gray('═'.repeat(60)));
  console.log();

  for (const stage of stages) {
    const stageProgress = progress.stages[stage.id];
    const status = stageProgress?.status || 'pending';
    const isCurrent = progress.currentStage === stage.id;

    const statusIcon = getStatusIcon(status);
    const statusColor = getStatusColor(status);

    let line = `${statusIcon} ${chalk.white.bold(stage.id.padEnd(25))} ${stage.name}`;

    if (isCurrent) {
      line = chalk.cyan(line + ' ← 현재');
    } else {
      line = statusColor(line);
    }

    console.log(line);

    // Show AI models
    const models = stage.models.join(', ');
    console.log(chalk.gray(`   AI: ${models} | Mode: ${stage.mode}`));
    console.log();
  }

  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.gray('상세 정보: ax stages <stage-id>'));
}

async function showStageDetails(stageId: string, showAll: boolean = false) {
  const stage = getStage(stageId);

  if (!stage) {
    console.error(chalk.red(`스테이지를 찾을 수 없습니다: ${stageId}`));
    console.log();
    console.log(chalk.gray('사용 가능한 스테이지:'));
    const stages = getAllStages();
    for (const s of stages) {
      console.log(chalk.gray(`  - ${s.id}`));
    }
    process.exit(1);
  }

  const progress = loadProgress();
  const stageProgress = progress.stages[stage.id];
  const status = stageProgress?.status || 'pending';
  const stageConfig = getStageConfig(stage.id);

  console.log();

  // Header
  const headerContent = [
    chalk.white.bold(stage.name),
    chalk.gray(`ID: ${stage.id}`),
  ].join('\n');

  console.log(boxen(headerContent, {
    padding: { left: 2, right: 2, top: 0, bottom: 0 },
    borderStyle: 'round',
    borderColor: 'cyan',
  }));

  console.log();

  // Status
  const statusIcon = getStatusIcon(status);
  const statusText = getStatusText(status);
  console.log(chalk.white.bold('상태:'), statusIcon, statusText);

  if (stageProgress?.startedAt) {
    console.log(chalk.gray(`  시작: ${stageProgress.startedAt}`));
  }
  if (stageProgress?.completedAt) {
    console.log(chalk.gray(`  완료: ${stageProgress.completedAt}`));
  }

  console.log();

  // Configuration
  console.log(chalk.white.bold('설정:'));
  console.log(`  AI 모델: ${chalk.yellow(stage.models.join(', '))}`);
  console.log(`  실행 모드: ${chalk.yellow(stage.mode)}`);
  console.log(`  타임아웃: ${chalk.yellow(stageConfig.timeout + '초')}`);
  console.log(`  체크포인트 필수: ${stage.checkpoint_required ? chalk.green('예') : chalk.gray('아니오')}`);

  if (showAll) {
    console.log();

    // Inputs
    console.log(chalk.white.bold('입력 (Inputs):'));
    if (stage.inputs.length === 0) {
      console.log(chalk.gray('  (없음)'));
    } else {
      for (const input of stage.inputs) {
        console.log(chalk.gray(`  - ${input}`));
      }
    }

    console.log();

    // Outputs
    console.log(chalk.white.bold('출력 (Outputs):'));
    if (stage.outputs.length === 0) {
      console.log(chalk.gray('  (없음)'));
    } else {
      for (const output of stage.outputs) {
        console.log(chalk.gray(`  - ${output}`));
      }
    }

    // Dependencies (previous stage)
    const prevStage = getPreviousStage(stage.id);
    if (prevStage) {
      console.log();
      console.log(chalk.white.bold('의존성 (이전 스테이지):'));
      console.log(chalk.gray(`  - ${prevStage.id}`));
    }
  }

  console.log();

  // Actions
  if (status === 'pending' || status === 'failed') {
    console.log(chalk.white(`실행: ${chalk.cyan(`ax run-stage ${stage.id}`)}`));
  } else if (status === 'in_progress') {
    console.log(chalk.yellow('이 스테이지가 현재 진행 중입니다.'));
  }
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
      return chalk.green('완료');
    case 'in_progress':
      return chalk.yellow('진행 중');
    case 'failed':
      return chalk.red('실패');
    case 'skipped':
      return chalk.gray('스킵');
    default:
      return chalk.gray('대기');
  }
}

function getStatusColor(status?: string): (text: string) => string {
  switch (status) {
    case 'completed':
      return chalk.green;
    case 'in_progress':
      return chalk.yellow;
    case 'failed':
      return chalk.red;
    default:
      return chalk.gray;
  }
}
