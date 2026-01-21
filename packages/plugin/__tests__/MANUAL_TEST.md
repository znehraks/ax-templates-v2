# ax-templates Plugin - Manual Test Checklist

이 문서는 자동화된 테스트로 검증하기 어려운 항목에 대한 수동 테스트 체크리스트입니다.

## Prerequisites

- [ ] Claude Code CLI가 설치되어 있음
- [ ] tmux가 설치되어 있음
- [ ] pnpm이 설치되어 있음
- [ ] 테스트용 빈 디렉토리가 준비되어 있음

---

## 1. Plugin Installation

### 1.1 Fresh Installation
- [ ] 빈 디렉토리에서 `pnpm add @ax-templates/plugin` 실행
- [ ] `postinstall.js` 스크립트가 실행됨
- [ ] `.claude/` 디렉토리가 복사됨
- [ ] `CLAUDE.md` 파일이 복사됨

### 1.2 Existing Project Installation
- [ ] 기존 프로젝트에 플러그인 설치
- [ ] 기존 `.claude/settings.json`이 보존되거나 병합됨
- [ ] 충돌 시 적절한 경고 메시지 표시

---

## 2. Slash Commands

### 2.1 Project Initialization
- [ ] `/init-project` 실행
- [ ] `.ax-config.yaml` 파일 생성됨
- [ ] `stages/` 디렉토리 구조 생성됨
- [ ] `state/progress.json` 초기화됨

### 2.2 Status Commands
- [ ] `/status` - 전체 파이프라인 상태 표시
- [ ] `/stages` - 모든 스테이지 목록 표시
- [ ] `/context` - 컨텍스트 사용량 표시

### 2.3 Navigation Commands
- [ ] `/run-stage 01-brainstorm` - 특정 스테이지 실행
- [ ] `/next` - 다음 스테이지로 전환
- [ ] `/handoff` - HANDOFF.md 생성

### 2.4 Checkpoint Commands
- [ ] `/checkpoint` - 체크포인트 생성
- [ ] `/restore` - 체크포인트 복원
- [ ] 복원 후 파일 내용 검증

### 2.5 AI CLI Commands
- [ ] `/gemini "테스트 프롬프트"` - Gemini CLI 호출
- [ ] `/codex "테스트 프롬프트"` - Codex CLI 호출
- [ ] tmux 세션에서 출력 확인

### 2.6 Stage Shortcuts
- [ ] `/brainstorm` → 01-brainstorm 실행
- [ ] `/research` → 02-research 실행
- [ ] `/planning` → 03-planning 실행
- [ ] `/ui-ux` → 04-ui-ux 실행
- [ ] `/tasks` → 05-task-management 실행
- [ ] `/implement` → 06-implementation 실행
- [ ] `/refactor` → 07-refactoring 실행
- [ ] `/qa` → 08-qa 실행
- [ ] `/test` → 09-testing 실행
- [ ] `/deploy` → 10-deployment 실행

---

## 3. Hook Scripts

### 3.1 Session Start Hook
- [ ] 새 Claude Code 세션 시작 시 `scripts/session-start.sh` 실행
- [ ] 프로젝트 상태 로드됨
- [ ] 마지막 스테이지 컨텍스트 복원

### 3.2 Stop Hook
- [ ] 세션 종료 시 `scripts/stop.sh` 실행
- [ ] 현재 상태 저장됨
- [ ] tmux 세션 정리됨

### 3.3 Statusline Hook
- [ ] statusline이 올바르게 표시됨
- [ ] 현재 스테이지 정보 포함
- [ ] 컨텍스트 사용량 표시

---

## 4. Context Management

### 4.1 Warning Threshold (60%)
- [ ] 컨텍스트 60% 사용 시 경고 배너 표시
- [ ] 압축 비율 계산 정확함

### 4.2 Action Threshold (50%)
- [ ] 컨텍스트 50% 사용 시 자동 저장
- [ ] `state/context/` 디렉토리에 상태 파일 생성

### 4.3 Critical Threshold (40%)
- [ ] 컨텍스트 40% 사용 시 `/clear` 권고
- [ ] 복구용 HANDOFF 자동 생성

### 4.4 Task-based Auto-save
- [ ] 5개 태스크 완료 후 자동 저장
- [ ] 저장 파일명에 타임스탬프와 스테이지 포함

---

## 5. HANDOFF Generation

### 5.1 Content Validation
- [ ] 완료된 작업 체크리스트 포함
- [ ] 핵심 결정사항 및 이유 포함
- [ ] 성공/실패한 접근법 포함
- [ ] 다음 단계 작업 포함
- [ ] 체크포인트 참조 포함 (해당 시)

### 5.2 File Location
- [ ] 현재 스테이지 디렉토리에 저장됨
- [ ] 파일명: `HANDOFF.md`

---

## 6. Stage Transition

### 6.1 Prerequisites Check
- [ ] 모든 필수 outputs 생성 확인
- [ ] HANDOFF.md 존재 확인
- [ ] progress.json 업데이트

### 6.2 Post-transition
- [ ] 다음 스테이지 CLAUDE.md 로드됨
- [ ] inputs/ 디렉토리에 이전 스테이지 링크

---

## 7. Git Integration

### 7.1 Auto-commit
- [ ] 태스크 완료 시 자동 커밋
- [ ] Conventional Commits 형식 준수
- [ ] 스테이지별 타입/스코프 정확함

### 7.2 Checkpoint Tagging
- [ ] 체크포인트 생성 시 Git 태그 생성
- [ ] 태그 형식: `cp-{stage}-{timestamp}`

---

## 8. Error Handling

### 8.1 Missing Prerequisites
- [ ] Gemini CLI 없을 때 적절한 에러 메시지
- [ ] Codex CLI 없을 때 적절한 에러 메시지
- [ ] tmux 없을 때 적절한 에러 메시지

### 8.2 Invalid Configuration
- [ ] 잘못된 `.ax-config.yaml` 시 에러 메시지
- [ ] 스키마 검증 실패 시 상세 오류 정보

### 8.3 Stage Transition Errors
- [ ] HANDOFF.md 없이 `/next` 시 에러
- [ ] 미완료 outputs로 `/next` 시 에러

---

## 9. MCP Integration

### 9.1 Recommended MCPs
- [ ] context7 MCP 연동 확인
- [ ] exa MCP 연동 확인
- [ ] playwright MCP 연동 확인

---

## Test Results

| Section | Pass | Fail | Notes |
|---------|------|------|-------|
| 1. Plugin Installation | | | |
| 2. Slash Commands | | | |
| 3. Hook Scripts | | | |
| 4. Context Management | | | |
| 5. HANDOFF Generation | | | |
| 6. Stage Transition | | | |
| 7. Git Integration | | | |
| 8. Error Handling | | | |
| 9. MCP Integration | | | |

**Tested by:** _______________
**Date:** _______________
**Plugin Version:** _______________
