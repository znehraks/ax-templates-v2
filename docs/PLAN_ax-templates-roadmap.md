# ax-templates 워크플로우 템플릿 시스템 설계 로드맵

## 프로젝트 개요

**목표**: 10단계 AI 워크플로우 파이프라인을 템플릿화하여 재사용 가능한 레포지토리 구축

**구현 위치**: `/Users/youjungmin/Documents/vibespace/ax-templates-3` (현재 폴더)

**제외 항목**: Docker 컨테이너 설정, MCP 서버 설정 (추후 필요시 추가)

### 파이프라인 스테이지
| 단계 | 이름 | AI 모델 | 실행 모드 |
|------|------|---------|-----------|
| 01 | Brainstorming | Gemini + ClaudeCode | YOLO (Container) |
| 02 | Research | Claude | Plan Mode |
| 03 | Planning | Gemini | Plan Mode |
| 04 | UI/UX Planning | Gemini | Plan Mode |
| 05 | Task Management | ClaudeCode | Plan Mode |
| 06 | Implementation | ClaudeCode | Plan + Sandbox |
| 07 | Refactoring | Codex | Deep Dive |
| 08 | QA | ClaudeCode | Plan + Sandbox |
| 09 | Testing & E2E | Codex | Sandbox + Playwright |
| 10 | CI/CD & Deployment | ClaudeCode | Headless |

### 적용 디자인 패턴 (Notion DB 참조)
1. **Sequential Workflow Architecture** - 순차적 단계 정의 및 자동 진행
2. **Stateless Orchestration** - 무상태 컨텍스트 전달
3. **Orchestrator-Workers** - 병렬 에이전트 실행
4. **Proactive State Externalization** - 외부 상태 파일 관리
5. **State Machine Workflow** - 상태 전이 관리
6. **Layered Configuration** - 계층화된 설정 구조

---

## 레포지토리 구조

```
ax-templates/
├── README.md                          # 프로젝트 개요 및 퀵스타트
├── CLAUDE.md                          # 전역 AI 지침
├── package.json                       # npm 스크립트/도구
│
├── .claude/                           # Claude Code 설정
│   ├── settings.json
│   ├── commands/                      # 커스텀 슬래시 커맨드
│   │   ├── init-project.md            # /init-project
│   │   ├── run-stage.md               # /run-stage
│   │   ├── handoff.md                 # /handoff
│   │   ├── checkpoint.md              # /checkpoint
│   │   ├── gemini.md                  # /gemini - tmux로 Gemini CLI 호출
│   │   └── codex.md                   # /codex - tmux로 Codex CLI 호출
│   ├── skills/                        # 자동 트리거 스킬
│   │   ├── stage-transition/
│   │   └── context-compression/
│   └── hooks/                         # 강제 실행 훅
│       ├── pre-stage.sh
│       └── post-stage.sh
│
├── config/                            # 전역 설정
│   ├── pipeline.yaml                  # 파이프라인 정의
│   └── models.yaml                    # AI 모델 할당
│
├── stages/                            # 스테이지별 템플릿
│   ├── 01-brainstorm/
│   │   ├── README.md
│   │   ├── CLAUDE.md                  # 스테이지 전용 AI 지침
│   │   ├── config.yaml                # 스테이지 설정
│   │   ├── prompts/                   # 프롬프트 템플릿
│   │   ├── templates/                 # 출력 템플릿
│   │   ├── inputs/
│   │   ├── outputs/
│   │   └── HANDOFF.md.template        # 핸드오프 템플릿
│   ├── 02-research/
│   ├── 03-planning/
│   ├── 04-ui-ux/
│   ├── 05-task-management/
│   ├── 06-implementation/
│   ├── 07-refactoring/
│   ├── 08-qa/
│   ├── 09-testing/
│   └── 10-deployment/
│
├── state/                             # 런타임 상태 관리
│   ├── progress.json                  # 파이프라인 진행 상황
│   ├── checkpoints/                   # 체크포인트 저장
│   ├── context/                       # 컨텍스트 보존
│   └── handoffs/                      # 생성된 HANDOFF.md
│
├── scripts/                           # 오케스트레이션 스크립트
│   ├── init-project.sh
│   ├── run-stage.sh
│   ├── create-checkpoint.sh
│   ├── orchestrate.sh
│   ├── gemini-wrapper.sh              # tmux 기반 Gemini CLI 래퍼
│   └── codex-wrapper.sh               # tmux 기반 Codex CLI 래퍼
│
├── docs/                              # 문서화
│   ├── getting-started.md
│   ├── architecture.md
│   └── patterns/
│
└── examples/                          # 예제 프로젝트
    ├── simple-web-app/
    └── complex-saas/
```

