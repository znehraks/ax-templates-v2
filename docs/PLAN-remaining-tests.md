# ax-templates 남은 작업: 테스트 구현

## 📋 개요

Phase 1~4 구현 완료 후 남은 테스트 작업 목록입니다.

**현재 상태**: 문서화 & 배포 준비 완료
**남은 작업**: 테스트 코드 작성

---

## 🧪 Phase 1: Core 패키지 단위 테스트

### 위치
`packages/core/src/__tests__/`

### 테스트 대상

#### 1. Config 모듈 테스트
파일: `packages/core/src/__tests__/config.test.ts`

```typescript
// 테스트 케이스
- schema.ts: Zod 스키마 유효성 검증
  - 유효한 설정 파싱
  - 잘못된 설정 에러 처리
  - 선택적 필드 기본값

- loader.ts: YAML 로더
  - .ax-config.yaml 파일 로드
  - 파일 없을 때 기본값 반환
  - 잘못된 YAML 에러 처리

- merger.ts: 설정 병합
  - 기본값 + 사용자 설정 병합
  - 중첩 객체 딥 머지
  - 환경변수 오버라이드

- defaults.ts: 기본값
  - 모든 기본값 존재 확인
  - 스키마와 일치 확인
```

#### 2. Stage 모듈 테스트
파일: `packages/core/src/__tests__/stage.test.ts`

```typescript
// 테스트 케이스
- manager.ts: 스테이지 관리
  - 스테이지 목록 조회
  - 현재 스테이지 가져오기
  - 다음 스테이지 계산
  - 스테이지 전환 가능 여부 확인

- checkpoint.ts: 체크포인트
  - 체크포인트 생성
  - 체크포인트 목록
  - 체크포인트에서 복원

- handoff.ts: 핸드오프
  - HANDOFF.md 생성
  - 필수 항목 검증
  - 템플릿 변수 치환
```

#### 3. Context 모듈 테스트
파일: `packages/core/src/__tests__/context.test.ts`

```typescript
// 테스트 케이스
- manager.ts: 컨텍스트 관리
  - 상태 저장/로드
  - 임계값 체크 (60%, 50%, 40%)
  - 태스크 카운터
  - 압축 트리거
```

#### 4. AI 모듈 테스트
파일: `packages/core/src/__tests__/ai.test.ts`

```typescript
// 테스트 케이스
- wrapper.ts: AI 래퍼
  - tmux 세션 명령 생성
  - 타임아웃 처리
  - 출력 파싱
```

### 실행 방법
```bash
cd packages/core
pnpm test
pnpm test:watch  # 개발 중
```

---

## 🖥️ Phase 2: CLI 패키지 E2E 테스트

### 위치
`packages/cli/src/__tests__/`

### 테스트 대상

#### 1. 명령어 테스트
파일: `packages/cli/src/__tests__/commands.test.ts`

```typescript
// 테스트 케이스
- init.ts
  - 프로젝트 디렉토리 생성
  - .ax-config.yaml 생성
  - stages/ 복사
  - state/progress.json 초기화

- status.ts
  - 진행 상황 표시
  - JSON 출력 옵션

- stages.ts
  - 스테이지 목록 표시
  - 특정 스테이지 상세

- run-stage.ts
  - 스테이지 실행
  - --dry-run 옵션
  - 입력 검증

- next.ts
  - 다음 스테이지 전환
  - HANDOFF.md 필수 확인

- handoff.ts
  - HANDOFF.md 생성

- checkpoint.ts
  - 체크포인트 생성/목록/복원

- restore.ts
  - 체크포인트에서 복원

- context.ts
  - 컨텍스트 상태 표시

- config.ts
  - 설정 show/edit/reset
```

#### 2. 프롬프트 테스트
파일: `packages/cli/src/__tests__/prompts.test.ts`

```typescript
// 테스트 케이스
- init-wizard.ts
  - 인터랙티브 입력 시뮬레이션
  - 기본값 선택
  - 커스텀 값 입력
```

### E2E 테스트 설정
파일: `packages/cli/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
    testTimeout: 30000, // E2E는 시간 여유
  },
});
```

### 테스트 헬퍼
파일: `packages/cli/src/__tests__/helpers.ts`

```typescript
// 임시 디렉토리 생성
export function createTempProject(): string

// CLI 실행 헬퍼
export function runCli(args: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}>

// 정리
export function cleanupTempProject(path: string): void
```

