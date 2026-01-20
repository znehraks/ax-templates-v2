# ax-templates 플러그인화 구현 히스토리

## 📅 프로젝트 개요

**목표**: 기존 ax-templates를 NPM CLI + Claude Code Plugin 듀얼 배포 가능한 모노레포로 리팩토링

**기간**: 2025-01 (Phase 1~4 완료)

---

## 🎯 초기 계획

### 배포 전략
- **NPM CLI**: `ax-templates` 패키지로 전역 설치 가능
- **Claude Code Plugin**: `@ax-templates/plugin`으로 플러그인 설치 가능
- **모노레포 구조**: pnpm workspace로 패키지 관리

### 핵심 변경사항
1. 하드코딩된 설정 → `.ax-config.yaml` 단일 설정 파일
2. 개별 config 파일들 → 통합 설정 + 템플릿 변수
3. 슬래시 커맨드 → CLI 커맨드 + 플러그인 커맨드 동시 지원

---

## 📋 구현 Phase 요약

### Phase 1: Core 패키지 ✅
**위치**: `packages/core/`

**구현 내용**:
- Zod 기반 설정 스키마 (`src/config/schema.ts`)
- YAML 설정 로더 (`src/config/loader.ts`)
- 기본값 + 사용자 설정 머저 (`src/config/merger.ts`)
- 기본값 정의 (`src/config/defaults.ts`)
- 스테이지 관리자 (`src/stage/manager.ts`)
- 체크포인트 시스템 (`src/stage/checkpoint.ts`)
- 핸드오프 생성기 (`src/stage/handoff.ts`)
- 컨텍스트 관리자 (`src/context/manager.ts`)
- AI 래퍼 (`src/ai/wrapper.ts`)

**패키지 구조**:
```
packages/core/
├── src/
│   ├── config/     # 설정 관리
│   ├── stage/      # 스테이지 관리
│   ├── context/    # 컨텍스트 관리
│   ├── ai/         # AI 모델 추상화
│   └── index.ts
└── package.json
```

---

### Phase 2: CLI 패키지 ✅
**위치**: `packages/cli/`

**구현 내용**:
- Commander.js CLI 프레임워크 설정
- Inquirer.js 초기 설정 마법사 (`src/prompts/init-wizard.ts`)
- 12개 핵심 커맨드 구현:
  - `init`, `status`, `stages`, `run-stage`
  - `next`, `handoff`, `checkpoint`, `restore`
  - `context`, `config`, `gemini`, `codex`
- 10개 스테이지 단축 커맨드

**CLI 커맨드 목록**:
```
ax init [project]       # 프로젝트 초기화
ax status               # 파이프라인 상태
ax stages               # 스테이지 목록
ax run-stage <stage>    # 스테이지 실행
ax next                 # 다음 스테이지
ax handoff              # HANDOFF.md 생성
ax checkpoint           # 체크포인트 생성
ax restore [cp]         # 복구
ax context              # 컨텍스트 상태
ax config               # 설정 관리
ax gemini <prompt>      # Gemini 호출
ax codex <prompt>       # Codex 호출

# 스테이지 단축
ax brainstorm / research / planning / ui-ux / tasks
ax implement / refactor / qa / test / deploy
```

---

### Phase 3: Plugin 패키지 ✅
**위치**: `packages/plugin/`

**구현 내용**:
- `plugin.json` 매니페스트 작성
- `CLAUDE.md` 템플릿화 (변수: `{{PROJECT_ROOT}}`, `{{STAGES_OUTPUT}}` 등)
- 21개 슬래시 커맨드 파일 생성 (`.claude/commands/`)
- 훅 스크립트:
  - `scripts/session-start.sh` - 세션 시작 시 검증
  - `scripts/stop.sh` - 세션 종료 처리
  - `.claude/hooks/statusline.sh` - 상태바 표시
- AI 래퍼 스크립트:
  - `scripts/gemini-wrapper.sh`
  - `scripts/codex-wrapper.sh`
- 설정 스키마 (`.ax-config.schema.json`)
- 기본값 (`config/defaults.yaml`)

**플러그인 구조**:
```
packages/plugin/
├── plugin.json
├── CLAUDE.md
├── .claude/
│   ├── settings.json
│   ├── commands/     # 21개 커맨드
│   └── hooks/
├── config/
├── scripts/
└── package.json
```

---

### Phase 4: 문서화 & 배포 ✅
**구현 내용**:

1. **README 문서**:
   - `README.md` - 루트 프로젝트 개요
   - `packages/cli/README.md` - CLI 설치/사용법
   - `packages/plugin/README.md` - 플러그인 설치/사용법

2. **마이그레이션 가이드**:
   - `docs/migration-guide.md` - v1.x → v2.0 마이그레이션

3. **GitHub Workflows**:
   - `.github/workflows/ci.yml` - CI 파이프라인 (lint, build, test)
   - `.github/workflows/publish.yml` - NPM 퍼블리싱
   - `.github/workflows/release.yml` - GitHub 릴리즈 생성

