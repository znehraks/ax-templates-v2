/**
 * @ax-templates/core - Default Configuration
 * Default values for ax-templates configuration
 */
// ============================================
// Default Configuration
// ============================================
export const DEFAULT_CONFIG = {
    ax_templates: {
        version: '2.0.0',
    },
    paths: {
        project_root: './',
        stages_output: './stages',
        state: './state',
        checkpoints: './state/checkpoints',
    },
    ai: {
        gemini: true,
        codex: true,
    },
    tmux: {
        gemini_session: 'ax-gemini',
        codex_session: 'ax-codex',
        output_timeout: 300,
    },
    context: {
        warning: 60,
        action: 50,
        critical: 40,
        task_save_frequency: 5,
    },
    mcp: {
        search: ['context7', 'exa'],
        browser: ['playwright'],
    },
    git: {
        commit_language: 'Korean',
        auto_commit: true,
    },
    timeouts: {
        '01-brainstorm': 3600,
        '02-research': 7200,
        '03-planning': 3600,
        '04-ui-ux': 3600,
        '05-task-management': 1800,
        '06-implementation': 14400,
        '07-refactoring': 7200,
        '08-qa': 3600,
        '09-testing': 7200,
        '10-deployment': 3600,
    },
};
// ============================================
// Default Stage Definitions
// ============================================
export const DEFAULT_STAGES = [
    {
        id: '01-brainstorm',
        name: 'Brainstorming',
        description: '발산적 아이디어 생성 및 요구사항 탐색',
        models: ['gemini', 'claudecode'],
        mode: 'yolo',
        container: true,
        inputs: ['project_brief.md', 'user_requirements.md'],
        outputs: ['ideas.md', 'requirements_analysis.md', 'HANDOFF.md'],
        timeout: 3600,
    },
    {
        id: '02-research',
        name: 'Research',
        description: '기술 리서치 및 시장 분석',
        models: ['claude'],
        mode: 'plan',
        mcp_servers: ['firecrawl', 'exa', 'context7'],
        inputs: ['requirements_analysis.md'],
        outputs: ['tech_research.md', 'market_analysis.md', 'feasibility_report.md', 'HANDOFF.md'],
        timeout: 7200,
    },
    {
        id: '03-planning',
        name: 'Planning',
        description: '시스템 아키텍처 및 기술 스택 결정',
        models: ['gemini'],
        mode: 'plan',
        inputs: ['tech_research.md', 'feasibility_report.md'],
        outputs: ['architecture.md', 'tech_stack.md', 'project_plan.md', 'HANDOFF.md'],
        timeout: 3600,
    },
    {
        id: '04-ui-ux',
        name: 'UI/UX Planning',
        description: '사용자 인터페이스 및 경험 설계',
        models: ['gemini'],
        mode: 'plan',
        inputs: ['requirements_analysis.md', 'architecture.md'],
        outputs: ['wireframes.md', 'user_flows.md', 'design_system.md', 'HANDOFF.md'],
        timeout: 3600,
    },
    {
        id: '05-task-management',
        name: 'Task Management',
        description: '태스크 분해 및 스프린트 계획',
        models: ['claudecode'],
        mode: 'plan',
        inputs: ['project_plan.md', 'architecture.md'],
        outputs: ['tasks.md', 'sprint_plan.md', 'milestones.md', 'HANDOFF.md'],
        timeout: 1800,
    },
    {
        id: '06-implementation',
        name: 'Implementation',
        description: '핵심 기능 구현',
        models: ['claudecode'],
        mode: 'plan_sandbox',
        sandbox: true,
        inputs: ['tasks.md', 'architecture.md', 'design_system.md'],
        outputs: ['source_code/', 'implementation_log.md', 'HANDOFF.md'],
        timeout: 14400,
        checkpoint_required: true,
    },
    {
        id: '07-refactoring',
        name: 'Refactoring',
        description: '코드 품질 개선 및 최적화',
        models: ['codex'],
        mode: 'deep_dive',
        inputs: ['source_code/', 'implementation_log.md'],
        outputs: ['refactored_code/', 'refactoring_report.md', 'HANDOFF.md'],
        timeout: 7200,
        checkpoint_required: true,
    },
    {
        id: '08-qa',
        name: 'QA',
        description: '품질 보증 및 코드 리뷰',
        models: ['claudecode'],
        mode: 'plan_sandbox',
        sandbox: true,
        inputs: ['refactored_code/', 'refactoring_report.md'],
        outputs: ['qa_report.md', 'bug_fixes.md', 'HANDOFF.md'],
        timeout: 3600,
    },
    {
        id: '09-testing',
        name: 'Testing & E2E',
        description: '테스트 코드 작성 및 E2E 테스트',
        models: ['codex'],
        mode: 'sandbox_playwright',
        sandbox: true,
        mcp_servers: ['playwright'],
        inputs: ['source_code/', 'qa_report.md'],
        outputs: ['tests/', 'test_report.md', 'coverage_report.md', 'HANDOFF.md'],
        timeout: 7200,
    },
    {
        id: '10-deployment',
        name: 'CI/CD & Deployment',
        description: '배포 파이프라인 설정 및 배포',
        models: ['claudecode'],
        mode: 'headless',
        inputs: ['source_code/', 'tests/', 'test_report.md'],
        outputs: ['.github/workflows/', 'deployment_config/', 'deployment_log.md'],
        timeout: 3600,
    },
];
// ============================================
// Default Pipeline Configuration
// ============================================
export const DEFAULT_PIPELINE = {
    name: 'Multi-AI Development Workflow',
    version: '1.0.0',
    description: '10-stage software development workflow with multi-AI orchestration',
    stages: DEFAULT_STAGES,
};
// ============================================
// Environment Variable Mapping
// ============================================
export const ENV_VAR_MAP = {
    // Paths
    'paths.project_root': 'AX_PROJECT_ROOT',
    'paths.stages_output': 'AX_STAGES_OUTPUT',
    'paths.state': 'AX_STATE_DIR',
    'paths.checkpoints': 'AX_CHECKPOINTS_DIR',
    // AI
    'ai.gemini': 'AX_AI_GEMINI',
    'ai.codex': 'AX_AI_CODEX',
    // tmux
    'tmux.gemini_session': 'AX_TMUX_GEMINI',
    'tmux.codex_session': 'AX_TMUX_CODEX',
    'tmux.output_timeout': 'AX_TMUX_TIMEOUT',
    // Context
    'context.warning': 'AX_CONTEXT_WARNING',
    'context.action': 'AX_CONTEXT_ACTION',
    'context.critical': 'AX_CONTEXT_CRITICAL',
    'context.task_save_frequency': 'AX_TASK_SAVE_FREQ',
    // Git
    'git.commit_language': 'AX_GIT_LANG',
    'git.auto_commit': 'AX_GIT_AUTO_COMMIT',
    // Stage timeouts (AX_TIMEOUT_01, AX_TIMEOUT_06, etc.)
    'timeouts.01-brainstorm': 'AX_TIMEOUT_01',
    'timeouts.02-research': 'AX_TIMEOUT_02',
    'timeouts.03-planning': 'AX_TIMEOUT_03',
    'timeouts.04-ui-ux': 'AX_TIMEOUT_04',
    'timeouts.05-task-management': 'AX_TIMEOUT_05',
    'timeouts.06-implementation': 'AX_TIMEOUT_06',
    'timeouts.07-refactoring': 'AX_TIMEOUT_07',
    'timeouts.08-qa': 'AX_TIMEOUT_08',
    'timeouts.09-testing': 'AX_TIMEOUT_09',
    'timeouts.10-deployment': 'AX_TIMEOUT_10',
};
//# sourceMappingURL=defaults.js.map