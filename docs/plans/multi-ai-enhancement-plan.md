# ax-templates-3 고유 강점 강화 계획

## 📋 전략 변경

**이전 방향**: OMC 기능 전체 복제
**새로운 방향**: ax-templates 고유 강점 강화 + OMC 아이디어 선택적 적용

### 🎯 핵심 차별화 포인트

| ax-templates 강점 | OMC에 없음 | 강화 방향 |
|------------------|-----------|----------|
| Multi-AI Orchestration | ✅ | AI 협업/벤치마킹 추가 |
| HANDOFF 시스템 | ✅ | 스마트 컨텍스트 전달 |
| 체크포인트/롤백 | ✅ | 자동화 + 분기 탐색 |
| 스테이지별 최적화 | ✅ | 페르소나 + 검증 강화 |

---

## 🚀 강화 영역 1: Multi-AI Orchestration

### 현재 상태
- 스테이지별 단일 AI 모델 할당
- 순차적 실행만 지원

### 강화 기능

#### 1.1 Cross-AI Collaboration (AI 협업)
```yaml
# config/ai_collaboration.yaml (신규)
collaboration_modes:
  parallel_execution:
    description: "동일 작업을 여러 AI로 동시 실행"
    stages: ["01-brainstorm", "02-research"]
    models: ["gemini", "claude"]
    merge_strategy: "best_of_n"

  sequential_handoff:
    description: "AI 간 순차 전달 (리뷰 체인)"
    example:
      - claude: "초안 작성"
      - gemini: "창의적 개선"
      - codex: "기술 검증"

  debate_mode:
    description: "AI 간 토론으로 최적 결론 도출"
    stages: ["03-planning", "04-ui-ux"]
    participants: ["claude", "gemini"]
    rounds: 3
```

#### 1.2 AI Model Benchmarking (AI 벤치마킹)
```yaml
# config/ai_benchmarking.yaml (신규)
benchmarking:
  enabled_stages: ["06-implementation"]

  benchmark_tasks:
    - task: "코드 생성"
      models: ["claude", "codex"]
      metrics:
        - correctness
        - performance
        - style_compliance

  selection_strategy:
    auto: true
    fallback_to: "claude"

  history_tracking:
    enabled: true
    path: "state/ai_benchmarks/"
```

#### 1.3 AI Model Specialization (AI 전문화)
```yaml
# config/models.yaml 확장
models:
  claude:
    strengths:
      - "정확한 코드 생성"
      - "복잡한 로직 분석"
      - "에러 디버깅"
    best_for: ["06-implementation", "08-qa"]

  gemini:
    strengths:
      - "창의적 아이디어"
      - "다양한 관점"
      - "빠른 탐색"
    best_for: ["01-brainstorm", "03-planning"]

  codex:
    strengths:
      - "깊이 있는 분석"
      - "리팩토링"
      - "테스트 생성"
    best_for: ["07-refactoring", "09-testing"]

  # 새로운 기능: 동적 모델 선택
  dynamic_selection:
    enabled: true
    criteria:
      - task_type
      - complexity
      - previous_performance
```

---

## 🔄 강화 영역 2: HANDOFF 시스템

### 현재 상태
- 수동 HANDOFF.md 생성
- 기본 템플릿 기반

### 강화 기능

#### 2.1 Smart Context Extraction (스마트 컨텍스트 추출)
```yaml
# config/handoff_intelligence.yaml (신규)
smart_handoff:
  auto_extraction:
    enabled: true
    extract_from:
      - "completed_tasks"
      - "key_decisions"
      - "modified_files"
      - "pending_issues"
      - "ai_call_history"

  compression:
    strategy: "semantic"
    max_tokens: 4000
    preserve:
      - "critical_decisions"
      - "blocking_issues"
      - "file_changes"
```

#### 2.2 AI Memory Integration (AI 메모리 통합)
```yaml
# config/memory_integration.yaml (신규)
memory_integration:
  providers:
    - claude_mem:
        enabled: true
        sync_on: ["stage_complete", "session_end"]

  handoff_memory_sync:
    on_stage_complete:
      - action: "save_to_memory"
        content: "key_decisions"
        tags: ["stage", "project"]

    on_stage_start:
      - action: "load_from_memory"
        filter: "previous_stage"
        inject_to: "context"
```