4. **기타**:
   - `.gitignore` - node_modules, dist 등 제외
   - `docs/PLAN-remaining-tests.md` - 남은 테스트 작업 계획

---

## 🏗️ 최종 프로젝트 구조

```
ax-templates/
├── packages/
│   ├── core/                    # 공유 비즈니스 로직
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── stage/
│   │   │   ├── context/
│   │   │   └── ai/
│   │   └── package.json
│   │
│   ├── cli/                     # NPM CLI
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   └── prompts/
│   │   ├── bin/ax.js
│   │   └── package.json
│   │
│   └── plugin/                  # Claude Code Plugin
│       ├── plugin.json
│       ├── CLAUDE.md
│       ├── .claude/
│       │   ├── commands/        # 21개
│       │   └── hooks/
│       ├── scripts/
│       └── package.json
│
├── templates/
│   └── default/                 # 10스테이지 템플릿
│
├── docs/
│   ├── migration-guide.md
│   ├── PLAN-remaining-tests.md
│   └── HISTORY-plugin-implementation.md
│
├── .github/workflows/
│   ├── ci.yml
│   ├── publish.yml
│   └── release.yml
│
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 📄 설정 파일 형식

### .ax-config.yaml (사용자 프로젝트)
```yaml
ax_templates:
  version: "2.0.0"

paths:
  project_root: "./my-app"
  stages_output: "./stages"
  state: "./state"
  checkpoints: "./state/checkpoints"

ai:
  gemini: true
  codex: true

tmux:
  gemini_session: "ax-gemini"
  codex_session: "ax-codex"
  output_timeout: 300

context:
  warning: 60
  action: 50
  critical: 40
  task_save_frequency: 5

git:
  commit_language: "Korean"
  auto_commit: true

mcp:
  search: [context7, exa]
  browser: [playwright]
```

---

## 🔄 설정 우선순위

```
1. CLI 플래그 (--timeout=3600)
2. 환경 변수 (AX_TIMEOUT_06=3600)
3. 프로젝트 .ax-config.yaml
4. 사용자 ~/.ax/config.yaml
5. 기본값 (defaults.ts)
```

---

## ✅ 완료 체크리스트

### Phase 1: Core
- [x] pnpm 모노레포 구조 생성
- [x] Zod 기반 설정 스키마
- [x] 설정 로더/머저 구현
- [x] 스테이지 관리자
- [x] 체크포인트 시스템
- [x] 핸드오프 생성기
- [x] 컨텍스트 관리자
- [x] AI 래퍼
- [ ] 단위 테스트 ← **남은 작업**

### Phase 2: CLI
- [x] Commander.js CLI 프레임워크
- [x] Inquirer.js 초기 설정 마법사
- [x] 12개 핵심 커맨드
- [x] 10개 스테이지 단축 커맨드
- [ ] E2E 테스트 ← **남은 작업**

### Phase 3: Plugin
- [x] plugin.json 매니페스트
- [x] CLAUDE.md 템플릿화
- [x] 21개 커맨드 파일
- [x] 훅 스크립트
- [x] AI 래퍼 스크립트
- [ ] 플러그인 설치 테스트 ← **남은 작업**

### Phase 4: 문서화 & 배포
- [x] README.md (루트, CLI, Plugin)
- [x] 마이그레이션 가이드
- [x] GitHub Workflows (CI, Publish, Release)
- [x] .gitignore
- [x] 빌드 검증 (`pnpm build` 성공)

---

## 🚀 다음 단계

### 남은 작업 (테스트)
상세 계획: `docs/PLAN-remaining-tests.md`

1. Core 단위 테스트
2. CLI E2E 테스트
3. Plugin 설치 테스트

### 배포 준비
1. GitHub에 `NPM_TOKEN` 시크릿 추가
2. `git tag v2.0.0 && git push origin v2.0.0`
3. Release workflow 실행
4. NPM 퍼블리싱 확인

---

## 📝 주요 결정사항

### 1. 모노레포 선택 이유
- 패키지 간 코드 공유 용이
- 단일 버전 관리
- pnpm workspace로 효율적인 의존성 관리

### 2. 설정 통합 (.ax-config.yaml)
- 기존: `config/models.yaml`, `pipeline.yaml`, `context.yaml` 등 분산
- 변경: 단일 `.ax-config.yaml`로 통합
- 이유: 사용자 설정 간소화, 템플릿 변수 지원

### 3. 템플릿 변수 도입
- CLAUDE.md에서 `{{PROJECT_ROOT}}`, `{{STAGES_OUTPUT}}` 등 사용
- 설정 파일에서 값을 읽어 런타임에 치환
- 하드코딩 제거로 유연성 확보

### 4. 듀얼 배포 전략
- NPM CLI: 터미널 사용자용
- Claude Code Plugin: IDE 통합 사용자용
- 동일한 Core 로직 공유

---

## 🔗 관련 파일

- 테스트 계획: `docs/PLAN-remaining-tests.md`
- 마이그레이션: `docs/migration-guide.md`
- CLI 문서: `packages/cli/README.md`
- Plugin 문서: `packages/plugin/README.md`