---

## 구현 로드맵

### Phase 1: 핵심 구조 설정 (Day 1-2)

**Tasks:**
1. 레포지토리 기본 구조 생성
2. 전역 설정 파일 작성
   - `config/pipeline.yaml` - 10개 스테이지 정의
   - `config/models.yaml` - AI 모델 할당
   - `CLAUDE.md` - 전역 AI 지침
3. 상태 관리 파일 초기화
   - `state/progress.json` 스키마 정의

**Critical Files:**
- `/config/pipeline.yaml`
- `/CLAUDE.md`
- `/state/progress.json`

### Phase 2: 스테이지 템플릿 개발 (Day 3-5)

**Tasks:**
1. 스테이지 01-brainstorm 완전 구현 (템플릿 패턴 확립)
   - `CLAUDE.md` - Gemini + ClaudeCode YOLO 모드 지침
   - `config.yaml` - 입출력 정의
   - `prompts/` - 3개 프롬프트 템플릿
   - `HANDOFF.md.template`
2. 나머지 9개 스테이지 복제 및 커스터마이징
3. 스테이지별 프롬프트 템플릿 작성

**Critical Files:**
- `/stages/01-brainstorm/CLAUDE.md` (템플릿 패턴)
- `/stages/*/config.yaml` (각 스테이지)
- `/stages/*/HANDOFF.md.template`

### Phase 3: 오케스트레이션 시스템 (Day 6-7)

**Tasks:**
1. 슬래시 커맨드 구현
   - `/run-stage` - 스테이지 실행
   - `/handoff` - HANDOFF.md 생성
   - `/checkpoint` - 체크포인트 생성
   - `/gemini` - tmux 기반 Gemini CLI 호출 (멀티 모델 오케스트레이션)
   - `/codex` - tmux 기반 Codex CLI 호출
2. 훅 시스템 구현
   - `pre-stage.sh` - 전제조건 검증
   - `post-stage.sh` - 핸드오프 자동 생성
3. 스크립트 개발
   - `run-stage.sh` - 스테이지 실행 오케스트레이터
   - `create-checkpoint.sh` - 체크포인트 관리
4. **tmux 기반 멀티 모델 CLI 통합**
   - `scripts/gemini-wrapper.sh` - Gemini CLI 래퍼
   - `scripts/codex-wrapper.sh` - Codex CLI 래퍼
   - tmux 세션 관리 스크립트

**Critical Files:**
- `/.claude/commands/run-stage.md`
- `/.claude/commands/gemini.md`
- `/.claude/commands/codex.md`
- `/.claude/hooks/pre-stage.sh`
- `/scripts/run-stage.sh`
- `/scripts/gemini-wrapper.sh`
- `/scripts/codex-wrapper.sh`

### Phase 4: CI/CD 및 자동화 (Day 8-9)

**Tasks:**
1. CI/CD 템플릿 작성
   - GitHub Actions 워크플로우 템플릿
   - 배포 체크리스트 템플릿
2. 자동화 스크립트 완성
   - 전체 파이프라인 오케스트레이터
   - 상태 모니터링 스크립트

**Critical Files:**
- `/stages/10-deployment/templates/github-actions.yaml`
- `/scripts/orchestrate.sh`

> **Note:** 컨테이너/MCP 설정은 제외됨 (추후 필요시 추가 가능)

### Phase 5: 문서화 및 예제 (Day 10)

