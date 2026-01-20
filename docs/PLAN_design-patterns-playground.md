# AI Design Patterns Playground 구현 계획

> 작성일: 2026-01-20
> 상태: 계획 완료, 구현 대기

## 개요

Notion "Context Design Pattern" 데이터베이스(50+ 패턴)를 기반으로 AI/Agentic 디자인 패턴을 직관적으로 학습할 수 있는 인터랙티브 웹 플레이그라운드 구축

## 프로젝트 위치

```
/Users/designc/Documents/vibe-space/ax-templates-v2/playground/
```

ax-templates-v2 하위 `playground/` 디렉토리에 Next.js 프로젝트 생성

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 15 + App Router |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Code Playground | Sandpack (실행) + Monaco Editor (읽기 전용) |
| 데이터 | Notion API (빌드 시 정적 fetch) |

## Notion 데이터베이스 정보

- **Database ID**: `2e3e5db7-4b4f-807f-8bbe-000b448ca004`
- **Database Name**: Context Design Pattern
- **위치**: 리서치 페이지 하위

### 스키마

| 필드 | 타입 | 설명 |
|------|------|------|
| `이름` | title | 패턴 이름 |
| `디자인 패턴 종류` | select | 8개 카테고리 |
| `예제 코드` | text | 코드 예시 |
| `요약` | text | 문제/해결책/활용법 |
| `url` | url | 참조 URL |

### 8개 카테고리

| 카테고리 | 색상 | 아이콘 제안 |
|----------|------|-------------|
| Context & Memory | Blue #3B82F6 | Brain |
| Orchestration & Control | Purple #8B5CF6 | GitBranch |
| Feedback Loops | Green #10B981 | RefreshCw |
| Security & Safety | Red #EF4444 | Shield |
| Tool Use & Environment | Orange #F97316 | Wrench |
| UX & Collaboration | Pink #EC4899 | Users |
| Reliability & Evaluation | Cyan #06B6D4 | CheckCircle |
| Learning & Adaptation | Yellow #EAB308 | Lightbulb |

## 프로젝트 구조

```
ax-templates-v2/playground/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 루트 레이아웃
│   │   ├── page.tsx                # 홈페이지
│   │   ├── patterns/
│   │   │   ├── page.tsx            # 전체 패턴 목록
│   │   │   └── [slug]/page.tsx     # 패턴 상세
│   │   ├── categories/
│   │   │   ├── page.tsx            # 카테고리 개요
│   │   │   └── [category]/page.tsx # 카테고리별 패턴
│   │   ├── compare/page.tsx        # 패턴 비교
│   │   └── playground/page.tsx     # 독립 플레이그라운드
│   │
│   ├── components/
│   │   ├── layout/                 # Header, Sidebar, Footer
│   │   ├── patterns/               # PatternCard, PatternDetail
│   │   ├── categories/             # CategoryBadge, CategoryFilter
│   │   ├── playground/             # CodePlayground, Sandpack
│   │   ├── compare/                # CompareView
│   │   ├── search/                 # SearchBar, SearchModal
│   │   └── ui/                     # Button, Card, Tabs 등
│   │
│   ├── lib/
│   │   ├── notion/                 # Notion API 연동
│   │   │   ├── client.ts           # Notion 클라이언트 설정
│   │   │   ├── queries.ts          # DB 쿼리 함수
│   │   │   └── transformers.ts     # 데이터 변환
│   │   └── utils/
│   │       ├── cn.ts               # className 유틸
│   │       └── slug.ts             # 슬러그 생성
│   │
│   ├── types/
│   │   └── pattern.ts              # 타입 정의
│   │
│   └── hooks/                      # useSearch, useCompare
│
├── scripts/
│   └── fetch-notion-data.ts        # 빌드 시 데이터 캐싱
│
├── data/
│   └── patterns.json               # 캐싱된 패턴 데이터 (gitignored)
│
├── .env.local                      # 환경 변수
└── package.json
```

## 핵심 페이지

| 경로 | 기능 | 데이터 |
|------|------|--------|
| `/` | 메인 - 주요 패턴 소개, 카테고리 개요 | 전체 패턴 요약 |
| `/patterns` | 전체 패턴 목록 (검색, 필터) | 전체 패턴 |
| `/patterns/[slug]` | 패턴 상세 + 코드 플레이그라운드 | 단일 패턴 |
| `/categories` | 8개 카테고리 시각적 개요 | 카테고리 통계 |
| `/categories/[cat]` | 카테고리별 패턴 필터링 | 필터된 패턴 |
| `/compare` | 2개 패턴 나란히 비교 | 선택된 패턴들 |

## 데이터 연동 전략

### 빌드 타임 정적 생성

1. **prebuild 스크립트**로 Notion API 호출
2. `data/patterns.json`에 캐싱
3. `generateStaticParams`로 모든 패턴 페이지 SSG
4. ISR로 선택적 재검증 가능

```typescript
// scripts/fetch-notion-data.ts
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DATABASE_ID = '2e3e5db7-4b4f-807f-8bbe-000b448ca004';

async function fetchPatterns() {
  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    sorts: [{ property: '이름', direction: 'ascending' }],
  });
  // Transform and save to data/patterns.json
}
```

```typescript
// src/app/patterns/[slug]/page.tsx
export async function generateStaticParams() {
  const patterns = await getAllPatterns();
  return patterns.map((p) => ({ slug: p.slug }));
}
```

