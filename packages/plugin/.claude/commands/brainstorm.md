# /brainstorm

Brainstorming 스테이지 (01-brainstorm)를 실행합니다.

## 사용법

```
/brainstorm [--dry-run]
```

## 옵션

- `--dry-run`: 입력 검증만 수행, 실제 실행 없음

## 스테이지 정보

| 항목 | 값 |
|------|-----|
| ID | 01-brainstorm |
| 이름 | Brainstorming |
| AI 모델 | Gemini, ClaudeCode |
| 실행 모드 | YOLO (Container) |
| 체크포인트 | 선택 |

## 입력 (Inputs)

- `inputs/project_brief.md` - 프로젝트 개요 (필수)

## 출력 (Outputs)

- `outputs/ideas.md` - 아이디어 목록
- `outputs/requirements.md` - 초기 요구사항
- `outputs/constraints.md` - 제약 조건

## 실행 전 준비

1. `stages/01-brainstorm/inputs/project_brief.md` 작성
   - 프로젝트 목표
   - 대상 사용자
   - 핵심 기능
   - 기술적 제약

## AI 활용

이 스테이지에서는 Gemini를 사용하여 아이디어를 발산합니다:

```
/gemini stages/01-brainstorm/prompts/ideation.md -o stages/01-brainstorm/outputs/ideas.md
```

## 완료 조건

1. ✅ `outputs/ideas.md` 생성
2. ✅ `outputs/requirements.md` 생성
3. ✅ `outputs/constraints.md` 생성
4. ✅ HANDOFF.md 생성

## 다음 스테이지

완료 후 `/next`를 실행하여 02-research로 전환합니다.
