# /run-stage

특정 스테이지를 실행합니다.

## 사용법

```
/run-stage <stage-id> [--dry-run] [--force]
```

## 인자

- `stage-id`: 실행할 스테이지 ID (예: `01-brainstorm`, `06-implementation`)
- `--dry-run`: 입력 검증만 수행, 실제 실행 없음
- `--force`: 검증 실패해도 강제 실행

## 동작

1. 스테이지 존재 확인
2. 이전 스테이지 완료 여부 확인 (의존성)
3. 이전 스테이지 HANDOFF.md 존재 확인
4. 필수 입력 파일 검증
5. 스테이지 상태를 `in_progress`로 업데이트
6. 스테이지 CLAUDE.md 로드

## 스테이지 목록

| ID | 이름 |
|----|------|
| 01-brainstorm | Brainstorming |
| 02-research | Research |
| 03-planning | Planning |
| 04-ui-ux | UI/UX Planning |
| 05-task-management | Task Management |
| 06-implementation | Implementation |
| 07-refactoring | Refactoring |
| 08-qa | QA |
| 09-testing | Testing & E2E |
| 10-deployment | CI/CD & Deployment |

## 예시

```
/run-stage 01-brainstorm
/run-stage 06-implementation --dry-run
/run-stage 03-planning --force
```

## 스테이지 완료 후

1. 모든 산출물 생성 확인
2. `/handoff` 실행하여 HANDOFF.md 생성
3. `/next` 실행하여 다음 스테이지로 전환
