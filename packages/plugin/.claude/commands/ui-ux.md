# /ui-ux

UI/UX Planning 스테이지 (04-ui-ux)를 실행합니다.

## 사용법

```
/ui-ux [--dry-run]
```

## 스테이지 정보

| 항목 | 값 |
|------|-----|
| ID | 04-ui-ux |
| 이름 | UI/UX Planning |
| AI 모델 | Gemini |
| 실행 모드 | Plan Mode |
| 체크포인트 | 선택 |

## 입력 (Inputs)

이전 스테이지의 산출물:
- `03-planning/outputs/architecture.md`
- `01-brainstorm/outputs/requirements.md`

## 출력 (Outputs)

- `outputs/wireframes.md` - 와이어프레임
- `outputs/component_specs.md` - 컴포넌트 명세
- `outputs/design_system.md` - 디자인 시스템

## 완료 조건

1. ✅ 모든 산출물 생성
2. ✅ HANDOFF.md 생성

## 다음 스테이지

완료 후 `/next`를 실행하여 05-task-management로 전환합니다.
