# ax-templates - Multi-AI Workflow Pipeline

10단계 소프트웨어 개발 워크플로우 템플릿 시스템

## 파이프라인 개요

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

## 컨텍스트 관리 규칙

> 설정 파일: `config/context.yaml`

### 퍼센트 기반 임계값 (남은 컨텍스트 기준)

| 임계값 | 트리거 | 동작 |
|--------|--------|------|
| **60%** (warning) | 경고 표시 | 압축 비율 계산, 배너 표시 |
| **50%** (action) | 자동 저장 | `state/context/`에 상태 저장, 압축 권장 |
| **40%** (critical) | `/clear` 권고 | 강제 저장, 복구 HANDOFF 생성 |

### 태스크 기반 자동 저장
- **5개 태스크 완료마다** 상태 자동 저장
- 저장 위치: `state/context/state_{timestamp}_{stage}.md`

### 상태 저장 형식
> 템플릿: `state/templates/phase_state.md.template`

```markdown
# 작업 상태 저장 - {{TIMESTAMP}}

## 컨텍스트 상태
- 남은 컨텍스트: {{REMAINING_PERCENT}}%
- 저장 트리거: {{TRIGGER_REASON}}

## 현재 스테이지
{{STAGE_ID}}: {{STAGE_NAME}}

## 진행 상황
- 완료: [목록]
- 진행 중: [현재 작업]
- 대기: [남은 작업]

## 핵심 컨텍스트
- 주요 결정사항
- 수정된 파일
- 활성 이슈/버그

## AI 호출 기록
| AI | 시간 | 프롬프트 | 결과 |
|----|------|---------|------|

## 복구 지침
1. 이 파일 읽기
2. {{HANDOFF_FILE}} 참조
3. {{CURRENT_TASK}}부터 재개
```

### 컨텍스트 압축 전략
1. **summarize_completed**: 완료된 작업을 요약으로 대체
2. **externalize_code**: 코드 블록을 파일 참조로 대체
3. **handoff_generation**: 현재 상태를 HANDOFF.md로 외부화

## 스테이지 전환 프로토콜

### 필수 순서
1. 현재 스테이지의 모든 outputs 생성 확인
2. `HANDOFF.md` 생성 (필수)
3. 체크포인트 생성 (구현/리팩토링 스테이지)
4. `state/progress.json` 업데이트
5. 다음 스테이지 `CLAUDE.md` 로드

### HANDOFF.md 필수 포함 항목
- 완료된 작업 체크리스트
- 핵심 결정사항 및 이유
- 성공/실패한 접근법
- 다음 단계 즉시 실행 작업
- 체크포인트 참조 (해당시)

## 슬래시 커맨드

### 기본 명령어
| 커맨드 | 설명 |
|--------|------|
| `/init-project` | 새 프로젝트 초기화 |
| `/run-stage [id]` | 특정 스테이지 실행 |
| `/handoff` | 현재 스테이지 HANDOFF.md 생성 |
| `/checkpoint` | 체크포인트 생성 |
| `/gemini [prompt]` | Gemini CLI 호출 |
| `/codex [prompt]` | Codex CLI 호출 |

### 가시성 명령어
| 커맨드 | 설명 |
|--------|------|
| `/status` | 파이프라인 전체 상태 확인 |
| `/stages` | 스테이지 목록 및 상세 |
| `/context` | 컨텍스트(토큰) 상태 관리 |

### 네비게이션 명령어
| 커맨드 | 설명 |
|--------|------|
| `/next` | 다음 스테이지로 전환 |
| `/restore` | 체크포인트에서 복구 |

### 스테이지 단축 명령어
| 커맨드 | 스테이지 |
|--------|----------|
| `/brainstorm` | 01-brainstorm |
| `/research` | 02-research |
| `/planning` | 03-planning |
| `/ui-ux` | 04-ui-ux |
| `/tasks` | 05-task-management |
| `/implement` | 06-implementation |
| `/refactor` | 07-refactoring |
| `/qa` | 08-qa |
| `/test` | 09-testing |
| `/deploy` | 10-deployment |

## 스킬 (자동 활성화)

| 스킬 | 트리거 | 설명 |
|------|--------|------|
| `stage-transition` | "완료", "/next" | 스테이지 완료 감지 및 전환 자동화 |
| `context-compression` | 토큰 50k+ | 컨텍스트 압축 및 상태 저장 |

## Git 자동 커밋 규칙

> 설정 파일: `config/git.yaml`

### 자동 커밋 트리거
- **태스크 완료 시**: 관련 파일 커밋
- **스테이지 완료 시**: 전체 변경사항 커밋 + 태그 생성
- **체크포인트 생성 시**: 체크포인트 커밋 + 태그

### 커밋 메시지 형식 (Conventional Commits)
```
<type>(<scope>): <description>
```

| 스테이지 | 타입 | 스코프 | 예시 |
|---------|------|--------|------|
| 06-implementation | `feat` | `impl` | `feat(impl): 사용자 인증 구현` |
| 07-refactoring | `refactor` | `refactor` | `refactor(refactor): 인증 서비스 최적화` |
| 08-qa | `fix` | `qa` | `fix(qa): 세션 만료 버그 수정` |
| 09-testing | `test` | `test` | `test(test): E2E 테스트 추가` |
| 10-deployment | `ci` | `deploy` | `ci(deploy): GitHub Actions 설정` |

### 커밋 원칙
- 작은 단위로 자주 커밋
- 의미 있는 커밋 메시지 작성
- 커밋 전 lint/format 실행

