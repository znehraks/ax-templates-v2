# Stage 06: Implementation

## 목표
설계된 아키텍처와 태스크 계획에 따라 소스 코드 구현

## AI 모델
- **Primary**: ClaudeCode

## 실행 모드
Plan + Sandbox - 계획 수립 후 격리된 환경에서 실행

## 입력 파일
- `../05-task-management/outputs/task_breakdown.md`
- `../05-task-management/outputs/implementation_order.md`
- `../04-ui-ux/outputs/component_specs.md`
- `../03-planning/outputs/architecture.md`

## 산출물
- [ ] Source code in `{{PROJECT_ROOT}}/`
- [ ] `outputs/implementation_log.md` - 구현 로그
- [ ] `outputs/technical_decisions.md` - 기술적 결정 기록

## 프로세스

### 1. 태스크 분석
구현 순서와 태스크 분해를 검토합니다.

### 2. 환경 설정
프로젝트 초기 설정 및 의존성 설치:
```bash
cd {{PROJECT_ROOT}}
npm init -y  # 또는 해당 프레임워크 초기화
```

### 3. 순차적 구현
태스크 순서에 따라 구현을 진행합니다.

### 4. 체크포인트 생성
주요 마일스톤마다 체크포인트를 생성합니다:
```
/checkpoint -m "기능 X 구현 완료"
```

## 체크포인트 필수

이 스테이지는 **체크포인트가 필수**입니다.
- 최소 50% 구현 시점에 1개
- 완료 시점에 1개

## Git 커밋 규칙

```
feat(impl): <구현 내용>
```

## 완료 조건
1. 모든 태스크 구현 완료
2. 구현 로그 작성
3. 기술적 결정 문서화
4. 체크포인트 생성
5. HANDOFF.md 작성

## 다음 스테이지
07-refactoring (Refactoring)
