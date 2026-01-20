# Stage 01: Brainstorming

## 목표
프로젝트 아이디어 발산 및 초기 요구사항 정의

## AI 모델
- **Primary**: Gemini (아이디어 생성)
- **Secondary**: ClaudeCode (구조화)

## 실행 모드
YOLO (Container) - 자유로운 아이디어 발산

## 입력 파일
- `inputs/project_brief.md` - 프로젝트 개요 (필수)

## 산출물
- [ ] `outputs/ideas.md` - 아이디어 목록
- [ ] `outputs/requirements.md` - 초기 요구사항
- [ ] `outputs/constraints.md` - 제약 조건

## 프로세스

### 1. 프로젝트 브리프 분석
`inputs/project_brief.md` 파일을 읽고 핵심 요구사항을 파악합니다.

### 2. 아이디어 발산
Gemini를 활용하여 다양한 아이디어를 생성합니다:
```
/gemini prompts/ideation.md -o outputs/ideas.md
```

### 3. 요구사항 정리
생성된 아이디어를 바탕으로 요구사항을 정리합니다.

### 4. 제약 조건 식별
기술적, 비즈니스적 제약 조건을 식별합니다.

## 완료 조건
1. 모든 산출물 파일 생성
2. HANDOFF.md 작성
3. 다음 스테이지 전환 준비

## 다음 스테이지
02-research (Research)
