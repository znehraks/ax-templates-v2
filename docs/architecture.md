# Architecture

ax-templates 시스템 아키텍처 문서

## 시스템 개요

```mermaid
graph TB
    subgraph "User Interface"
        CLI[Claude Code CLI]
        Commands[Slash Commands]
    end

    subgraph "Orchestration Layer"
        Pipeline[Pipeline Controller]
        Hooks[Hook System]
        Scripts[Shell Scripts]
        Collaboration[AI Collaboration Layer]
        Forking[Pipeline Forking Manager]
    end

    subgraph "AI Agents"
        Claude[Claude]
        ClaudeCode[Claude Code]
        Gemini[Gemini CLI]
        Codex[Codex CLI]
    end

    subgraph "Intelligence Layer"
        Personas[Stage Persona System]
        Validator[Output Validator]
        SmartHandoff[Smart HANDOFF]
        AutoCheckpoint[Auto-Checkpoint]
    end

    subgraph "State Management"
        Progress[progress.json]
        Checkpoints[Checkpoints]
        Handoffs[HANDOFF.md]
        Benchmarks[AI Benchmarks]
        Forks[Pipeline Forks]
        Validations[Validation Results]
    end

    subgraph "Stages"
        S01[01-brainstorm]
        S02[02-research]
        S03[03-planning]
        S04[04-ui-ux]
        S05[05-task-mgmt]
        S06[06-impl]
        S07[07-refactor]
        S08[08-qa]
        S09[09-testing]
        S10[10-deploy]
    end

    CLI --> Commands
    Commands --> Pipeline
    Pipeline --> Hooks
    Pipeline --> Scripts
    Pipeline --> Collaboration
    Pipeline --> Forking
    Collaboration --> Claude
    Collaboration --> ClaudeCode
    Collaboration --> Gemini
    Collaboration --> Codex
    Personas --> Collaboration
    Validator --> Pipeline
    SmartHandoff --> Handoffs
    AutoCheckpoint --> Checkpoints
    Pipeline --> Progress
    Pipeline --> Benchmarks
    Forking --> Forks
    Validator --> Validations
    S01 --> S02 --> S03 --> S04 --> S05 --> S06 --> S07 --> S08 --> S09 --> S10
```

## 핵심 컴포넌트

### 1. Pipeline Controller

파이프라인의 전체 흐름을 관리합니다.

**책임:**
- 스테이지 순서 관리
- 전제조건 검증
- 상태 업데이트

**구현 파일:**
- `config/pipeline.yaml` - 파이프라인 정의
- `scripts/run-stage.sh` - 스테이지 실행

### 2. Hook System

스테이지 전/후 실행되는 훅을 관리합니다.

**책임:**
- 전제조건 검증 (pre-stage)
- 핸드오프 생성 알림 (post-stage)
- 상태 업데이트

**구현 파일:**
- `.claude/hooks/pre-stage.sh`
- `.claude/hooks/post-stage.sh`

### 3. State Management

파이프라인 상태를 외부 파일로 관리합니다.

**상태 파일:**
- `state/progress.json` - 전체 진행 상황
- `state/checkpoints/` - 체크포인트 스냅샷
- `state/handoffs/` - 핸드오프 아카이브

### 4. AI Agent Integration

멀티 AI 에이전트를 통합합니다.

**통합 방식:**
- Claude/ClaudeCode: 직접 실행
- Gemini/Codex: tmux 세션 기반 CLI 호출

**구현 파일:**
- `scripts/gemini-wrapper.sh`
- `scripts/codex-wrapper.sh`

### 5. AI Collaboration Layer

멀티 AI 협업을 조율합니다.

**협업 모드:**
- `parallel`: 동일 작업을 여러 AI로 동시 실행
- `sequential`: AI 간 순차 전달 (리뷰 체인)
- `debate`: AI 간 토론으로 최적 결론 도출

**설정 파일:**
- `config/ai_collaboration.yaml`
- `config/ai_benchmarking.yaml`

### 6. Pipeline Forking Manager

파이프라인 분기를 관리합니다.

**책임:**
- 아키텍처 대안 탐색을 위한 분기 생성
- 분기 간 비교 메트릭 (code_quality, performance, maintainability)
- 최고 성능 분기 병합

**설정 파일:**
- `config/pipeline_forking.yaml`

### 7. Stage Persona System

스테이지별 AI 행동 프로파일을 관리합니다.

**페르소나 예시:**
| 스테이지 | 페르소나 | Temperature |
|---------|---------|-------------|
| 01-brainstorm | Creative Explorer | 0.9 |
| 06-implementation | Precise Builder | 0.3 |
| 08-qa | Quality Guardian | 0.4 |

**설정 파일:**
- `config/stage_personas.yaml`

### 8. Output Validator

