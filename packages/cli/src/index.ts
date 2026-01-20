#!/usr/bin/env node

/**
 * ax-templates CLI
 * Multi-AI Workflow Pipeline Command Line Interface
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from '@ax-templates/core';

// Import commands
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { stagesCommand } from './commands/stages.js';
import { runStageCommand } from './commands/run-stage.js';
import { nextCommand } from './commands/next.js';
import { handoffCommand } from './commands/handoff.js';
import { checkpointCommand } from './commands/checkpoint.js';
import { restoreCommand } from './commands/restore.js';
import { contextCommand } from './commands/context.js';
import { configCommand } from './commands/config.js';
import { geminiCommand } from './commands/gemini.js';
import { codexCommand } from './commands/codex.js';

// Create main program
const program = new Command();

program
  .name('ax')
  .description('Multi-AI Workflow Pipeline CLI')
  .version(VERSION, '-v, --version', 'Display version number');

// ============================================
// Core Commands
// ============================================

program.addCommand(initCommand);
program.addCommand(statusCommand);
program.addCommand(stagesCommand);
program.addCommand(runStageCommand);
program.addCommand(nextCommand);
program.addCommand(handoffCommand);
program.addCommand(checkpointCommand);
program.addCommand(restoreCommand);
program.addCommand(contextCommand);
program.addCommand(configCommand);

// ============================================
// AI Commands
// ============================================

program.addCommand(geminiCommand);
program.addCommand(codexCommand);

// ============================================
// Stage Shortcut Commands
// ============================================

const stageShortcuts = [
  { name: 'brainstorm', stage: '01-brainstorm', desc: 'Start brainstorming stage' },
  { name: 'research', stage: '02-research', desc: 'Start research stage' },
  { name: 'planning', stage: '03-planning', desc: 'Start planning stage' },
  { name: 'ui-ux', stage: '04-ui-ux', desc: 'Start UI/UX planning stage' },
  { name: 'tasks', stage: '05-task-management', desc: 'Start task management stage' },
  { name: 'implement', stage: '06-implementation', desc: 'Start implementation stage' },
  { name: 'refactor', stage: '07-refactoring', desc: 'Start refactoring stage' },
  { name: 'qa', stage: '08-qa', desc: 'Start QA stage' },
  { name: 'test', stage: '09-testing', desc: 'Start testing stage' },
  { name: 'deploy', stage: '10-deployment', desc: 'Start deployment stage' },
];

for (const shortcut of stageShortcuts) {
  program
    .command(shortcut.name)
    .description(shortcut.desc)
    .option('--dry-run', 'Validate inputs without starting')
    .action(async (options) => {
      const { executeRunStage } = await import('./commands/run-stage.js');
      await executeRunStage(shortcut.stage, options);
    });
}

// ============================================
// Error Handling
// ============================================

program.configureOutput({
  outputError: (str, write) => {
    write(chalk.red(str));
  },
});

// Parse and execute
program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