#### 2.3 Contextual Summarization (컨텍스트 요약)
```markdown
# .claude/skills/smart-handoff/summarize.md (신규)

자동 요약 생성:
1. 완료된 작업 → 핵심 성과로 압축
2. 수정된 파일 → 변경 영향도 분석
3. 결정 사항 → 이유와 대안 포함
4. 다음 단계 → 즉시 실행 가능한 형태로
```

---

## 💾 강화 영역 3: 체크포인트/롤백 시스템

### 현재 상태
- 수동 체크포인트 생성
- 06, 07 스테이지에서만 필수

### 강화 기능

#### 3.1 Auto-Checkpoint (자동 체크포인트)
```yaml
# config/auto_checkpoint.yaml (신규)
auto_checkpoint:
  triggers:
    - condition: "5_tasks_completed"
      action: "create_checkpoint"

    - condition: "major_file_change"
      threshold: 100  # lines
      action: "create_checkpoint"

    - condition: "before_destructive_action"
      patterns: ["rm", "delete", "drop"]
      action: "force_checkpoint"

  retention:
    max_checkpoints: 10
    cleanup_strategy: "keep_milestones"
```

#### 3.2 Smart Rollback (스마트 롤백)
```yaml
# config/smart_rollback.yaml (신규)
smart_rollback:
  suggestion:
    on_error:
      - analyze_error_type
      - find_relevant_checkpoint
      - suggest_rollback_scope

  partial_rollback:
    enabled: true
    granularity:
      - "file_level"
      - "function_level"
      - "stage_level"

  rollback_preview:
    show_diff: true
    show_impact: true
    require_confirmation: true
```

#### 3.3 Pipeline Forking (파이프라인 분기)
```yaml
# config/pipeline_forking.yaml (신규)
pipeline_forking:
  enabled: true

  fork_points:
    - stage: "03-planning"
      condition: "multiple_architectures_proposed"
      action: "create_fork"

  fork_management:
    max_active_forks: 3
    merge_strategy: "best_performer"

  comparison:
    metrics:
      - "code_quality"
      - "performance"
      - "maintainability"
```

---

## 🎯 강화 영역 4: 스테이지별 최적화

### 현재 상태
- 각 스테이지에 CLAUDE.md 존재
- 기본 검증만 수행

### 강화 기능

#### 4.1 Stage Personas (스테이지 페르소나)
```yaml
# config/stage_personas.yaml (신규)
# OMC의 에이전트 개념을 스테이지에 맞게 재해석

stage_personas:
  "01-brainstorm":
    persona: "Creative Explorer"
    traits:
      - "발산적 사고"
      - "제약 없는 아이디어"
      - "다양한 관점"
    ai_model: "gemini"
    temperature: 0.9

  "06-implementation":
    persona: "Precise Builder"
    traits:
      - "정확한 구현"
      - "에러 방지"
      - "테스트 가능한 코드"
    ai_model: "claude"
    temperature: 0.3

  "07-refactoring":
    persona: "Code Surgeon"
    traits:
      - "깊이 있는 분석"
      - "성능 최적화"
      - "기술 부채 해소"
    ai_model: "codex"
    temperature: 0.5
```

#### 4.2 Output Validation (산출물 검증)
```yaml
# config/output_validation.yaml (신규)
validation:
  per_stage:
    "01-brainstorm":
      required_outputs:
        - ideas.md: {min_ideas: 5}
        - requirements_analysis.md: {sections: ["기능", "비기능"]}

    "06-implementation":
      required_outputs:
        - source_code/: {lint_pass: true, type_check: true}
        - implementation_log.md: {format: "changelog"}
      validation_commands:
        - "npm run lint"
        - "npm run typecheck"

    "09-testing":
      required_outputs:
        - tests/: {coverage_min: 80}
        - test_report.md: {pass_rate: 100}
      validation_commands:
        - "npm run test:coverage"
```

#### 4.3 Stage-Specific Prompts Enhancement
```
stages/XX-stage/
├── CLAUDE.md                    # 기존
├── prompts/
│   ├── main.md                  # 메인 프롬프트
│   ├── persona.md               # 페르소나 프롬프트 (신규)
│   ├── validation.md            # 검증 프롬프트 (신규)
│   └── collaboration.md         # AI 협업 프롬프트 (신규)
```

---

## 📁 파일 구조 변경

### 신규 생성 파일

