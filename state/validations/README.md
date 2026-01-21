# Validations

스테이지별 산출물 검증 결과 저장 디렉토리

## 저장 내용

- `validation_*.json` - 검증 실행 결과
- `latest.json` - 최신 검증 결과
- `reports/` - 검증 리포트

## 파일 형식

```json
{
    "stage": "06-implementation",
    "timestamp": "2024-01-01T12:00:00Z",
    "status": "passed",
    "checks": {
        "required_files": {
            "passed": true,
            "details": ["src/ exists", "package.json exists"]
        },
        "validation_commands": {
            "passed": true,
            "details": ["npm run lint: passed", "npm run typecheck: passed"]
        },
        "quality_metrics": {
            "passed": true,
            "score": 0.85,
            "details": ["Code quality: 0.88", "Test coverage: 0.82"]
        }
    },
    "summary": {
        "total_checks": 3,
        "passed": 3,
        "failed": 0
    }
}
```

## 관련 설정

- `config/output_validation.yaml` - 검증 규칙 설정
- `.claude/hooks/output-validator.sh` - 검증 훅 스크립트

## 사용 방법

```bash
# 현재 스테이지 검증
/validate

# 특정 스테이지 검증
/validate --stage 06-implementation

# 자동 수정 포함 검증
/validate --fix

# 상세 출력
/validate --verbose
```

## 검증 항목

1. **필수 파일** - 스테이지별 필수 산출물 존재 여부
2. **내용 검사** - 파일 내용 형식 및 구조
3. **검증 명령** - lint, typecheck, test 등 실행
4. **품질 메트릭** - 코드 품질, 테스트 커버리지 등
