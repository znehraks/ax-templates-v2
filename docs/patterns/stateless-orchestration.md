# Stateless Orchestration Pattern

무상태 컨텍스트 전달 패턴

## 개요

각 스테이지는 독립적으로 실행되며, 필요한 모든 컨텍스트는 HANDOFF.md 문서를 통해 전달됩니다.

## 적용 위치

- `stages/*/HANDOFF.md.template` - 핸드오프 템플릿
- `state/handoffs/` - 핸드오프 아카이브
- `.claude/commands/handoff.md` - 핸드오프 생성 커맨드

## 구현

### HANDOFF.md 구조

```markdown
# Stage Handoff: {{CURRENT}} → {{NEXT}}

## 완료된 작업
- [체크리스트]

## 다음 에이전트를 위한 컨텍스트
### 핵심 결정사항
### 성공한 접근법
### 실패한 접근법

## 다음 단계
1. 즉시 실행할 작업
```

### 무상태 원칙

1. 각 스테이지는 이전 세션의 메모리에 의존하지 않음
2. 모든 컨텍스트는 파일로 전달
3. AI 에이전트는 HANDOFF.md와 outputs만으로 작업 재개 가능

## 장점

- 세션 독립성
- 컨텍스트 명확화
- 디버깅 용이
- 다른 AI로 대체 가능

## 단점

- 핸드오프 작성 오버헤드
- 컨텍스트 손실 가능성

## 관련 패턴

- Sequential Workflow
- Proactive State Externalization
