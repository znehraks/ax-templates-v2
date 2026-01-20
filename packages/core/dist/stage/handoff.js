/**
 * @ax-templates/core - Handoff Generator
 * Generates HANDOFF.md documents for stage transitions
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { loadConfig } from '../config/index.js';
import { getStage, getNextStage, validateStageOutputs } from './manager.js';
// ============================================
// Handoff Template
// ============================================
const HANDOFF_TEMPLATE = `# HANDOFF - {{STAGE_NAME}}

> 생성 시간: {{TIMESTAMP}}
> 스테이지: {{STAGE_ID}}

---

## 1. 완료 요약

### 완료된 작업
{{COMPLETED_TASKS}}

### 핵심 결정사항
{{KEY_DECISIONS}}

### 성공한 접근법
{{SUCCESSFUL_APPROACHES}}

### 실패한 접근법
{{FAILED_APPROACHES}}

---

## 2. 산출물

| 파일 | 설명 |
|------|------|
{{OUTPUTS_TABLE}}

---

## 3. 다음 스테이지: {{NEXT_STAGE_NAME}}

### 즉시 실행 작업
{{IMMEDIATE_ACTIONS}}

### 선행 조건
{{PREREQUISITES}}

---

## 4. 컨텍스트

### 체크포인트
{{CHECKPOINT_REF}}

### AI 호출 기록

| AI | 시간 | 프롬프트 | 결과 | 상태 |
|----|------|---------|------|------|
{{AI_CALLS_TABLE}}

---

## 5. 참고 사항
{{NOTES}}
`;
/**
 * Generates a HANDOFF.md document for a stage
 */
export function generateHandoff(options) {
    const { stageId, projectDir = process.cwd(), completedTasks = [], keyDecisions = [], successfulApproaches = [], failedApproaches = [], outputDescriptions = {}, immediateActions = [], prerequisites = [], checkpointRef, aiCalls = [], notes = '', } = options;
    const stage = getStage(stageId, projectDir);
    if (!stage) {
        throw new Error(`Stage not found: ${stageId}`);
    }
    const nextStage = getNextStage(stageId, projectDir);
    const outputValidation = validateStageOutputs(stageId, projectDir);
    // Build template variables
    const timestamp = new Date().toISOString();
    const completedTasksList = completedTasks.length > 0
        ? completedTasks.map(t => `- [x] ${t}`).join('\n')
        : '- [ ] (작업 내용을 기록하세요)';
    const keyDecisionsList = keyDecisions.length > 0
        ? keyDecisions.map(d => `- ${d}`).join('\n')
        : '- (주요 결정사항을 기록하세요)';
    const successfulList = successfulApproaches.length > 0
        ? successfulApproaches.map(a => `- ${a}`).join('\n')
        : '- (성공한 접근법을 기록하세요)';
    const failedList = failedApproaches.length > 0
        ? failedApproaches.map(a => `- ${a}`).join('\n')
        : '- (없음)';
    // Build outputs table
    const outputsTable = outputValidation.present.length > 0
        ? outputValidation.present.map(o => {
            const desc = outputDescriptions[o] ?? '생성됨';
            return `| ${o} | ${desc} |`;
        }).join('\n')
        : '| (산출물 없음) | - |';
    // Next stage info
    const nextStageName = nextStage?.name ?? '파이프라인 완료';
    const immediateList = immediateActions.length > 0
        ? immediateActions.map(a => `1. ${a}`).join('\n')
        : '1. (다음 작업을 정의하세요)';
    const prereqList = prerequisites.length > 0
        ? prerequisites.map(p => `- ${p}`).join('\n')
        : '- (없음)';
    // Checkpoint
    const checkpointText = checkpointRef
        ? `체크포인트 ID: \`${checkpointRef}\``
        : '체크포인트 없음';
    // AI calls table
    const aiCallsTable = aiCalls.length > 0
        ? aiCalls.map(c => `| ${c.model} | ${c.time} | ${c.prompt} | ${c.result} | ${c.status === 'success' ? '✅' : '❌'} |`).join('\n')
        : '| (AI 호출 없음) | - | - | - | - |';
    // Replace template variables
    let content = HANDOFF_TEMPLATE
        .replace('{{STAGE_NAME}}', stage.name)
        .replace('{{TIMESTAMP}}', timestamp)
        .replace('{{STAGE_ID}}', stageId)
        .replace('{{COMPLETED_TASKS}}', completedTasksList)
        .replace('{{KEY_DECISIONS}}', keyDecisionsList)
        .replace('{{SUCCESSFUL_APPROACHES}}', successfulList)
        .replace('{{FAILED_APPROACHES}}', failedList)
        .replace('{{OUTPUTS_TABLE}}', outputsTable)
        .replace('{{NEXT_STAGE_NAME}}', nextStageName)
        .replace('{{IMMEDIATE_ACTIONS}}', immediateList)
        .replace('{{PREREQUISITES}}', prereqList)
        .replace('{{CHECKPOINT_REF}}', checkpointText)
        .replace('{{AI_CALLS_TABLE}}', aiCallsTable)
        .replace('{{NOTES}}', notes || '(추가 참고사항 없음)');
    return content;
}
/**
 * Saves a HANDOFF.md document
 */
