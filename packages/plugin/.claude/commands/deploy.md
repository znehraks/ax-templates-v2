# /deploy

CI/CD & Deployment 스테이지 (10-deployment)를 실행합니다.

## 사용법

```
/deploy [--dry-run]
```

## 스테이지 정보

| 항목 | 값 |
|------|-----|
| ID | 10-deployment |
| 이름 | CI/CD & Deployment |
| AI 모델 | ClaudeCode |
| 실행 모드 | Headless |
| 체크포인트 | 선택 |

## 입력 (Inputs)

이전 스테이지의 산출물:
- `09-testing/outputs/test_results.md`
- 전체 소스 코드

## 출력 (Outputs)

- `outputs/ci_cd_config.md` - CI/CD 설정
- `outputs/deployment_guide.md` - 배포 가이드
- `outputs/release_notes.md` - 릴리즈 노트

## Git 커밋 규칙

```
ci(deploy): <배포 관련 내용>
```

## 완료 조건

1. ✅ CI/CD 파이프라인 설정
2. ✅ 모든 산출물 생성
3. ✅ HANDOFF.md 생성

## 파이프라인 완료

이 스테이지가 완료되면 전체 파이프라인이 완료됩니다.

```
🎉 모든 파이프라인 스테이지가 완료되었습니다!
```