**Tasks:**
1. 문서 작성
   - `getting-started.md` - 퀵스타트 가이드
   - `architecture.md` - 시스템 아키텍처
   - `patterns/*.md` - 디자인 패턴 문서
2. 예제 프로젝트 구성
   - `simple-web-app/` - 간단한 예제
   - `complex-saas/` - 복잡한 예제

---

## 핵심 파일 상세 설계

### 1. CLAUDE.md (전역)

```markdown
# ax-templates - Multi-AI Workflow Pipeline

## 파이프라인 개요
10단계 소프트웨어 개발 워크플로우 템플릿 시스템

## 컨텍스트 관리 규칙
- 50k 토큰 도달 시: state.md에 현재 상태 저장
- 80k 토큰 도달 시: /clear 후 state.md로 복원
- 각 스테이지는 독립적 세션으로 실행

## 스테이지 전환 프로토콜
1. 현재 스테이지 완료 확인
2. HANDOFF.md 생성 필수
3. 체크포인트 생성 (구현 스테이지)
4. 다음 스테이지 CLAUDE.md 로드

## 금지 사항
- HANDOFF.md 없이 스테이지 전환
- 체크포인트 없이 파괴적 작업
- 단일 세션에 복수 스테이지 혼합
```

### 2. pipeline.yaml

```yaml
pipeline:
  name: "Multi-AI Development Workflow"
  version: "1.0.0"

stages:
  - id: "01-brainstorm"
    models: ["gemini", "claudecode"]
    mode: "yolo"
    container: true

  - id: "02-research"
    models: ["claude"]
    mode: "plan"

  - id: "03-planning"
    models: ["gemini"]
    mode: "plan"

  - id: "04-ui-ux"
    models: ["gemini"]
    mode: "plan"

  - id: "05-task-management"
    models: ["claudecode"]
    mode: "plan"

  - id: "06-implementation"
    models: ["claudecode"]
    mode: "sandbox"

  - id: "07-refactoring"
    models: ["codex"]
    mode: "deep-dive"

  - id: "08-qa"
    models: ["claudecode"]
    mode: "sandbox"

  - id: "09-testing"
    models: ["codex"]
    mode: "sandbox"

  - id: "10-deployment"
    models: ["claudecode"]
    mode: "headless"

state_management:
  progress_file: "state/progress.json"
  context_warning: 50000
  context_limit: 80000
  auto_checkpoint: true

hooks:
  pre_stage: ["validate_inputs", "check_handoff"]
  post_stage: ["generate_handoff", "update_progress"]
```

### 3. HANDOFF.md 템플릿

```markdown
# Stage Handoff: {{CURRENT_STAGE}} -> {{NEXT_STAGE}}

## 핸드오프 ID
`HO-{{STAGE_NUM}}-{{TIMESTAMP}}`

## 요약
[2-3문장으로 완료된 작업 요약]

## 완료된 작업
- [ ] [체크리스트]

## 주요 산출물
| 산출물 | 위치 | 검증됨 |
|--------|------|--------|
| [파일명] | [경로] | Yes/No |

## 다음 에이전트를 위한 컨텍스트

### 핵심 결정사항
| 결정 | 이유 | 되돌릴 수 있음 |
|------|------|----------------|

### 성공한 접근법
- [목록]

### 실패한 접근법
- [목록 + 이유]

## 다음 단계
1. [즉시 실행할 작업]
2. [후속 작업]

## 의존성
- [외부 의존성]
- [차단 이슈]

## 경고
- [주의해야 할 사항]

## 체크포인트 참조
`CP-{{STAGE_NUM}}-{{TIMESTAMP}}`
```

### 4. state.md (컨텍스트 복구용)

```markdown
# 작업 상태 저장 - {{TIMESTAMP}}

## 현재 스테이지
{{STAGE_ID}}: {{STAGE_NAME}}

## 진행 상황
- 완료: [목록]
- 진행 중: [현재 작업]
- 대기: [남은 작업]

## 핵심 컨텍스트
[복구 시 필요한 최소 컨텍스트]

## 복구 지침
1. 이 파일 읽기
2. {{HANDOFF_FILE}} 참조
3. {{CURRENT_TASK}}부터 재개
```

