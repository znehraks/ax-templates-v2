/**
 * ax-templates CLI - Init Wizard
 * Interactive project initialization wizard
 */
import type { AxConfig } from '@ax-templates/core';
export interface InitWizardAnswers {
    projectName: string;
    projectRoot: string;
    stagesOutput: string;
    stateDir: string;
    enableGemini: boolean;
    enableCodex: boolean;
    mcpSearch: string[];
    mcpBrowser: string[];
    geminiSession: string;
    codexSession: string;
    contextWarning: number;
    contextAction: number;
    contextCritical: number;
    commitLanguage: 'Korean' | 'English';
    autoCommit: boolean;
}
export declare function runInitWizard(projectName?: string): Promise<InitWizardAnswers>;
export declare function answersToConfig(answers: InitWizardAnswers): Partial<AxConfig>;
export declare function getQuickInitConfig(projectName: string): Partial<AxConfig>;
//# sourceMappingURL=init-wizard.d.ts.map