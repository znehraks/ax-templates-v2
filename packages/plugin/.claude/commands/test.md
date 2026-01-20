# /test

Testing & E2E 스테이지 (09-testing)를 실행합니다.

## 사용법

```
/test [--dry-run]
```

## 스테이지 정보

| 항목 | 값 |
|------|-----|
| ID | 09-testing |
| 이름 | Testing & E2E |
| AI 모델 | Codex |
| 실행 모드 | Sandbox + Playwright |
| 체크포인트 | 선택 |

## 입력 (Inputs)

이전 스테이지의 산출물:
- `08-qa/outputs/fixes_applied.md`
- `07-refactoring/outputs/refactored_code`

## 출력 (Outputs)

- `outputs/test_cases.md` - 테스트 케이스
- `outputs/test_results.md` - 테스트 결과
- `outputs/coverage_report.md` - 커버리지 리포트

## Playwright 활용

E2E 테스트에 Playwright MCP 서버를 활용합니다.

## Git 커밋 규칙

```
test(test): <테스트 내용>
```

## 완료 조건

1. ✅ 테스트 작성 및 실행 완료
2. ✅ 모든 산출물 생성
3. ✅ HANDOFF.md 생성

## 다음 스테이지

완료 후 `/next`를 실행하여 10-deployment로 전환합니다.