```
ax-templates-3/
├── config/
│   ├── ai_collaboration.yaml     # 🆕 AI 협업 설정
│   ├── ai_benchmarking.yaml      # 🆕 AI 벤치마킹
│   ├── handoff_intelligence.yaml # 🆕 스마트 HANDOFF
│   ├── memory_integration.yaml   # 🆕 메모리 통합
│   ├── auto_checkpoint.yaml      # 🆕 자동 체크포인트
│   ├── smart_rollback.yaml       # 🆕 스마트 롤백
│   ├── pipeline_forking.yaml     # 🆕 파이프라인 분기
│   ├── stage_personas.yaml       # 🆕 스테이지 페르소나
│   └── output_validation.yaml    # 🆕 산출물 검증
│
├── .claude/
│   ├── skills/
│   │   ├── smart-handoff/        # 🆕 스마트 HANDOFF 스킬
│   │   │   ├── README.md
│   │   │   ├── extract.md
│   │   │   ├── summarize.md
│   │   │   └── prompts/CLAUDE.md
│   │   ├── ai-collaboration/     # 🆕 AI 협업 스킬
│   │   │   ├── README.md
│   │   │   ├── parallel.md
│   │   │   ├── debate.md
│   │   │   └── prompts/CLAUDE.md
│   │   ├── auto-checkpoint/      # 🆕 자동 체크포인트 스킬
│   │   │   ├── README.md
│   │   │   ├── trigger.md
│   │   │   ├── rollback.md
│   │   │   └── prompts/CLAUDE.md
│   │   └── output-validator/     # 🆕 산출물 검증 스킬
│   │       ├── README.md
│   │       ├── validate.md
│   │       └── prompts/CLAUDE.md
│   │
│   ├── commands/
│   │   ├── collaborate.md        # 🆕 /collaborate (AI 협업)
│   │   ├── benchmark.md          # 🆕 /benchmark (AI 벤치마킹)
│   │   ├── fork.md               # 🆕 /fork (파이프라인 분기)
│   │   └── validate.md           # 🆕 /validate (산출물 검증)
│   │
│   └── hooks/
│       ├── auto-checkpoint.sh    # 🆕 자동 체크포인트 훅
│       ├── output-validator.sh   # 🆕 산출물 검증 훅
│       └── ai-selector.sh        # 🆕 동적 AI 선택 훅
│
├── scripts/
│   ├── ai-benchmark.sh           # 🆕 AI 벤치마킹 스크립트
│   ├── smart-handoff.sh          # 🆕 스마트 HANDOFF 스크립트
│   ├── pipeline-fork.sh          # 🆕 파이프라인 분기 스크립트
│   └── output-validate.sh        # 🆕 산출물 검증 스크립트
│
└── state/
    ├── ai_benchmarks/            # 🆕 AI 벤치마크 결과
    ├── forks/                    # 🆕 파이프라인 분기 상태
    └── validations/              # 🆕 검증 결과
```

### 수정 파일

```
config/models.yaml                # AI 전문화 + 동적 선택 추가
config/pipeline.yaml              # 분기 지원 추가
.claude/settings.json             # 새 커맨드/스킬 등록
stages/*/CLAUDE.md                # 페르소나 적용
stages/*/prompts/                 # 협업/검증 프롬프트 추가
CLAUDE.md                         # 문서 업데이트
```

---

## 📅 구현 일정

### Week 1: Multi-AI Orchestration
| 일차 | 작업 | 산출물 |
|------|------|--------|
| Day 1-2 | AI 협업 설정 및 스킬 | `ai_collaboration.yaml`, `skills/ai-collaboration/` |
| Day 3-4 | AI 벤치마킹 시스템 | `ai_benchmarking.yaml`, `scripts/ai-benchmark.sh` |
| Day 5 | 동적 AI 선택 훅 | `hooks/ai-selector.sh`, `models.yaml` 확장 |

### Week 2: HANDOFF 시스템 강화
| 일차 | 작업 | 산출물 |
|------|------|--------|
| Day 1-2 | 스마트 컨텍스트 추출 | `handoff_intelligence.yaml`, `skills/smart-handoff/` |
| Day 3-4 | AI 메모리 통합 | `memory_integration.yaml`, claude-mem 연동 |
| Day 5 | 컨텍스트 요약 | `smart-handoff.sh` |

