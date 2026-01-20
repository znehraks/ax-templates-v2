#!/usr/bin/env node

import('../dist/index.js').catch((err) => {
  console.error('Failed to start ax-templates CLI:', err);
  process.exit(1);
});
