# Example: Simple Web App

간단한 웹 애플리케이션 개발 예제

## 프로젝트 개요

- **이름**: simple-todo-app
- **설명**: 간단한 투두 리스트 웹앱
- **기술 스택**: Next.js, TypeScript, Tailwind CSS

## 시작하기

### 1. 프로젝트 초기화

```bash
/init-project simple-todo-app
```

### 2. 프로젝트 브리프

`stages/01-brainstorm/inputs/project_brief.md`:

```markdown
# Project Brief

## 프로젝트 이름
simple-todo-app

## 한 줄 설명
미니멀한 개인용 투두 리스트 웹앱

## 문제 정의
복잡한 프로젝트 관리 도구 대신 단순한 일일 태스크 관리가 필요

## 타겟 사용자
개인 사용자, 1인 개발자

## 핵심 기능
1. 태스크 추가/삭제
2. 완료 체크
3. 로컬 저장 (LocalStorage)

## 제약조건
- 백엔드 없음 (정적 웹앱)
- 모바일 반응형
```

### 3. 파이프라인 실행

```bash
# 브레인스토밍
/run-stage 01-brainstorm
/handoff

# 리서치
/run-stage 02-research
/handoff

# ... (각 스테이지 순차 실행)
```

## 예상 산출물

### 01-brainstorm
- 20개 아이디어 목록
- 3개 사용자 페르소나
- MVP 범위 정의

### 02-research
- 기술 스택 비교 (React vs Vue vs Svelte)
- 경쟁 앱 분석

### 03-planning
- 아키텍처 다이어그램
- 기술 스택: Next.js + Tailwind

### 04-ui-ux
- 3개 화면 와이어프레임
- 디자인 토큰 정의

### 05-task-management
- 15개 태스크 목록
- 2 스프린트 계획

### 06-implementation
- Next.js 프로젝트
- 핵심 컴포넌트

### 07-refactoring
- 코드 최적화
- 중복 제거

### 08-qa
- 버그 수정

### 09-testing
- Jest 단위 테스트
- Playwright E2E 테스트

### 10-deployment
- Vercel 배포
- CI/CD 파이프라인

## 예상 소요 시간

| 스테이지 | 예상 시간 |
|----------|-----------|
| 01-brainstorm | 1시간 |
| 02-research | 1시간 |
| 03-planning | 30분 |
| 04-ui-ux | 1시간 |
| 05-task-management | 30분 |
| 06-implementation | 3시간 |
| 07-refactoring | 1시간 |
| 08-qa | 30분 |
| 09-testing | 1시간 |
| 10-deployment | 30분 |
| **총계** | **~10시간** |