## AI 호출 로깅

> 설정 파일: `config/ai_logging.yaml`

### AI 호출 기록
- 모든 AI 호출(Gemini, Codex, ClaudeCode)은 HANDOFF.md에 기록됩니다
- 호출 시간, 프롬프트 파일, 결과 파일, 상태를 추적합니다

### Gemini 호출 검증 체크리스트
| 단계 | 확인 항목 | 명령어 |
|------|----------|--------|
| 1 | CLI 설치 확인 | `which gemini` |
| 2 | 래퍼 사용 | `scripts/gemini-wrapper.sh` |
| 3 | tmux 세션 확인 | `tmux attach -t ax-gemini` |
| 4 | 출력 파일 저장 | `outputs/` 디렉토리 |

### AI 호출 로그 형식 (HANDOFF.md)
```markdown
## AI 호출 기록
| AI | 호출 시간 | 프롬프트 | 결과 | 상태 |
|----|----------|---------|------|------|
| Gemini | 14:30 | prompts/ideation.md | outputs/ideas.md | 성공 |
```

## 문답 자동 기록 (Q&A Logging)

> 설정 파일: `config/qa_logging.yaml`

### 자동 기록 트리거
- **스테이지 완료 시**: 해당 스테이지의 주요 Q&A 기록
- **이슈 발견 시**: 문제와 해결 방법 기록
- **프로세스 변경 요청 시**: 변경 내용과 이유 기록

### 기록 형식
```markdown
### Q{{number}}: {{title}}
**질문**: {{question}}
**답변**: {{answer}}
**해결 방법**: {{solution}}
**향후 개선 제안**: {{suggestion}}
```

### 기록 대상 파일
- 기본: `feedback.md`
- 백업: `state/qa_backups/`

### 카테고리
- `workflow_improvements`: 워크플로우 개선
- `tool_usage`: 도구 사용법
- `process_changes`: 프로세스 변경
- `bug_fixes`: 버그 수정
- `best_practices`: 모범 사례

## 금지 사항

- HANDOFF.md 없이 스테이지 전환
- 체크포인트 없이 파괴적 작업 (구현/리팩토링)
- 단일 세션에 복수 스테이지 혼합
- 이전 스테이지 outputs 수정
- WIP 커밋, 의미 없는 커밋 메시지

## 디렉토리 구조 (Issue #17 해결)

### ⚠️ 핵심 구분: TEMPLATE_ROOT vs PROJECT_ROOT

```
TEMPLATE_ROOT (파이프라인 관리)     PROJECT_ROOT (소스코드)
/my-new-project/                   /my-new-project/[project-name]/
├── stages/        ← 산출물        ├── src/
│   └── XX-stage/                  ├── public/
│       └── outputs/               ├── package.json
├── config/                        └── ...
├── state/
└── CLAUDE.md
```

### 경로 규칙

| 유형 | 저장 위치 | 예시 |
|------|----------|------|
| 산출물 (문서) | `stages/XX/outputs/` | `ideas.md`, `architecture.md` |
| 소스 코드 | `[project-name]/src/` | 컴포넌트, API |
| 상태 파일 | `state/` | `progress.json`, 체크포인트 |
| HANDOFF | `stages/XX/` | `HANDOFF.md` |

### ⚠️ 금지: PROJECT_ROOT에 stages/ 생성
```
❌ 잘못된 구조
/my-new-project/my-app/
├── stages/        ← 여기에 생성하면 안됨!
└── src/

✅ 올바른 구조
/my-new-project/
├── stages/        ← TEMPLATE_ROOT에만 존재
└── my-app/
    └── src/       ← PROJECT_ROOT
```

### 파이프라인 파일 구조

```
config/
  pipeline.yaml        # 파이프라인 정의
  models.yaml          # AI 모델 할당
  context.yaml         # 컨텍스트 관리 설정
  model_enforcement.yaml  # AI 역할 분담
  git.yaml             # Git 자동 커밋 규칙
  mcp_fallbacks.yaml   # MCP 폴백 설정
  ai_logging.yaml      # AI 호출 로깅 설정
  qa_logging.yaml      # 문답 자동 기록 설정
  implementation.yaml.template  # 구현 규칙 템플릿

stages/
  XX-stage-name/
    CLAUDE.md          # 스테이지 AI 지침
    config.yaml        # 스테이지 설정
    prompts/           # 프롬프트 템플릿
    templates/         # 출력 템플릿
    inputs/            # 입력 파일 (이전 스테이지 링크)
    outputs/           # 출력 파일 (산출물)
    HANDOFF.md         # 생성된 핸드오프

state/
  progress.json        # 파이프라인 진행 상황
  checkpoints/         # 체크포인트 저장
  context/             # 컨텍스트 상태 저장
  handoffs/            # 핸드오프 아카이브
  templates/           # 상태 템플릿
```

## 디자인 패턴 적용

1. **Sequential Workflow Architecture** - 순차적 단계 정의 및 자동 진행
2. **Stateless Orchestration** - 무상태 컨텍스트 전달 (HANDOFF.md)
3. **Orchestrator-Workers** - 병렬 에이전트 실행 (Brainstorm 스테이지)
4. **Proactive State Externalization** - 외부 상태 파일 관리
5. **State Machine Workflow** - 상태 전이 관리 (progress.json)
6. **Layered Configuration** - 계층화된 설정 구조 (global → stage)

<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>
