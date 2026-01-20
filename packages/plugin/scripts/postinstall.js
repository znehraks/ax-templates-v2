#!/usr/bin/env node
/**
 * ax-templates Plugin Post-install Script
 * Runs after npm install to set up the plugin
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  ax-templates Plugin Installed');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

// Make scripts executable
const scriptsDir = path.join(__dirname);
const scripts = ['gemini-wrapper.sh', 'codex-wrapper.sh', 'session-start.sh', 'stop.sh'];

for (const script of scripts) {
  const scriptPath = path.join(scriptsDir, script);
  if (fs.existsSync(scriptPath)) {
    try {
      fs.chmodSync(scriptPath, '755');
      console.log(`✓ Made executable: ${script}`);
    } catch (err) {
      console.log(`⚠ Could not make executable: ${script}`);
    }
  }
}

// Make hooks executable
const hooksDir = path.join(__dirname, '..', '.claude', 'hooks');
if (fs.existsSync(hooksDir)) {
  const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.sh'));
  for (const hook of hookFiles) {
    const hookPath = path.join(hooksDir, hook);
    try {
      fs.chmodSync(hookPath, '755');
      console.log(`✓ Made executable: ${hook}`);
    } catch (err) {
      console.log(`⚠ Could not make executable: ${hook}`);
    }
  }
}

console.log('');
console.log('Next steps:');
console.log('  1. Run "ax init" to initialize a new project');
console.log('  2. Or link this plugin in Claude Code');
console.log('');
console.log('Commands available:');
console.log('  /init-project  - Initialize new project');
console.log('  /status        - Show pipeline status');
console.log('  /stages        - List all stages');
console.log('  /next          - Move to next stage');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
