/**
 * @ax-templates/core - AI Module
 * AI CLI abstraction and management
 */

// Types
export type {
  AIProvider,
  AICallResult,
  AICallOptions,
  AICallLog,
  TmuxSessionStatus,
} from './types.js';

// Wrapper
export {
  getAICallLogs,
  logAICall,
  updateAICallLog,
  isTmuxAvailable,
  getTmuxSessionStatus,
  ensureTmuxSession,
  isCLIAvailable,
  checkAIAvailability,
  executeAICall,
  getWrapperScriptPath,
  executeViaWrapper,
} from './wrapper.js';
