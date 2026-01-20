# Getting Started

ax-templates 워크플로우 시스템 시작 가이드

## 설치

### 1. 필수 도구 설치

```bash
# macOS
brew install tmux jq

# Ubuntu
apt install tmux jq
```

### 2. Claude Code CLI 설치

Claude Code가 이미 설치되어 있다고 가정합니다.

### 3. (선택) 외부 AI CLI 설치

```bash
# Gemini CLI
# Google AI Studio에서 설치 가이드 참조

# Codex CLI
# OpenAI에서 설치 가이드 참조
```

## 첫 번째 프로젝트

### Step 1: 프로젝트 초기화

```bash
/init-project my-app
```

출력:
```
✓ 프로젝트 'my-app' 초기화 완료
✓ 작업 디렉토리: projects/my-app/
✓ 상태 파일 업데이트됨

다음 단계:
1. stages/01-brainstorm/inputs/project_brief.md 작성
2. /run-stage 01-brainstorm 실행
```

### Step 2: 프로젝트 브리프 작성

`stages/01-brainstorm/inputs/project_brief.md` 파일을 열고 내용을 채웁니다:

```markdown
# Project Brief

## 프로젝트 이름
my-app

## 한 줄 설명
개인 생산성을 높이는 태스크 관리 앱

## 문제 정의
기존 투두앱은 너무 복잡하거나 너무 단순함

## 타겟 사용자
1인 개발자, 프리랜서

## 핵심 기능 (초안)
1. 간단한 태스크 생성
2. 포모도로 타이머
3. 일간/주간 리뷰
```

### Step 3: 브레인스토밍 시작

```bash
/run-stage 01-brainstorm
```

스테이지 CLAUDE.md 지침에 따라 작업을 진행합니다.

### Step 4: Gemini 활용 (선택)

브레인스토밍 중 외부 리서치가 필요하면:

```bash
/gemini "태스크 관리 앱의 최신 트렌드를 Reddit에서 검색해줘"
```

### Step 5: 핸드오프 생성

스테이지 완료 후:

```bash
/handoff
```

완료 조건을 충족하면 HANDOFF.md가 생성됩니다.

### Step 6: 다음 스테이지 진행

```bash
/run-stage 02-research
```

## 워크플로우 팁

### 1. 스테이지별 역할 분담

- **Gemini**: 발산적 사고, 웹 리서치
- **Claude**: 심층 분석, 문서 합성
- **ClaudeCode**: 코드 생성, 구조화
- **Codex**: 리팩토링, 테스트 생성

### 2. 체크포인트 활용

구현/리팩토링 스테이지에서는 주기적으로:

```bash
/checkpoint "스프린트 1 완료"
```

문제 발생 시 복구:

```bash
scripts/restore-checkpoint.sh CP-06-20240120-1430
```

### 3. 컨텍스트 관리 (퍼센트 기반)

| 남은 컨텍스트 | 동작 |
|--------------|------|
| 60% | 경고 배너 표시 |
| 50% | 자동 상태 저장, 압축 권장 |
| 40% | `/clear` 권고, 복구 HANDOFF 생성 |

- 5개 태스크 완료마다 자동 저장
- 상태 저장 위치: `state/context/state_{timestamp}_{stage}.md`

## 문제 해결

### "전제조건 미충족" 오류

이전 스테이지의 HANDOFF.md가 없으면 발생합니다.

```bash
# 이전 스테이지에서 핸드오프 생성
/handoff

# 또는 강제 진행 (권장하지 않음)
# scripts/run-stage.sh 02-research --force
```

### tmux 세션 문제

```bash
# 기존 세션 확인
tmux ls

# 세션 강제 종료
tmux kill-session -t ax-gemini
tmux kill-session -t ax-codex
```

## 다음 단계

- [Architecture](architecture.md) - 시스템 아키텍처 이해
- [Design Patterns](patterns/) - 적용된 디자인 패턴
- [Examples](../examples/) - 예제 프로젝트
