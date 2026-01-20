/**
 * ax-templates CLI - Config Command
 * Manage configuration
 */
import { Command } from 'commander';
import chalk from 'chalk';
import * as yaml from 'yaml';
import * as fs from 'fs';
import * as path from 'path';
import { loadConfig, validateConfigFile, CONFIG_FILENAME, } from '@ax-templates/core';
export const configCommand = new Command('config')
    .description('Manage configuration')
    .argument('[action]', 'Action: show, get, set, validate, path (default: show)')
    .argument('[key]', 'Config key for get/set')
    .argument('[value]', 'Value for set')
    .option('--json', 'Output as JSON')
    .action(async (action, key, value, options) => {
    const normalizedAction = action || 'show';
    switch (normalizedAction) {
        case 'show':
            await executeShow(options?.json);
            break;
        case 'get':
            await executeGet(key, options?.json);
            break;
        case 'set':
            await executeSet(key, value);
            break;
        case 'validate':
            await executeValidate();
            break;
        case 'path':
            await executePath();
            break;
        default:
            console.error(chalk.red(`알 수 없는 액션: ${action}`));
            console.log(chalk.gray('사용 가능: show, get, set, validate, path'));
            process.exit(1);
    }
});
async function executeShow(asJson = false) {
    const config = loadConfig();
    if (asJson) {
        console.log(JSON.stringify(config, null, 2));
        return;
    }
    console.log();
    console.log(chalk.cyan.bold('⚙️  현재 설정'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log();
    // Version
    console.log(chalk.white.bold('ax-templates:'));
    console.log(`  버전: ${chalk.cyan(config.ax_templates.version)}`);
    console.log();
    // Paths
    console.log(chalk.white.bold('경로:'));
    console.log(`  프로젝트 루트: ${chalk.yellow(config.paths.project_root)}`);
    console.log(`  스테이지 출력: ${chalk.yellow(config.paths.stages_output)}`);
    console.log(`  상태: ${chalk.yellow(config.paths.state)}`);
    console.log(`  체크포인트: ${chalk.yellow(config.paths.checkpoints)}`);
    console.log();
    // AI
    console.log(chalk.white.bold('AI CLI:'));
    console.log(`  Gemini: ${config.ai.gemini ? chalk.green('활성화') : chalk.gray('비활성화')}`);
    console.log(`  Codex: ${config.ai.codex ? chalk.green('활성화') : chalk.gray('비활성화')}`);
    console.log();
    // tmux
    console.log(chalk.white.bold('tmux:'));
    console.log(`  Gemini 세션: ${chalk.yellow(config.tmux.gemini_session)}`);
    console.log(`  Codex 세션: ${chalk.yellow(config.tmux.codex_session)}`);
    console.log(`  출력 타임아웃: ${config.tmux.output_timeout}초`);
    console.log();
    // Context
    console.log(chalk.white.bold('컨텍스트 임계값:'));
    console.log(`  경고: ${chalk.yellow(config.context.warning + '%')}`);
    console.log(`  액션: ${chalk.rgb(255, 165, 0)(config.context.action + '%')}`);
    console.log(`  크리티컬: ${chalk.red(config.context.critical + '%')}`);
    console.log(`  태스크 저장 주기: ${config.context.task_save_frequency}개`);
    console.log();
    // MCP
    console.log(chalk.white.bold('MCP 서버:'));
    console.log(`  검색: ${chalk.yellow(config.mcp.search.join(', ') || '(없음)')}`);
    console.log(`  브라우저: ${chalk.yellow(config.mcp.browser.join(', ') || '(없음)')}`);
    console.log();
    // Git
    console.log(chalk.white.bold('Git:'));
    console.log(`  커밋 언어: ${chalk.yellow(config.git.commit_language)}`);
    console.log(`  자동 커밋: ${config.git.auto_commit ? chalk.green('활성화') : chalk.gray('비활성화')}`);
}
async function executeGet(key, asJson = false) {
    if (!key) {
        console.error(chalk.red('키를 지정하세요.'));
        console.log(chalk.gray('예: ax config get paths.project_root'));
        process.exit(1);
    }
    const config = loadConfig();
    const value = getNestedValue(config, key);
    if (value === undefined) {
        console.error(chalk.red(`키를 찾을 수 없습니다: ${key}`));
        process.exit(1);
    }
    if (asJson) {
        console.log(JSON.stringify(value, null, 2));
    }
    else {
        if (typeof value === 'object') {
            console.log(yaml.stringify(value));
        }
        else {
            console.log(value);
        }
    }
}
async function executeSet(key, value) {
    if (!key || value === undefined) {
        console.error(chalk.red('키와 값을 지정하세요.'));
        console.log(chalk.gray('예: ax config set paths.project_root ./my-app'));
        process.exit(1);
    }
    // Find config file
    const configPath = path.resolve(process.cwd(), CONFIG_FILENAME);
    let currentConfig = {};
    if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        currentConfig = yaml.parse(content) || {};
    }
    // Parse value
    let parsedValue = value;
    // Try to parse as JSON/YAML
    try {
        if (value === 'true')
            parsedValue = true;
        else if (value === 'false')
            parsedValue = false;
        else if (!isNaN(Number(value)))
            parsedValue = Number(value);
        else if (value.startsWith('[') || value.startsWith('{')) {
            parsedValue = JSON.parse(value);
        }
    }
    catch {
        // Keep as string
    }
    // Set nested value
    setNestedValue(currentConfig, key, parsedValue);
    // Write config
    fs.writeFileSync(configPath, yaml.stringify(currentConfig), 'utf-8');
    console.log(chalk.green(`✓ 설정 업데이트됨: ${key} = ${JSON.stringify(parsedValue)}`));
}
async function executeValidate() {
    console.log();
    console.log(chalk.cyan.bold('🔍 설정 파일 검증'));
    console.log(chalk.gray('═'.repeat(50)));
    console.log();
    const configPath = path.resolve(process.cwd(), CONFIG_FILENAME);
    if (!fs.existsSync(configPath)) {
        console.log(chalk.yellow(`⚠️  설정 파일이 없습니다: ${configPath}`));
        console.log(chalk.gray('기본값이 사용됩니다.'));
        console.log(chalk.gray('생성: ax init'));
        return;
    }
    console.log(chalk.white(`파일: ${configPath}`));
    console.log();
    const result = validateConfigFile(configPath);
    if (result.valid) {
        console.log(chalk.green('✓ 설정 파일이 유효합니다.'));
    }
    else {
        console.log(chalk.red('✗ 설정 파일 오류:'));
        if (result.errors) {
            for (const error of result.errors) {
                console.log(chalk.red(`  - ${error}`));
            }
        }
        process.exit(1);
    }
}
async function executePath() {
    const configPath = path.resolve(process.cwd(), CONFIG_FILENAME);
    const exists = fs.existsSync(configPath);
    console.log(configPath);
    if (!exists) {
        console.error(chalk.gray('(파일 없음)'));
    }
}
function getNestedValue(obj, path) {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current === undefined || current === null) {
            return undefined;
        }
        current = current[key];
    }
    return current;
}
function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}
//# sourceMappingURL=config.js.map