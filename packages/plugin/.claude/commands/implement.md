# /implement

Implementation 스테이지 (06-implementation)를 실행합니다.

## 사용법

```
/implement [--dry-run]
```

## 옵션

- `--dry-run`: 입력 검증만 수행, 실제 실행 없음

## 스테이지 정보

| 항목 | 값 |
|------|-----|
| ID | 06-implementation |
| 이름 | Implementation |
| AI 모델 | ClaudeCode |
| 실행 모드 | Plan + Sandbox |
| 체크포인트 | 필수 |
| 타임아웃 | 14400초 (4시간) |

## 입력 (Inputs)

이전 스테이지의 산출물:
- `05-task-management/outputs/task_breakdown.md`
- `05-task-management/outputs/implementation_order.md`
- `04-ui-ux/outputs/component_specs.md`
- `03-planning/outputs/architecture.md`

## 출력 (Outputs)

- `source_code` - 구현된 소스 코드
- `outputs/implementation_log.md` - 구현 로그
- `outputs/technical_decisions.md` - 기술적 결정 기록

## 실행 모드: Plan + Sandbox

1. **Plan Mode**: 구현 계획 수립
   - 태스크 분석
   - 의존성 파악
   - 구현 순서 확정

2. **Sandbox Mode**: 격리된 환경에서 실행
   - 안전한 코드 실행
   - 테스트 실행

## 체크포인트 필수

이 스테이지는 **체크포인트가 필수**입니다:
- 주요 기능 구현 완료 시마다 `/checkpoint` 실행
- 최소 50% 구현 시점에 체크포인트 권장

```
/checkpoint -m "사용자 인증 구현 완료"
/checkpoint -m "API 엔드포인트 구현 완료"
```

## Git 커밋 규칙

이 스테이지의 커밋 형식:
```
feat(impl): <구현 내용>
```

예시:
- `feat(impl): 사용자 인증 시스템 구현`
- `feat(impl): REST API 엔드포인트 추가`
- `feat(impl): 데이터베이스 스키마 생성`

## 완료 조건

1. ✅ 모든 태스크 구현 완료
2. ✅ `outputs/implementation_log.md` 작성
3. ✅ `outputs/technical_decisions.md` 작성
4. ✅ 최소 1개 체크포인트 생성
5. ✅ HANDOFF.md 생성

## 다음 스테이지

완료 후 `/next`를 실행하여 07-refactoring으로 전환합니다.
