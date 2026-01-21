# Pipeline Forks

파이프라인 분기 상태 저장 디렉토리

## 저장 내용

각 분기는 다음 구조를 가짐:

```
fork_name/
├── FORK_HANDOFF.md     # 분기 핸드오프
├── metadata.json       # 분기 메타데이터
├── outputs/            # 분기 산출물 복사본
└── state/              # 분기 시점 상태
```

## 메타데이터 형식

```json
{
    "name": "fork_03-planning_20240101_120000",
    "stage": "03-planning",
    "reason": "아키텍처 대안 탐색",
    "direction": "microservices",
    "created_at": "2024-01-01T12:00:00Z",
    "status": "active",
    "metrics": {}
}
```

## 분기 상태

- `active` - 활성 분기 (작업 중)
- `merged` - 병합된 분기
- `abandoned` - 폐기된 분기

## 관련 설정

- `config/pipeline_forking.yaml` - 분기 설정
- `scripts/pipeline-fork.sh` - 분기 관리 스크립트

## 사용 방법

```bash
# 분기 생성
/fork create --reason "대안 탐색"

# 분기 목록
/fork list

# 분기 비교
/fork compare

# 분기 병합
/fork merge fork_name
```

## 제한사항

- 최대 활성 분기: 3개
- 분기 전 체크포인트 자동 생성