export function saveHandoff(stageId, content, projectDir = process.cwd()) {
    const config = loadConfig({ projectDir });
    const handoffPath = join(projectDir, config.paths.stages_output, stageId, 'HANDOFF.md');
    const dir = dirname(handoffPath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    writeFileSync(handoffPath, content);
    return handoffPath;
}
/**
 * Loads a HANDOFF.md document
 */
export function loadHandoff(stageId, projectDir = process.cwd()) {
    const config = loadConfig({ projectDir });
    const handoffPath = join(projectDir, config.paths.stages_output, stageId, 'HANDOFF.md');
    if (!existsSync(handoffPath)) {
        return null;
    }
    return readFileSync(handoffPath, 'utf-8');
}
/**
 * Checks if a handoff exists for a stage
 */
export function handoffExists(stageId, projectDir = process.cwd()) {
    const config = loadConfig({ projectDir });
    const handoffPath = join(projectDir, config.paths.stages_output, stageId, 'HANDOFF.md');
    return existsSync(handoffPath);
}
// ============================================
// Handoff Parsing (for context extraction)
// ============================================
/**
 * Parses a HANDOFF.md document to extract key information
 */
export function parseHandoff(content) {
    const result = {};
    // Initialize summary with default values
    const defaultSummary = {
        completedTasks: [],
        keyDecisions: [],
        successfulApproaches: [],
        failedApproaches: [],
    };
    // Extract completed tasks
    const tasksMatch = content.match(/### 완료된 작업\n([\s\S]*?)(?=\n###|---)/);
    if (tasksMatch) {
        result.summary = result.summary ?? { ...defaultSummary };
        result.summary.completedTasks = tasksMatch[1]
            .split('\n')
            .filter(line => line.startsWith('- [x]'))
            .map(line => line.replace(/^- \[x\] /, '').trim());
    }
    // Extract key decisions
    const decisionsMatch = content.match(/### 핵심 결정사항\n([\s\S]*?)(?=\n###|---)/);
    if (decisionsMatch) {
        result.summary = result.summary ?? { ...defaultSummary };
        result.summary.keyDecisions = decisionsMatch[1]
            .split('\n')
            .filter(line => line.startsWith('- '))
            .map(line => line.replace(/^- /, '').trim());
    }
    // Extract next stage info
    const nextStageMatch = content.match(/## 3\. 다음 스테이지: (.+)/);
    if (nextStageMatch) {
        result.nextStage = result.nextStage ?? { id: '', name: '', immediateActions: [], prerequisites: [] };
        result.nextStage.name = nextStageMatch[1].trim();
    }
    return result;
}
//# sourceMappingURL=handoff.js.map