### 실행 방법
```bash
cd packages/cli
pnpm test
pnpm test:watch
```

---

## 🔌 Phase 3: Plugin 설치 테스트

### 위치
`packages/plugin/__tests__/`

### 테스트 대상

#### 1. 구조 검증 테스트
파일: `packages/plugin/__tests__/structure.test.ts`

```typescript
// 테스트 케이스
- plugin.json 유효성
  - 필수 필드 존재
  - 버전 일치
  - 명령어 목록 일치

- CLAUDE.md 검증
  - 파일 존재
  - 템플릿 변수 형식 확인

- 명령어 파일 검증
  - .claude/commands/ 내 모든 .md 파일 존재
  - 21개 명령어 확인

- 스크립트 검증
  - scripts/*.sh 실행 권한
  - shebang 확인
```

#### 2. 설정 검증 테스트
파일: `packages/plugin/__tests__/config.test.ts`

```typescript
// 테스트 케이스
- .ax-config.schema.json 유효성
- config/defaults.yaml 로드 가능
- .claude/settings.json 유효성
```

#### 3. 통합 테스트 (수동)
파일: `packages/plugin/__tests__/MANUAL_TEST.md`

```markdown
# Plugin 수동 테스트 체크리스트

## 설치 테스트
- [ ] `claude plugin link ./packages/plugin` 성공
- [ ] Claude Code 재시작 후 플러그인 인식

## 명령어 테스트
- [ ] `/init-project test-app` 실행
- [ ] `/status` 표시
- [ ] `/stages` 목록
- [ ] `/brainstorm` 실행
- [ ] `/handoff` 생성
- [ ] `/next` 전환

## 설정 테스트
- [ ] .ax-config.yaml 수정 후 반영 확인
- [ ] 템플릿 변수 치환 확인
```

### 실행 방법
```bash
cd packages/plugin
pnpm test  # 자동 테스트
# 수동 테스트는 MANUAL_TEST.md 참조
```

---

## 📁 테스트 파일 구조

```
packages/
├── core/
│   ├── src/
│   │   └── __tests__/
│   │       ├── setup.ts
│   │       ├── config.test.ts
│   │       ├── stage.test.ts
│   │       ├── context.test.ts
│   │       └── ai.test.ts
│   └── vitest.config.ts
│
├── cli/
│   ├── src/
│   │   └── __tests__/
│   │       ├── setup.ts
│   │       ├── helpers.ts
│   │       ├── commands.test.ts
│   │       └── prompts.test.ts
│   └── vitest.config.ts
│
└── plugin/
    └── __tests__/
        ├── structure.test.ts
        ├── config.test.ts
        └── MANUAL_TEST.md
```

---

## ⚙️ 공통 설정

### vitest 설정 (이미 설치됨)
```json
// package.json devDependencies
{
  "vitest": "^1.0.0"
}
```

### 테스트 스크립트
```json
// 각 package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 🚀 구현 순서

1. **Core 단위 테스트** (우선순위 높음)
   - config 테스트 먼저 (다른 모듈의 기반)
   - stage, context, ai 순서

2. **CLI E2E 테스트**
   - 헬퍼 함수 먼저
   - init, status 테스트
   - 나머지 명령어

3. **Plugin 테스트**
   - 구조 검증 자동화
   - 수동 테스트 체크리스트 실행

---

## ✅ 완료 체크리스트

### Core 테스트
- [ ] config.test.ts
- [ ] stage.test.ts
- [ ] context.test.ts
- [ ] ai.test.ts
- [ ] `pnpm test` 통과

### CLI 테스트
- [ ] setup.ts, helpers.ts
- [ ] commands.test.ts
- [ ] prompts.test.ts
- [ ] `pnpm test` 통과

### Plugin 테스트
- [ ] structure.test.ts
- [ ] config.test.ts
- [ ] MANUAL_TEST.md 체크리스트 통과

### 전체
- [ ] `pnpm -r test` 루트에서 전체 테스트 통과
- [ ] CI 워크플로우에서 테스트 통과

---

## 📝 참고

- Vitest 문서: https://vitest.dev/
- 기존 코드 위치:
  - Core: `packages/core/src/`
  - CLI: `packages/cli/src/`
  - Plugin: `packages/plugin/`