## 핵심 컴포넌트

### CodePlayground

| 코드 타입 | 렌더링 방식 |
|----------|-------------|
| JS/TS/React | Sandpack (라이브 실행) |
| Python/Bash 등 | Monaco Editor (읽기 전용) |

```tsx
// src/components/playground/CodePlayground.tsx
export function CodePlayground({ examples, interactive = true }) {
  const isExecutable = examples.some(e =>
    ['javascript', 'typescript', 'jsx', 'tsx'].includes(e.language)
  );

  if (interactive && isExecutable) {
    return <SandpackWrapper files={convertToFiles(examples)} />;
  }
  return <MonacoEditor code={examples[0].code} language={examples[0].language} />;
}
```

### PatternDetail

- 패턴명 + 카테고리 배지
- 요약 (문제/해결책/활용법 파싱)
- 코드 플레이그라운드
- 관련 패턴 추천 (같은 카테고리)

### SearchModal (Cmd+K)

- Fuse.js 기반 퍼지 검색
- cmdk 라이브러리로 커맨드 팔레트

## 필요 라이브러리

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@notionhq/client": "^2.2.0",

    "// Styling": "",
    "tailwindcss": "^3.4.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.300.0",
    "next-themes": "^0.3.0",

    "// Code Playground": "",
    "@codesandbox/sandpack-react": "^2.13.0",
    "@monaco-editor/react": "^4.6.0",

    "// Search & Navigation": "",
    "cmdk": "^0.2.0",
    "fuse.js": "^7.0.0",

    "// Animation": "",
    "framer-motion": "^11.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "tsx": "^4.0.0"
  }
}
```

## 구현 단계

### 1단계: 기반 구축

```bash
# 프로젝트 생성
cd /Users/designc/Documents/vibe-space/ax-templates-v2
npx create-next-app@latest playground --typescript --tailwind --app --src-dir

# 의존성 설치
cd playground
npm install @notionhq/client @codesandbox/sandpack-react @monaco-editor/react
npm install next-themes lucide-react cmdk fuse.js framer-motion
npm install class-variance-authority clsx tailwind-merge
npm install -D tsx
```

- [ ] Next.js 15 프로젝트 생성
- [ ] Notion API 연동 (`lib/notion/`)
- [ ] 타입 정의 (`types/pattern.ts`)
- [ ] 데이터 변환기 작성 (`lib/notion/transformers.ts`)
- [ ] 빌드 스크립트 (`scripts/fetch-notion-data.ts`)

### 2단계: 핵심 UI

- [ ] 레이아웃 컴포넌트 (Header, Sidebar, Footer)
- [ ] 패턴 목록 페이지 (`/patterns`)
- [ ] 패턴 상세 페이지 (`/patterns/[slug]`)
- [ ] 카테고리 필터링
- [ ] 반응형 디자인

### 3단계: 인터랙티브 기능

- [ ] Sandpack 통합 (라이브 코드 실행)
- [ ] Monaco Editor (읽기 전용)
- [ ] 다크/라이트 테마

### 4단계: UX 향상

- [ ] 검색 기능 (Cmd+K)
- [ ] 패턴 비교 기능
- [ ] 키보드 네비게이션
- [ ] 애니메이션

### 5단계: 배포

- [ ] SEO 최적화
- [ ] Vercel 배포
- [ ] ISR 설정 (선택)

## 환경 변수

```env
# .env.local
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=2e3e5db7-4b4f-807f-8bbe-000b448ca004
```

**Notion API 키 발급:**
1. https://www.notion.so/my-integrations 접속
2. 새 통합 생성
3. "Context Design Pattern" 데이터베이스에 통합 연결

## 검증 방법

1. **개발 서버**: `npm run dev`로 로컬 확인
2. **빌드 테스트**: `npm run build`로 SSG 정상 동작 확인
3. **Notion 연동**: 패턴 데이터 정상 fetch 확인
4. **코드 플레이그라운드**: Sandpack 실행 테스트
5. **반응형**: 모바일/태블릿/데스크톱 레이아웃 확인

## 시작 명령어

```bash
# 다른 PC에서 시작할 때
cd /path/to/ax-templates-v2

# 프로젝트 생성 (아직 없다면)
npx create-next-app@latest playground --typescript --tailwind --app --src-dir

# 의존성 설치
cd playground
npm install @notionhq/client @codesandbox/sandpack-react @monaco-editor/react
npm install next-themes lucide-react cmdk fuse.js framer-motion
npm install class-variance-authority clsx tailwind-merge
npm install -D tsx

# 환경 변수 설정
cp .env.example .env.local
# .env.local 편집하여 NOTION_API_KEY 입력

# 개발 서버 시작
npm run dev
```

## 참고 자료

- [Next.js 15 문서](https://nextjs.org/docs)
- [Notion API 문서](https://developers.notion.com/)
- [Sandpack 문서](https://sandpack.codesandbox.io/)
- [Monaco Editor React](https://github.com/suren-atoyan/monaco-react)
- [cmdk](https://cmdk.paco.me/)

---

## 다음 단계

이 문서를 참고하여 다른 PC에서 작업을 시작할 수 있습니다.
Claude Code에서 다음 프롬프트로 구현을 시작하세요:

```
이 프로젝트의 PLAN_design-patterns-playground.md 문서를 읽고
1단계(기반 구축)부터 구현을 시작해줘.
```
