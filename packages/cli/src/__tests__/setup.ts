/**
 * CLI Test Setup
 * Checks CLI availability and provides conditional skip
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';

// Check if CLI binary exists
const cliPath = join(__dirname, '..', '..', '..', 'bin', 'ax.js');
export const CLI_AVAILABLE = existsSync(cliPath);

// Skip message for tests when CLI is not built
export const CLI_SKIP_MESSAGE = 'CLI binary not built. Run `pnpm build` in packages/cli first.';

/**
 * Helper to conditionally skip tests when CLI is not available
 */
export function skipIfNoCli() {
  if (!CLI_AVAILABLE) {
    console.warn(`\n⚠️  ${CLI_SKIP_MESSAGE}\n`);
  }
  return !CLI_AVAILABLE;
}
