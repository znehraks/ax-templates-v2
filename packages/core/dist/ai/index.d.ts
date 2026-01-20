/**
 * @ax-templates/core - AI Module
 * AI CLI abstraction and management
 */
export type { AIProvider, AICallResult, AICallOptions, AICallLog, TmuxSessionStatus, } from './types.js';
export { getAICallLogs, logAICall, updateAICallLog, isTmuxAvailable, getTmuxSessionStatus, ensureTmuxSession, isCLIAvailable, checkAIAvailability, executeAICall, getWrapperScriptPath, executeViaWrapper, } from './wrapper.js';
//# sourceMappingURL=index.d.ts.map