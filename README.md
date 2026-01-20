# ax-templates

🚀 **Multi-AI Workflow Pipeline Template System**

10단계 소프트웨어 개발 워크플로우를 템플릿화하여 AI 에이전트 간 협업을 자동화하는 시스템입니다.

## 특징

- **10단계 파이프라인**: 브레인스토밍부터 배포까지 전체 개발 사이클 커버
- **멀티 AI 오케스트레이션**: Gemini, Claude, ClaudeCode, Codex 협업
- **무상태 핸드오프**: HANDOFF.md를 통한 스테이지 간 컨텍스트 전달
- **체크포인트 시스템**: 안전한 롤백 지원
- **tmux 기반 CLI 통합**: `/gemini`, `/codex` 커맨드로 외부 AI CLI 호출

## 빠른 시작

```bash
# 1. 새 프로젝트 초기화
/init-project my-saas-app

# 2. 프로젝트 브리프 작성
# stages/01-brainstorm/inputs/project_brief.md 편집

# 3. 첫 번째 스테이지 실행
/run-stage 01-brainstorm

# 4. 스테이지 완료 후 핸드오프 생성
/handoff

# 5. 다음 스테이지 진행
/run-stage 02-research
```

## 파이프라인 스테이지

| 단계 | 이름 | AI 모델 | 실행 모드 |
|------|------|---------|-----------|
| 01 | Brainstorming | Gemini + ClaudeCode | YOLO |
| 02 | Research | Claude | Plan Mode |
| 03 | Planning | Gemini | Plan Mode |
| 04 | UI/UX Planning | Gemini | Plan Mode |
| 05 | Task Management | ClaudeCode | Plan Mode |
| 06 | Implementation | ClaudeCode | Plan + Sandbox |
| 07 | Refactoring | Codex | Deep Dive |
| 08 | QA | ClaudeCode | Plan + Sandbox |
| 09 | Testing & E2E | Codex | Sandbox + Playwright |
| 10 | CI/CD & Deployment | ClaudeCode | Headless |

## 디렉토리 구조

```
ax-templates/
├── CLAUDE.md                 # 전역 AI 지침
├── config/
│   ├── pipeline.yaml         # 파이프라인 정의
│   └── models.yaml           # AI 모델 설정
├── stages/
│   └── XX-stage-name/
│       ├── CLAUDE.md         # 스테이지 AI 지침
│       ├── config.yaml       # 스테이지 설정
│       ├── prompts/          # 프롬프트 템플릿
│       ├── templates/        # 출력 템플릿
│       ├── inputs/           # 입력 파일
│       └── outputs/          # 출력 파일
├── state/
│   ├── progress.json         # 파이프라인 진행 상황
│   ├── checkpoints/          # 체크포인트
│   └── handoffs/             # 핸드오프 아카이브
├── scripts/                  # 오케스트레이션 스크립트
├── .claude/
│   ├── commands/             # 슬래시 커맨드
│   └── hooks/                # 훅 스크립트
└── docs/                     # 문서
```

## 슬래시 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/init-project [name]` | 새 프로젝트 초기화 |
| `/run-stage [stage-id]` | 스테이지 실행 |
| `/handoff` | 핸드오프 문서 생성 |
| `/checkpoint [desc]` | 체크포인트 생성 |
| `/gemini [prompt]` | Gemini CLI 호출 (tmux) |
| `/codex [prompt]` | Codex CLI 호출 (tmux) |

## 디자인 패턴

1. **Sequential Workflow Architecture** - 순차적 단계 정의
2. **Stateless Orchestration** - 무상태 컨텍스트 전달
3. **Orchestrator-Workers** - 병렬 에이전트 실행
4. **Proactive State Externalization** - 외부 상태 관리
5. **State Machine Workflow** - 상태 전이 관리
6. **Layered Configuration** - 계층화된 설정

## 필수 조건

- Claude Code CLI
- tmux (멀티 AI 오케스트레이션용)
- jq (상태 관리용)
- Gemini CLI (선택)
- Codex CLI (선택)

## 라이선스

MIT

## 문서

- [Getting Started](docs/getting-started.md)
- [Architecture](docs/architecture.md)
- [Design Patterns](docs/patterns/)
