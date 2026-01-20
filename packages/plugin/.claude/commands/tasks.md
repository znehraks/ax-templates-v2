# /tasks

Task Management 스테이지 (05-task-management)를 실행합니다.

## 사용법

```
/tasks [--dry-run]
```

## 스테이지 정보

| 항목 | 값 |
|------|-----|
| ID | 05-task-management |
| 이름 | Task Management |
| AI 모델 | ClaudeCode |
| 실행 모드 | Plan Mode |
| 체크포인트 | 선택 |

## 입력 (Inputs)

이전 스테이지의 산출물:
- `04-ui-ux/outputs/component_specs.md`
- `03-planning/outputs/architecture.md`
- `03-planning/outputs/project_plan.md`

## 출력 (Outputs)

- `outputs/task_breakdown.md` - 태스크 분해
- `outputs/implementation_order.md` - 구현 순서
- `outputs/dependencies.md` - 의존성 맵

## 완료 조건

1. ✅ 모든 산출물 생성
2. ✅ HANDOFF.md 생성

## 다음 스테이지

완료 후 `/next`를 실행하여 06-implementation으로 전환합니다.
