# /qa

QA 스테이지 (08-qa)를 실행합니다.

## 사용법

```
/qa [--dry-run]
```

## 스테이지 정보

| 항목 | 값 |
|------|-----|
| ID | 08-qa |
| 이름 | QA |
| AI 모델 | ClaudeCode |
| 실행 모드 | Plan + Sandbox |
| 체크포인트 | 선택 |

## 입력 (Inputs)

이전 스테이지의 산출물:
- `07-refactoring/outputs/refactored_code`
- `04-ui-ux/outputs/component_specs.md`

## 출력 (Outputs)

- `outputs/bug_report.md` - 버그 리포트
- `outputs/fixes_applied.md` - 적용된 수정사항
- `outputs/qa_checklist.md` - QA 체크리스트

## Git 커밋 규칙

```
fix(qa): <버그 수정 내용>
```

## 완료 조건

1. ✅ QA 검증 완료
2. ✅ 모든 산출물 생성
3. ✅ HANDOFF.md 생성

## 다음 스테이지

완료 후 `/next`를 실행하여 09-testing으로 전환합니다.
