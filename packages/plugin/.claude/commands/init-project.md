# /init-project

새 ax-templates 프로젝트를 초기화합니다.

## 사용법

```
/init-project [project-name]
```

## 동작

1. 프로젝트 이름 확인 (기본값: 현재 디렉토리 이름)
2. `.ax-config.yaml` 설정 파일 생성
3. `stages/` 디렉토리 및 10개 스테이지 구조 생성
4. `state/` 디렉토리 및 `progress.json` 초기화
5. `scripts/` AI 래퍼 스크립트 생성
6. `config/` 파이프라인 설정 파일 생성

## 생성되는 파일 구조

```
./
├── .ax-config.yaml          # 프로젝트 설정
├── stages/
│   ├── 01-brainstorm/
│   │   ├── CLAUDE.md
│   │   ├── config.yaml
│   │   ├── inputs/
│   │   ├── outputs/
│   │   └── prompts/
│   ├── 02-research/
│   │   └── ...
│   └── ... (10개 스테이지)
├── state/
│   ├── progress.json
│   ├── context/
│   └── checkpoints/
├── config/
│   ├── pipeline.yaml
│   └── models.yaml
└── scripts/
    ├── gemini-wrapper.sh
    └── codex-wrapper.sh
```

## 초기화 후 다음 단계

1. `.ax-config.yaml` 설정 검토 및 수정
2. `stages/01-brainstorm/inputs/project_brief.md` 작성
3. `/brainstorm` 또는 `/run-stage 01-brainstorm` 실행