### 5. 스테이지 config.yaml 예시 (01-brainstorm)

```yaml
stage:
  id: "01-brainstorm"
  name: "Brainstorming"
  description: "발산적 사고 및 아이디어 생성"

models:
  primary:
    name: "gemini"
    mode: "yolo"
    role: "발산적 사고, 창의적 탐색"
  secondary:
    name: "claudecode"
    mode: "plan"
    role: "구조화, 실현 가능성 평가"

execution:
  parallel: true
  timeout: 3600
  checkpoint_required: false

inputs:
  required:
    - "project_brief.md"
  optional:
    - "constraints.md"
    - "inspiration_links.md"

outputs:
  required:
    - "ideas.md"
    - "selection_matrix.md"
  optional:
    - "rejected_ideas.md"

validation:
  min_ideas: 10
  selection_criteria: ["feasibility", "innovation", "market_fit"]

handoff:
  next_stage: "02-research"
  required_context:
    - "selected_ideas"
    - "evaluation_criteria"
    - "constraints"
```

---

## tmux 기반 멀티 모델 CLI 통합 상세 설계

### 개요
claude_code_tips.md 참조: ykdojo의 멀티 모델 오케스트레이션 패턴을 적용하여 `/gemini`, `/codex` 커맨드로 다른 AI CLI를 tmux 세션에서 호출

### /gemini 커맨드 설계

```markdown
<!-- .claude/commands/gemini.md -->
# /gemini 커맨드

tmux 세션을 통해 Gemini CLI를 호출하여 작업을 수행합니다.

## 사용법
/gemini [프롬프트]

## 동작 방식
1. tmux 세션 확인/생성 (ax-gemini)
2. Gemini CLI 실행
3. 프롬프트 전송 (tmux send-keys)
4. 응답 캡처 (tmux capture-pane)
5. 결과 반환

## 스크립트 호출
Bash: scripts/gemini-wrapper.sh "$ARGUMENTS"

## 활용 시나리오
- 브라우저 접근이 막힌 웹사이트 크롤링
- Reddit/웹 리서치
- 발산적 아이디어 생성 (brainstorm 스테이지)
```

### /codex 커맨드 설계

```markdown
<!-- .claude/commands/codex.md -->
# /codex 커맨드

tmux 세션을 통해 OpenAI Codex CLI를 호출하여 작업을 수행합니다.

## 사용법
/codex [프롬프트]

## 동작 방식
1. tmux 세션 확인/생성 (ax-codex)
2. Codex CLI 실행
3. 프롬프트 전송
4. 응답 캡처
5. 결과 반환

## 활용 시나리오
- 리팩토링 스테이지 (07)
- 테스트 코드 생성 (09)
- 코드 최적화
```

### gemini-wrapper.sh 스크립트

```bash
#!/bin/bash
# scripts/gemini-wrapper.sh
# tmux wait-for 채널 기반 동기화 방식 (폴링 없음, 즉시 반응)

SESSION_NAME="ax-gemini"
CHANNEL="ax-gemini-done-$$"
OUTPUT_FILE="/tmp/ax-gemini-output-$$"
PROMPT="$1"
TIMEOUT="${2:-300}"  # 기본 5분 타임아웃

# 임시 파일 정리
cleanup() {
    rm -f "$OUTPUT_FILE"
}
trap cleanup EXIT

# tmux 세션 확인/생성
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux new-session -d -s "$SESSION_NAME"
    sleep 1
fi

# Gemini CLI 실행 + 완료 시 채널에 시그널
tmux send-keys -t "$SESSION_NAME" "gemini \"$PROMPT\" 2>&1 | tee $OUTPUT_FILE; tmux wait-for -S $CHANNEL" Enter

# 채널 시그널 대기 (블로킹)
# 타임아웃 처리를 위해 백그라운드 타이머 사용
(sleep "$TIMEOUT" && tmux wait-for -S "$CHANNEL" 2>/dev/null) &
TIMER_PID=$!

tmux wait-for "$CHANNEL"
kill $TIMER_PID 2>/dev/null

# 결과 출력
if [[ -f "$OUTPUT_FILE" ]]; then
    cat "$OUTPUT_FILE"
else
    echo "Error: No output captured"
    exit 1
fi
```

