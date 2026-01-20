/**
 * ax-templates CLI - Handoff Command
 * Generate HANDOFF.md for current stage
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  loadProgress,
  getCurrentStage,
  getStage,
  validateStageOutputs,
  generateHandoff,
  saveHandoff,
  handoffExists,
  loadHandoff,
  getAICallLogs,
  type GenerateHandoffOptions,
} from '@ax-templates/core';

export const handoffCommand = new Command('handoff')
  .description('Generate HANDOFF.md for current or specified stage')
  .argument('[stage-id]', 'Stage ID (defaults to current stage)')
  .option('-i, --interactive', 'Interactive mode for detailed handoff')
  .option('-f, --force', 'Overwrite existing HANDOFF.md')
  .action(async (stageId?: string, options?: { interactive?: boolean; force?: boolean }) => {
    await executeHandoff(stageId, options);
  });

async function executeHandoff(
  stageId?: string,
  options: { interactive?: boolean; force?: boolean } = {}
) {
  // Determine stage
  let stage = stageId ? getStage(stageId) : getCurrentStage();

  if (!stage) {
    if (stageId) {
      console.error(chalk.red(`스테이지를 찾을 수 없습니다: ${stageId}`));
    } else {
      console.error(chalk.red('현재 진행 중인 스테이지가 없습니다.'));
      console.log(chalk.gray('스테이지 지정: ax handoff <stage-id>'));
    }
    process.exit(1);
  }

  console.log();
  console.log(chalk.cyan.bold(`📝 HANDOFF.md 생성: ${stage.name}`));
  console.log(chalk.gray('═'.repeat(50)));
  console.log();

  // Check if HANDOFF.md already exists
  if (handoffExists(stage.id) && !options.force) {
    console.log(chalk.yellow('⚠️  HANDOFF.md가 이미 존재합니다.'));

    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: '덮어쓰시겠습니까?',
      default: false,
    }]);

    if (!overwrite) {
      console.log(chalk.gray('취소되었습니다.'));
      return;
    }
  }

  // Validate outputs
  console.log(chalk.white('산출물 확인 중...'));
  const outputValidation = validateStageOutputs(stage.id);

  if (!outputValidation.valid) {
    console.log(chalk.yellow('⚠️  일부 산출물이 누락되었습니다:'));
    for (const missing of outputValidation.missing) {
      console.log(chalk.yellow(`  - ${missing}`));
    }
  } else {
    console.log(chalk.green('✓ 모든 산출물 생성됨'));
  }

  console.log();

  // Gather handoff options
  let handoffOptions: GenerateHandoffOptions;

  if (options.interactive) {
    handoffOptions = await gatherInteractiveOptions(stage.id, outputValidation.present);
  } else {
    handoffOptions = await gatherQuickOptions(stage.id, outputValidation.present);
  }

  // Generate handoff
  console.log();
  console.log(chalk.white('HANDOFF.md 생성 중...'));

  const handoffContent = generateHandoff(handoffOptions);
  saveHandoff(stage.id, handoffContent);

  console.log(chalk.green('✓ HANDOFF.md 생성 완료'));
  console.log(chalk.gray(`  위치: stages/${stage.id}/HANDOFF.md`));

  // Show preview
  console.log();
  console.log(chalk.white.bold('미리보기:'));
  console.log(chalk.gray('─'.repeat(50)));

  const preview = handoffContent.substring(0, 800);
  console.log(chalk.gray(preview));

  if (handoffContent.length > 800) {
    console.log(chalk.gray('...'));
  }

  console.log();
  console.log(chalk.cyan('다음 스테이지 전환: ax next'));
}

async function gatherInteractiveOptions(
  stageId: string,
  completedOutputs: string[]
): Promise<GenerateHandoffOptions> {
  const stage = getStage(stageId)!;
  const aiLogs = getAICallLogs();

  const answers = await inquirer.prompt([
    {
      type: 'editor',
      name: 'completedTasks',
      message: '완료된 작업 목록을 입력하세요 (마크다운):',
      default: completedOutputs.map(o => `- [x] ${o} 생성`).join('\n'),
    },
    {
      type: 'editor',
      name: 'keyDecisions',
      message: '핵심 결정사항을 입력하세요:',
      default: '- \n- \n- ',
    },
    {
      type: 'editor',
      name: 'successfulApproaches',
      message: '성공한 접근법을 입력하세요:',
      default: '- \n- ',
    },
    {
      type: 'editor',
      name: 'failedApproaches',
      message: '실패한 접근법을 입력하세요:',
      default: '- \n- ',
    },
    {
      type: 'editor',
      name: 'nextActions',
      message: '다음 단계 작업을 입력하세요:',
      default: '1. \n2. \n3. ',
    },
    {
      type: 'input',
      name: 'checkpointRef',
      message: '체크포인트 참조 (없으면 빈칸):',
      default: '',
    },
  ]);

  // Convert AI logs to handoff format
  const aiCalls = aiLogs
    .filter(log => log.status !== 'pending')
    .slice(-10) // Last 10 calls
    .map(log => ({
      model: log.provider,
      time: log.timestamp,
      prompt: log.promptFile || log.prompt.substring(0, 50) + '...',
      result: log.outputFile || '(inline)',
      status: log.status === 'success' ? 'success' as const : 'failure' as const,
    }));

  return {
    stageId,
    completedTasks: answers.completedTasks.split('\n').filter((l: string) => l.trim()),
    keyDecisions: answers.keyDecisions.split('\n').filter((l: string) => l.trim()),
    successfulApproaches: answers.successfulApproaches.split('\n').filter((l: string) => l.trim()),
    failedApproaches: answers.failedApproaches.split('\n').filter((l: string) => l.trim()),
    immediateActions: answers.nextActions.split('\n').filter((l: string) => l.trim()),
    aiCalls,
    checkpointRef: answers.checkpointRef || undefined,
  };
}

async function gatherQuickOptions(
  stageId: string,
  completedOutputs: string[]
): Promise<GenerateHandoffOptions> {
  const stage = getStage(stageId)!;
  const aiLogs = getAICallLogs();

  // Convert AI logs to handoff format
  const aiCalls = aiLogs
    .filter(log => log.status !== 'pending')
    .slice(-10)
    .map(log => ({
      model: log.provider,
      time: log.timestamp,
      prompt: log.promptFile || log.prompt.substring(0, 50) + '...',
      result: log.outputFile || '(inline)',
      status: log.status === 'success' ? 'success' as const : 'failure' as const,
    }));

  // Quick mode: auto-generate basic handoff
  return {
    stageId,
    completedTasks: completedOutputs.map(o => `${o} 생성 완료`),
    keyDecisions: ['(핸드오프 자동 생성됨 - 상세 내용 추가 권장)'],
    successfulApproaches: [],
    failedApproaches: [],
    immediateActions: stage.outputs.map(o => `${o} 검토 및 활용`),
    aiCalls,
  };
}
