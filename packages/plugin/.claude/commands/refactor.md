# /refactor

Refactoring 스테이지 (07-refactoring)를 실행합니다.

## 사용법

```
/refactor [--dry-run]
```

## 스테이지 정보

| 항목 | 값 |
|------|-----|
| ID | 07-refactoring |
| 이름 | Refactoring |
| AI 모델 | Codex |
| 실행 모드 | Deep Dive |
| 체크포인트 | 필수 |

## 입력 (Inputs)

이전 스테이지의 산출물:
- `06-implementation/outputs/source_code`
- `06-implementation/outputs/implementation_log.md`

## 출력 (Outputs)

- `outputs/refactored_code` - 리팩토링된 코드
- `outputs/refactoring_log.md` - 리팩토링 기록
- `outputs/performance_improvements.md` - 성능 개선 사항

## 체크포인트 필수

이 스테이지는 **체크포인트가 필수**입니다.

## Git 커밋 규칙

```
refactor(refactor): <리팩토링 내용>
```

## 완료 조건

1. ✅ 리팩토링 완료
2. ✅ 모든 산출물 생성
3. ✅ 체크포인트 생성
4. ✅ HANDOFF.md 생성

## 다음 스테이지

완료 후 `/next`를 실행하여 08-qa로 전환합니다.
