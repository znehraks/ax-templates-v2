/**
 * @ax-templates/core - Handoff Tests
 * Tests for HANDOFF.md generation and parsing
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stringify as yamlStringify } from 'yaml';
import {
  generateHandoff,
  saveHandoff,
  loadHandoff,
  handoffExists,
  parseHandoff,
} from '../handoff.js';

// Test helpers
let tempDir: string;

function createTempDir(): string {
  const dir = join(tmpdir(), `ax-handoff-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanupDir(dir: string): void {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
  }
}

function setupTestProject(dir: string): void {
  // Create directory structure
  mkdirSync(join(dir, 'state'), { recursive: true });
  mkdirSync(join(dir, 'config'), { recursive: true });

  // Create .ax-config.yaml
  const config = {
    ax_templates: { version: '2.0.0' },
    paths: {
      project_root: './',
      stages_output: './stages',
      state: './state',
      checkpoints: './state/checkpoints',
    },
  };
  writeFileSync(join(dir, '.ax-config.yaml'), yamlStringify(config));

  // Create pipeline.yaml
  const pipeline = {
    name: 'Test Pipeline',
    version: '1.0.0',
    stages: [
      {
        id: '01-brainstorm',
        name: 'Brainstorming',
        models: ['gemini'],
        mode: 'yolo',
        inputs: ['project_brief.md'],
        outputs: ['ideas.md', 'HANDOFF.md'],
        timeout: 3600,
      },
      {
        id: '02-research',
        name: 'Research',
        models: ['claude'],
        mode: 'plan',
        inputs: ['ideas.md'],
        outputs: ['research.md', 'HANDOFF.md'],
        timeout: 7200,
      },
      {
        id: '03-planning',
        name: 'Planning',
        models: ['gemini'],
        mode: 'plan',
        inputs: ['research.md'],
        outputs: ['architecture.md', 'HANDOFF.md'],
        timeout: 3600,
      },
    ],
  };
  writeFileSync(join(dir, 'config', 'pipeline.yaml'), yamlStringify(pipeline));

  // Create progress.json
  writeFileSync(join(dir, 'state', 'progress.json'), JSON.stringify({
    currentStage: null,
    stages: {},
    lastUpdated: new Date().toISOString(),
    version: '2.0.0',
  }));
}

function createStageOutputs(dir: string, stageId: string, files: string[]): void {
  const outputDir = join(dir, 'stages', stageId, 'outputs');
  mkdirSync(outputDir, { recursive: true });
  for (const file of files) {
    writeFileSync(join(outputDir, file), `# ${file}\nTest content`);
  }
}

describe('generateHandoff', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should throw for non-existent stage', () => {
    expect(() => generateHandoff({ stageId: '99-nonexistent', projectDir: tempDir })).toThrow('Stage not found');
  });

  it('should generate basic handoff content', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
    });

    expect(content).toContain('# HANDOFF - Brainstorming');
    expect(content).toContain('스테이지: 01-brainstorm');
  });

  it('should include completed tasks', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      completedTasks: ['아이디어 브레인스토밍', '요구사항 분석'],
    });

    expect(content).toContain('- [x] 아이디어 브레인스토밍');
    expect(content).toContain('- [x] 요구사항 분석');
  });

  it('should include key decisions', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      keyDecisions: ['React 프레임워크 선택', 'TypeScript 사용 결정'],
    });

    expect(content).toContain('- React 프레임워크 선택');
    expect(content).toContain('- TypeScript 사용 결정');
  });

  it('should include successful approaches', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      successfulApproaches: ['마인드맵 기법 사용', '사용자 페르소나 정의'],
    });

    expect(content).toContain('### 성공한 접근법');
    expect(content).toContain('- 마인드맵 기법 사용');
  });

  it('should include failed approaches', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      failedApproaches: ['너무 많은 기능 동시 기획'],
    });

    expect(content).toContain('### 실패한 접근법');
    expect(content).toContain('- 너무 많은 기능 동시 기획');
  });

  it('should include outputs table', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md', 'HANDOFF.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      outputDescriptions: {
        'ideas.md': '핵심 아이디어 정리',
      },
    });

    expect(content).toContain('## 2. 산출물');
    expect(content).toContain('| ideas.md | 핵심 아이디어 정리 |');
    expect(content).toContain('| HANDOFF.md | 생성됨 |');
  });

  it('should include next stage information', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
    });

    expect(content).toContain('## 3. 다음 스테이지: Research');
  });

  it('should show pipeline complete for last stage', () => {
    createStageOutputs(tempDir, '03-planning', ['architecture.md']);

    const content = generateHandoff({
      stageId: '03-planning',
      projectDir: tempDir,
    });

    expect(content).toContain('다음 스테이지: 파이프라인 완료');
  });

  it('should include immediate actions', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      immediateActions: ['기술 리서치 시작', '경쟁사 분석'],
    });

    expect(content).toContain('### 즉시 실행 작업');
    expect(content).toContain('1. 기술 리서치 시작');
    expect(content).toContain('1. 경쟁사 분석');
  });

  it('should include prerequisites', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      prerequisites: ['API 키 설정 필요'],
    });

    expect(content).toContain('### 선행 조건');
    expect(content).toContain('- API 키 설정 필요');
  });

  it('should include checkpoint reference', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      checkpointRef: 'cp-01-2024-01-01T00-00-00',
    });

    expect(content).toContain('### 체크포인트');
    expect(content).toContain('체크포인트 ID: `cp-01-2024-01-01T00-00-00`');
  });

  it('should include AI calls table', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      aiCalls: [
        {
          model: 'gemini',
          time: '14:30',
          prompt: 'prompts/brainstorm.md',
          result: 'outputs/ideas.md',
          status: 'success',
        },
        {
          model: 'claudecode',
          time: '14:45',
          prompt: 'prompts/review.md',
          result: 'outputs/review.md',
          status: 'failure',
        },
      ],
    });

    expect(content).toContain('### AI 호출 기록');
    expect(content).toContain('| gemini | 14:30 | prompts/brainstorm.md | outputs/ideas.md | ✅ |');
    expect(content).toContain('| claudecode | 14:45 | prompts/review.md | outputs/review.md | ❌ |');
  });

  it('should include notes', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      notes: '다음 세션에서 UI 디자인 검토 필요',
    });

    expect(content).toContain('## 5. 참고 사항');
    expect(content).toContain('다음 세션에서 UI 디자인 검토 필요');
  });
});

describe('saveHandoff', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should save handoff to correct location', () => {
    const content = '# Test Handoff\n\nContent here';
    const path = saveHandoff('01-brainstorm', content, tempDir);

    expect(path).toBe(join(tempDir, 'stages', '01-brainstorm', 'HANDOFF.md'));
    expect(existsSync(path)).toBe(true);

    const saved = readFileSync(path, 'utf-8');
    expect(saved).toBe(content);
  });

  it('should create directory if not exists', () => {
    const content = '# Test Handoff';
    saveHandoff('01-brainstorm', content, tempDir);

    expect(existsSync(join(tempDir, 'stages', '01-brainstorm'))).toBe(true);
  });

  it('should overwrite existing handoff', () => {
    const firstContent = '# First Handoff';
    const secondContent = '# Second Handoff';

    saveHandoff('01-brainstorm', firstContent, tempDir);
    saveHandoff('01-brainstorm', secondContent, tempDir);

    const path = join(tempDir, 'stages', '01-brainstorm', 'HANDOFF.md');
    const saved = readFileSync(path, 'utf-8');
    expect(saved).toBe(secondContent);
  });
});

describe('loadHandoff', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return null when handoff does not exist', () => {
    const content = loadHandoff('01-brainstorm', tempDir);
    expect(content).toBeNull();
  });

  it('should load existing handoff', () => {
    const originalContent = '# Test Handoff\n\nWith content';
    saveHandoff('01-brainstorm', originalContent, tempDir);

    const loaded = loadHandoff('01-brainstorm', tempDir);
    expect(loaded).toBe(originalContent);
  });
});

describe('handoffExists', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should return false when handoff does not exist', () => {
    expect(handoffExists('01-brainstorm', tempDir)).toBe(false);
  });

  it('should return true when handoff exists', () => {
    saveHandoff('01-brainstorm', '# Handoff', tempDir);
    expect(handoffExists('01-brainstorm', tempDir)).toBe(true);
  });
});

describe('parseHandoff', () => {
  it('should extract completed tasks', () => {
    const content = `# HANDOFF - Test

### 완료된 작업
- [x] 첫 번째 작업
- [x] 두 번째 작업
- [ ] 미완료 작업

### 핵심 결정사항
`;

    const parsed = parseHandoff(content);

    expect(parsed.summary?.completedTasks).toContain('첫 번째 작업');
    expect(parsed.summary?.completedTasks).toContain('두 번째 작업');
    expect(parsed.summary?.completedTasks).not.toContain('미완료 작업');
  });

  it('should extract key decisions', () => {
    const content = `# HANDOFF - Test

### 완료된 작업
- [x] 작업

### 핵심 결정사항
- React 사용 결정
- TypeScript 도입

---
`;

    const parsed = parseHandoff(content);

    expect(parsed.summary?.keyDecisions).toContain('React 사용 결정');
    expect(parsed.summary?.keyDecisions).toContain('TypeScript 도입');
  });

  it('should extract next stage name', () => {
    const content = `# HANDOFF - Test

## 3. 다음 스테이지: Research

### 즉시 실행 작업
`;

    const parsed = parseHandoff(content);

    expect(parsed.nextStage?.name).toBe('Research');
  });

  it('should handle empty sections gracefully', () => {
    const content = `# HANDOFF - Test

### 완료된 작업
- [ ] (작업 내용을 기록하세요)

### 핵심 결정사항
- (주요 결정사항을 기록하세요)
`;

    const parsed = parseHandoff(content);

    // Should not throw, should return empty arrays or default values
    expect(parsed.summary?.completedTasks).toHaveLength(0);
  });
});

describe('Integration: Generate and Parse', () => {
  beforeEach(() => {
    tempDir = createTempDir();
    setupTestProject(tempDir);
  });

  afterEach(() => {
    cleanupDir(tempDir);
  });

  it('should be able to parse generated handoff', () => {
    createStageOutputs(tempDir, '01-brainstorm', ['ideas.md', 'HANDOFF.md']);

    const content = generateHandoff({
      stageId: '01-brainstorm',
      projectDir: tempDir,
      completedTasks: ['아이디어 정리', '요구사항 분석'],
      keyDecisions: ['React 선택', 'Tailwind CSS 사용'],
    });

    const parsed = parseHandoff(content);

    expect(parsed.summary?.completedTasks).toContain('아이디어 정리');
    expect(parsed.summary?.completedTasks).toContain('요구사항 분석');
    expect(parsed.summary?.keyDecisions).toContain('React 선택');
    expect(parsed.nextStage?.name).toBe('Research');
  });
});
