# /gemini

Gemini CLI를 호출합니다.

## 사용법

```
/gemini <prompt> [-o|--output <file>] [--no-wait] [--timeout <seconds>]
```

## 인자

- `prompt`: 프롬프트 텍스트 또는 프롬프트 파일 경로
- `-o, --output <file>`: 출력 파일 경로
- `--no-wait`: 응답을 기다리지 않음
- `--timeout <seconds>`: 응답 타임아웃 (기본: 300초)
- `--raw`: 파일 처리 없이 프롬프트 직접 전달

## 동작

1. Gemini CLI 활성화 확인
2. Gemini CLI 설치 확인
3. 프롬프트 파일 로드 (경로인 경우)
4. tmux 세션 확인/생성
5. Gemini CLI 호출
6. 응답 수신 및 저장
7. AI 호출 로그 기록

## 예시

### 인라인 프롬프트
```
/gemini "TypeScript에서 제네릭을 사용하는 방법을 설명해주세요"
```

### 파일 프롬프트
```
/gemini stages/01-brainstorm/prompts/ideation.md -o stages/01-brainstorm/outputs/ideas.md
```

### 백그라운드 실행
```
/gemini prompts/research.md --no-wait
```

## tmux 세션

Gemini CLI는 tmux 세션에서 실행됩니다:
- 세션명: `ax-gemini` (설정 가능)
- 세션 연결: `tmux attach -t ax-gemini`

## 출력

응답은 다음 중 하나로 제공됩니다:
1. `-o` 옵션 지정: 파일로 저장
2. 옵션 없음: 콘솔에 출력

## AI 호출 로깅

모든 Gemini 호출은 자동으로 로깅되어 HANDOFF.md에 포함됩니다:

| AI | 호출 시간 | 프롬프트 | 결과 | 상태 |
|----|----------|---------|------|------|
| Gemini | 14:30 | prompts/ideation.md | outputs/ideas.md | 성공 |

## 설정

`.ax-config.yaml`:
```yaml
ai:
  gemini: true          # Gemini 활성화

tmux:
  gemini_session: ax-gemini  # 세션명
  output_timeout: 300        # 타임아웃 (초)
```
