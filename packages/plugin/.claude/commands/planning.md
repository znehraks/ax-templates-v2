# /planning

Planning 스테이지 (03-planning)를 실행합니다.

## 사용법

```
/planning [--dry-run]
```

## 스테이지 정보

| 항목 | 값 |
|------|-----|
| ID | 03-planning |
| 이름 | Planning |
| AI 모델 | Gemini |
| 실행 모드 | Plan Mode |
| 체크포인트 | 선택 |

## 입력 (Inputs)

이전 스테이지의 산출물:
- `02-research/outputs/market_research.md`
- `02-research/outputs/tech_research.md`

## 출력 (Outputs)

- `outputs/architecture.md` - 시스템 아키텍처
- `outputs/tech_stack.md` - 기술 스택 결정
- `outputs/project_plan.md` - 프로젝트 계획

## 완료 조건

1. ✅ 모든 산출물 생성
2. ✅ HANDOFF.md 생성

## 다음 스테이지

완료 후 `/next`를 실행하여 04-ui-ux로 전환합니다.
