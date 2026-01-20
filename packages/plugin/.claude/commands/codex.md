# /codex

Codex CLI를 호출합니다.

## 사용법

```
/codex <prompt> [-o|--output <file>] [--no-wait] [--timeout <seconds>]
```

## 인자

- `prompt`: 프롬프트 텍스트 또는 프롬프트 파일 경로
- `-o, --output <file>`: 출력 파일 경로
- `--no-wait`: 응답을 기다리지 않음
- `--timeout <seconds>`: 응답 타임아웃 (기본: 300초)
- `--raw`: 파일 처리 없이 프롬프트 직접 전달

## 동작

1. Codex CLI 활성화 확인
2. Codex CLI 설치 확인
3. 프롬프트 파일 로드 (경로인 경우)
4. tmux 세션 확인/생성
5. Codex CLI 호출
6. 응답 수신 및 저장
7. AI 호출 로그 기록

## 예시

### 인라인 프롬프트
```
/codex "이 코드를 리팩토링해주세요: function add(a,b){return a+b}"
```

### 파일 프롬프트
```
/codex stages/07-refactoring/prompts/optimize.md -o stages/07-refactoring/outputs/optimized.md
```

### 백그라운드 실행
```
/codex prompts/deep-analysis.md --no-wait
```

## tmux 세션

Codex CLI는 tmux 세션에서 실행됩니다:
- 세션명: `ax-codex` (설정 가능)
- 세션 연결: `tmux attach -t ax-codex`

## 출력

응답은 다음 중 하나로 제공됩니다:
1. `-o` 옵션 지정: 파일로 저장
2. 옵션 없음: 콘솔에 출력

## AI 호출 로깅

모든 Codex 호출은 자동으로 로깅되어 HANDOFF.md에 포함됩니다:

| AI | 호출 시간 | 프롬프트 | 결과 | 상태 |
|----|----------|---------|------|------|
| Codex | 14:30 | prompts/optimize.md | outputs/optimized.md | 성공 |

## 설정

`.ax-config.yaml`:
```yaml
ai:
  codex: true           # Codex 활성화

tmux:
  codex_session: ax-codex    # 세션명
  output_timeout: 300        # 타임아웃 (초)
```

## Codex 활용 스테이지

Codex CLI는 주로 다음 스테이지에서 활용됩니다:

| 스테이지 | 용도 |
|---------|------|
| 07-refactoring | 코드 최적화, 리팩토링 |
| 09-testing | 테스트 코드 생성, 분석 |
