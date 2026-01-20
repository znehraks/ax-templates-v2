# Sequential Workflow Architecture Pattern

순차적 단계 정의 및 자동 진행 패턴

## 개요

각 스테이지가 정해진 순서대로 실행되며, 이전 스테이지의 출력이 다음 스테이지의 입력이 되는 패턴입니다.

## 적용 위치

- `config/pipeline.yaml` - 스테이지 순서 정의
- `scripts/run-stage.sh` - 순차 실행 로직
- `.claude/hooks/pre-stage.sh` - 전제조건 검증

## 구현

### 파이프라인 정의

```yaml
# config/pipeline.yaml
stages:
  - id: "01-brainstorm"
    # ...
  - id: "02-research"
    # ...
  # 순서대로 정의
```

### 전제조건 검증

```bash
# .claude/hooks/pre-stage.sh
check_prerequisites() {
    local prev_status=$(jq -r ".stages.\"$prev_stage\".status" "$PROGRESS_FILE")
    if [ "$prev_status" != "completed" ]; then
        exit 1
    fi
}
```

## 장점

- 예측 가능한 실행 흐름
- 명확한 의존성 관리
- 롤백 용이

## 단점

- 병렬 실행 불가
- 유연성 제한

## 관련 패턴

- State Machine Workflow
- Stateless Orchestration
