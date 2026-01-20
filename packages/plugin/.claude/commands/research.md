# /research

Research 스테이지 (02-research)를 실행합니다.

## 사용법

```
/research [--dry-run]
```

## 스테이지 정보

| 항목 | 값 |
|------|-----|
| ID | 02-research |
| 이름 | Research |
| AI 모델 | Claude |
| 실행 모드 | Plan Mode |
| 체크포인트 | 선택 |

## 입력 (Inputs)

이전 스테이지의 산출물:
- `01-brainstorm/outputs/ideas.md`
- `01-brainstorm/outputs/requirements.md`

## 출력 (Outputs)

- `outputs/market_research.md` - 시장 조사
- `outputs/tech_research.md` - 기술 조사
- `outputs/competitor_analysis.md` - 경쟁사 분석

## 완료 조건

1. ✅ 모든 산출물 생성
2. ✅ HANDOFF.md 생성

## 다음 스테이지

완료 후 `/next`를 실행하여 03-planning으로 전환합니다.