### Week 3: 체크포인트/롤백 강화
| 일차 | 작업 | 산출물 |
|------|------|--------|
| Day 1-2 | 자동 체크포인트 | `auto_checkpoint.yaml`, `skills/auto-checkpoint/` |
| Day 3 | 스마트 롤백 | `smart_rollback.yaml` |
| Day 4-5 | 파이프라인 분기 | `pipeline_forking.yaml`, `/fork` 커맨드 |

### Week 4: 스테이지별 최적화
| 일차 | 작업 | 산출물 |
|------|------|--------|
| Day 1-2 | 스테이지 페르소나 | `stage_personas.yaml`, 각 스테이지 CLAUDE.md 업데이트 |
| Day 3-4 | 산출물 검증 | `output_validation.yaml`, `skills/output-validator/` |
| Day 5 | 통합 테스트 | E2E 테스트, 문서화 |

---

## 🔍 검증 방법

### 1. Multi-AI Orchestration 테스트
```bash
# AI 협업 테스트
/collaborate --mode parallel --task "아이디어 생성"
# → Gemini + Claude 동시 실행 → 결과 병합

# AI 벤치마킹 테스트
/benchmark --task "함수 구현" --models "claude,codex"
# → 결과 비교표 출력
```

### 2. HANDOFF 시스템 테스트
```bash
# 스마트 HANDOFF 생성
/handoff --smart
# → 자동 컨텍스트 추출 + 요약 + 메모리 저장

# 메모리 통합 확인
claude-mem search "stage:06-implementation"
```

### 3. 체크포인트/롤백 테스트
```bash
# 자동 체크포인트 확인 (5개 태스크 완료 후)
ls state/checkpoints/

# 파이프라인 분기
/fork --reason "아키텍처 대안 탐색"
# → 분기 생성 → 각각 진행 → 비교 → 병합
```

### 4. 스테이지 최적화 테스트
```bash
# 산출물 검증
/validate --stage 06
# → lint, typecheck, coverage 검사 → 결과 리포트
```

---

## ⚠️ 주의사항

1. **점진적 적용**: 한 번에 모든 기능 활성화보다 단계적 도입
2. **하위 호환성**: 기존 기능은 그대로 유지
3. **토큰 관리**: AI 협업 시 토큰 사용량 주의
4. **테스트 우선**: 각 기능별 충분한 테스트 후 통합

---

## 🎯 OMC 대비 차별화 요약

| 기능 | OMC | ax-templates (강화 후) |
|------|-----|----------------------|
| AI 모델 | Claude만 | Claude + Gemini + Codex 협업 |
| 구조 | 자유로운 에이전트 | 10단계 SDLC + 페르소나 |
| 컨텍스트 | 세션 내 | HANDOFF + 메모리 통합 |
| 안전망 | 없음 | 자동 체크포인트 + 스마트 롤백 |
| 분기 | 없음 | 파이프라인 포킹 |
| 검증 | 없음 | 스테이지별 산출물 검증 |
| AI 선택 | 고정 | 동적 AI 선택 + 벤치마킹 |

**결론**: OMC를 복제하지 않고, ax-templates만의 고유한 가치를 강화하여 **"구조화된 Multi-AI 소프트웨어 개발 파이프라인"**으로 차별화

---

## 📜 ToS 합법성 검증 완료

### Oh-My-OpenCode 금지 이유 (참고)
- Claude 웹 구독($200/월)을 OAuth로 무단 연동
- Claude Code 클라이언트 스푸핑
- 토큰 남용 ($200 → $1000+ 상당)

### ax-templates의 Multi-AI 방식 합법성

| 서비스 | 인증 방식 | ToS 준수 | 비고 |
|--------|----------|---------|------|
| **Claude Code** | 공식 CLI | ✅ | Anthropic 공식 도구 |
| **Gemini CLI** | API Key | ✅ | "developers building for professional purposes" 허용 |
| **Codex CLI** | API Key | ✅ | Non-interactive Mode 공식 지원 |

### 핵심 차이점
```
Oh-My-OpenCode: Claude 구독 → 비공식 래퍼가 "스푸핑" ❌
ax-templates:   각 서비스 → 공식 CLI + API Key "독립 사용" ✅
```

### 요구사항
1. Gemini API Key 발급 (무료/유료)
2. OpenAI API Key 발급 (유료)
3. 각 서비스의 Quota/Rate Limit 준수
4. 경쟁 AI 모델 개발용 사용 금지 (해당 없음)
