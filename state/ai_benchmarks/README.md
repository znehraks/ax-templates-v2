# AI Benchmarks

AI 모델 벤치마킹 결과 저장 디렉토리

## 저장 내용

- `benchmark_*.json` - 벤치마크 실행 결과
- `latest.json` - 최신 벤치마크 결과
- `reports/` - 벤치마크 리포트

## 파일 형식

```json
{
    "task_type": "code_generation",
    "timestamp": "2024-01-01T00:00:00Z",
    "models_tested": "claude,codex,gemini",
    "samples": 3,
    "results": {
        "claude": 0.92,
        "codex": 0.88,
        "gemini": 0.85
    },
    "best_model": "claude",
    "best_score": 0.92
}
```

## 관련 설정

- `config/ai_benchmarking.yaml` - 벤치마킹 설정
- `scripts/ai-benchmark.sh` - 벤치마크 실행 스크립트

## 사용 방법

```bash
# 벤치마크 실행
/benchmark --task code_generation --models claude,codex

# 히스토리 조회
/benchmark --history weekly
```
