/**
 * ax-templates CLI - Init Wizard
 * Interactive project initialization wizard
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import type { AxConfig } from '@ax-templates/core';

// ============================================
// Wizard Questions
// ============================================

export interface InitWizardAnswers {
  projectName: string;
  projectRoot: string;
  stagesOutput: string;
  stateDir: string;
  enableGemini: boolean;
  enableCodex: boolean;
  mcpSearch: string[];
  mcpBrowser: string[];
  geminiSession: string;
  codexSession: string;
  contextWarning: number;
  contextAction: number;
  contextCritical: number;
  commitLanguage: 'Korean' | 'English';
  autoCommit: boolean;
}

export async function runInitWizard(projectName?: string): Promise<InitWizardAnswers> {
  console.log();
  console.log(chalk.cyan.bold(' ax-templates 설정 마법사'));
  console.log(chalk.gray(' ─────────────────────────────────────────'));
  console.log();

  const answers = await inquirer.prompt<InitWizardAnswers>([
    // Section 1: Project Settings
    {
      type: 'input',
      name: 'projectName',
      message: '프로젝트 이름:',
      default: projectName || 'my-project',
      validate: (input: string) => {
        if (!input.trim()) return '프로젝트 이름을 입력하세요.';
        if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
          return '프로젝트 이름은 영문, 숫자, -, _ 만 사용할 수 있습니다.';
        }
        return true;
      },
    },

    // Section 2: Path Settings
    {
      type: 'input',
      name: 'projectRoot',
      message: '소스코드 위치:',
      default: (answers: { projectName: string }) => `./${answers.projectName}`,
    },
    {
      type: 'input',
      name: 'stagesOutput',
      message: '스테이지 산출물 위치:',
      default: './stages',
    },
    {
      type: 'input',
      name: 'stateDir',
      message: '상태 파일 위치:',
      default: './state',
    },

    // Section 3: AI CLI Selection
    {
      type: 'confirm',
      name: 'enableGemini',
      message: 'Gemini CLI 사용:',
      default: true,
    },
    {
      type: 'confirm',
      name: 'enableCodex',
      message: 'Codex CLI 사용:',
      default: true,
    },

    // Section 4: MCP Servers
    {
      type: 'checkbox',
      name: 'mcpSearch',
      message: '검색 MCP 서버 선택:',
      choices: [
        { name: 'context7', value: 'context7', checked: true },
        { name: 'exa', value: 'exa', checked: true },
        { name: 'firecrawl', value: 'firecrawl', checked: false },
      ],
    },
    {
      type: 'checkbox',
      name: 'mcpBrowser',
      message: '브라우저 MCP 서버 선택:',
      choices: [
        { name: 'playwright', value: 'playwright', checked: true },
        { name: 'puppeteer', value: 'puppeteer', checked: false },
      ],
    },

    // Section 5: tmux Sessions
    {
      type: 'input',
      name: 'geminiSession',
      message: 'Gemini tmux 세션명:',
      default: 'ax-gemini',
      when: (answers) => answers.enableGemini,
    },
    {
      type: 'input',
      name: 'codexSession',
      message: 'Codex tmux 세션명:',
      default: 'ax-codex',
      when: (answers) => answers.enableCodex,
    },

    // Section 6: Context Thresholds
    {
      type: 'number',
      name: 'contextWarning',
      message: '컨텍스트 경고 임계값 (%):',
      default: 60,
      validate: (input: number) => {
        if (input < 0 || input > 100) return '0-100 사이의 값을 입력하세요.';
        return true;
      },
    },
    {
      type: 'number',
      name: 'contextAction',
      message: '컨텍스트 액션 임계값 (%):',
      default: 50,
      validate: (input: number, answers?: { contextWarning: number }) => {
        if (input < 0 || input > 100) return '0-100 사이의 값을 입력하세요.';
        if (answers && input >= answers.contextWarning) {
          return '액션 임계값은 경고 임계값보다 작아야 합니다.';
        }
        return true;
      },
    },
    {
      type: 'number',
      name: 'contextCritical',
      message: '컨텍스트 크리티컬 임계값 (%):',
      default: 40,
      validate: (input: number, answers?: { contextAction: number }) => {
        if (input < 0 || input > 100) return '0-100 사이의 값을 입력하세요.';
        if (answers && input >= answers.contextAction) {
          return '크리티컬 임계값은 액션 임계값보다 작아야 합니다.';
        }
        return true;
      },
    },

    // Section 7: Git Settings
    {
      type: 'list',
      name: 'commitLanguage',
      message: '커밋 메시지 언어:',
      choices: [
        { name: '한국어', value: 'Korean' },
        { name: 'English', value: 'English' },
      ],
      default: 'Korean',
    },
    {
      type: 'confirm',
      name: 'autoCommit',
      message: '자동 커밋 활성화:',
      default: true,
    },
  ]);

  // Set defaults for conditional fields
  if (!answers.geminiSession) answers.geminiSession = 'ax-gemini';
  if (!answers.codexSession) answers.codexSession = 'ax-codex';

  return answers;
}

// ============================================
// Convert Answers to Config
// ============================================

export function answersToConfig(answers: InitWizardAnswers): Partial<AxConfig> {
  return {
    ax_templates: {
      version: '2.0.0',
    },
    paths: {
      project_root: answers.projectRoot,
      stages_output: answers.stagesOutput,
      state: answers.stateDir,
      checkpoints: `${answers.stateDir}/checkpoints`,
    },
    ai: {
      gemini: answers.enableGemini,
      codex: answers.enableCodex,
    },
    tmux: {
      gemini_session: answers.geminiSession,
      codex_session: answers.codexSession,
      output_timeout: 300,
    },
    context: {
      warning: answers.contextWarning,
      action: answers.contextAction,
      critical: answers.contextCritical,
      task_save_frequency: 5,
    },
    mcp: {
      search: answers.mcpSearch,
      browser: answers.mcpBrowser,
    },
    git: {
      commit_language: answers.commitLanguage,
      auto_commit: answers.autoCommit,
    },
  };
}

// ============================================
// Quick Init (Non-Interactive)
// ============================================

export function getQuickInitConfig(projectName: string): Partial<AxConfig> {
  return {
    ax_templates: {
      version: '2.0.0',
    },
    paths: {
      project_root: `./${projectName}`,
      stages_output: './stages',
      state: './state',
      checkpoints: './state/checkpoints',
    },
    ai: {
      gemini: true,
      codex: true,
    },
    tmux: {
      gemini_session: 'ax-gemini',
      codex_session: 'ax-codex',
      output_timeout: 300,
    },
    context: {
      warning: 60,
      action: 50,
      critical: 40,
      task_save_frequency: 5,
    },
    mcp: {
      search: ['context7', 'exa'],
      browser: ['playwright'],
    },
    git: {
      commit_language: 'Korean',
      auto_commit: true,
    },
  };
}