스테이지 산출물의 품질을 검증합니다.

**검증 항목:**
- 필수 산출물 존재 확인
- 코드 품질 (lint, typecheck)
- 테스트 커버리지 (80%+ 기준)

**설정 파일:**
- `config/output_validation.yaml`

## 데이터 흐름

### 1. 스테이지 간 데이터 전달

```
Stage N                    Stage N+1
├── outputs/          →    ├── inputs/
│   └── result.md          │   └── (참조)
└── HANDOFF.md        →    └── HANDOFF.md 참조
```

### 2. 핸드오프 프로세스

```mermaid
sequenceDiagram
    participant User
    participant Stage
    participant Hook
    participant State

    User->>Stage: /handoff
    Stage->>Stage: 완료 조건 검증
    Stage->>Stage: HANDOFF.md 생성
    Stage->>Hook: post-stage 훅 실행
    Hook->>State: progress.json 업데이트
    Hook->>State: handoffs/ 아카이브
    State-->>User: 다음 스테이지 안내
```

### 3. 체크포인트 프로세스

```mermaid
sequenceDiagram
    participant User
    participant Script
    participant State

    User->>Script: /checkpoint "설명"
    Script->>State: 현재 상태 캡처
    Script->>State: outputs/ 복사
    Script->>State: HANDOFF.md 복사
    Script->>State: metadata.json 생성
    Script->>State: progress.json 업데이트
    State-->>User: 체크포인트 ID 반환
```

## 설정 계층

```
Global (CLAUDE.md, config/*.yaml)
    ↓
Stage (stages/XX/CLAUDE.md, config.yaml)
    ↓
Session (runtime state)
```

### 설정 우선순위
1. 스테이지 설정이 전역 설정을 오버라이드
2. 런타임 상태가 정적 설정을 오버라이드

### 설정 파일 목록

**기본 설정:**
- `config/pipeline.yaml` - 파이프라인 정의
- `config/models.yaml` - AI 모델 할당
- `config/context.yaml` - 컨텍스트 관리 설정
- `config/git.yaml` - Git 자동 커밋 규칙

**Multi-AI 설정:**
- `config/ai_collaboration.yaml` - AI 협업 모드 설정
- `config/ai_benchmarking.yaml` - AI 벤치마킹 설정

**지능형 기능 설정:**
- `config/handoff_intelligence.yaml` - 스마트 HANDOFF 설정
- `config/memory_integration.yaml` - AI 메모리 통합 설정
- `config/auto_checkpoint.yaml` - 자동 체크포인트 설정
- `config/smart_rollback.yaml` - 스마트 롤백 설정
- `config/pipeline_forking.yaml` - 파이프라인 분기 설정
- `config/stage_personas.yaml` - 스테이지 페르소나 설정
- `config/output_validation.yaml` - 산출물 검증 설정

### State 디렉토리 구조

```
state/
├── progress.json        # 파이프라인 진행 상황
├── checkpoints/         # 체크포인트 저장
├── context/             # 컨텍스트 상태 저장
├── handoffs/            # 핸드오프 아카이브
├── ai_benchmarks/       # AI 벤치마크 결과
├── forks/               # 파이프라인 분기 상태
├── validations/         # 검증 결과 저장
└── templates/           # 상태 템플릿
```

## 확장 포인트

### 1. 새 스테이지 추가

```bash
mkdir -p stages/XX-new-stage/{prompts,templates,inputs,outputs}
```

필수 파일:
- `CLAUDE.md` - AI 지침
- `config.yaml` - 스테이지 설정
- `HANDOFF.md.template` - 핸드오프 템플릿

### 2. 새 AI 모델 추가

1. `config/models.yaml`에 모델 정의 추가
2. 필요시 래퍼 스크립트 작성 (`scripts/XXX-wrapper.sh`)
3. 슬래시 커맨드 추가 (`.claude/commands/XXX.md`)

### 3. 커스텀 훅 추가

`.claude/hooks/` 디렉토리에 스크립트 추가 후 `pipeline.yaml`에서 참조

## 보안 고려사항

1. **API 키**: 환경 변수로 관리 (절대 커밋 금지)
2. **샌드박스**: 구현/테스팅 스테이지는 샌드박스 모드
3. **체크포인트**: 민감 정보 제외 권장

## 성능 최적화

1. **컨텍스트 관리**: 퍼센트 기반 임계값 (60%/50%/40% 남은 컨텍스트 기준)
   - 60% 남음: 경고 배너 표시
   - 50% 남음: 자동 상태 저장, 압축 권장
   - 40% 남음: `/clear` 권고, 복구 HANDOFF 생성
2. **병렬 실행**: Orchestrator-Workers 패턴 활용
3. **캐싱**: MCP 서버 캐시 활용 (firecrawl, exa)