### codex-wrapper.sh 스크립트

```bash
#!/bin/bash
# scripts/codex-wrapper.sh
# tmux wait-for 채널 기반 동기화 방식 (폴링 없음, 즉시 반응)

SESSION_NAME="ax-codex"
CHANNEL="ax-codex-done-$$"
OUTPUT_FILE="/tmp/ax-codex-output-$$"
PROMPT="$1"
TIMEOUT="${2:-300}"  # 기본 5분 타임아웃

# 임시 파일 정리
cleanup() {
    rm -f "$OUTPUT_FILE"
}
trap cleanup EXIT

# tmux 세션 확인/생성
if ! tmux has-session -t "$SESSION_NAME" 2>/dev/null; then
    tmux new-session -d -s "$SESSION_NAME"
    sleep 1
fi

# Codex CLI 실행 + 완료 시 채널에 시그널
tmux send-keys -t "$SESSION_NAME" "codex \"$PROMPT\" 2>&1 | tee $OUTPUT_FILE; tmux wait-for -S $CHANNEL" Enter

# 채널 시그널 대기 (블로킹)
# 타임아웃 처리를 위해 백그라운드 타이머 사용
(sleep "$TIMEOUT" && tmux wait-for -S "$CHANNEL" 2>/dev/null) &
TIMER_PID=$!

tmux wait-for "$CHANNEL"
kill $TIMER_PID 2>/dev/null

# 결과 출력
if [[ -f "$OUTPUT_FILE" ]]; then
    cat "$OUTPUT_FILE"
else
    echo "Error: No output captured"
    exit 1
fi
```

### 멀티 모델 오케스트레이션 워크플로우 예시

```
사용자: "/gemini Reddit의 r/programming에서 Claude Code 관련 게시물 요약해줘"

Claude Code 내부 동작:
1. scripts/gemini-wrapper.sh 호출
2. tmux 세션 'ax-gemini' 생성
3. Gemini CLI로 Reddit 크롤링
4. 결과 캡처
5. Claude Code가 결과 정리 및 표시
```

---

## 검증 방법

### 단위 테스트
1. 각 스테이지 config.yaml 스키마 검증
2. HANDOFF.md 템플릿 완성도 확인
3. 훅 스크립트 실행 테스트

### 통합 테스트
1. 전체 파이프라인 순차 실행 (simple-web-app 예제)
2. 스테이지 간 핸드오프 정상 작동 확인
3. 체크포인트/복구 기능 테스트

### E2E 테스트
1. 새 프로젝트 초기화 (`/init-project`)
2. 10개 스테이지 순차 실행
3. 컨텍스트 50% 이하 시 state.md 저장/복구 확인

---

## 요약

| 항목 | 내용 |
|------|------|
| 총 스테이지 | 10개 |
| 사용 AI 모델 | Gemini, Claude, ClaudeCode, Codex |
| 핵심 패턴 | Sequential Workflow, State Machine, Orchestrator-Workers |
| 예상 구현 기간 | 10일 |
| 주요 산출물 | 템플릿 레포지토리, 오케스트레이션 스크립트, 문서 |
| 제외 항목 | Docker 컨테이너, MCP 서버 설정 (추후 추가 가능) |

---

## 참조

### Notion DB 패턴 참조
- Context Design Pattern 데이터베이스
- Sequential Workflow Architecture
- Stateless Orchestration Pattern
- Orchestrator-Workers
- Proactive Agent State Externalization
- State Machine Workflow Orchestration
- Layered Configuration Context

### 설계 지침 참조
- `/Users/youjungmin/Documents/vibespace/ax-templates-3/claude_code_tips.md`
