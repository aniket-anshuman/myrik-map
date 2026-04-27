#!/usr/bin/env node

/**
 * Startup script - Starts the server and opens the UI in browser
 */

const { spawn } = require('child_process');
const open = require('open');
const path = require('path');

const PORT = process.env.PORT || 3000;
const UI_URL = `http://localhost:${PORT}/index-tabbed.html`;
const SERVER_FILE = path.join(__dirname, 'server.js');

console.log('🚀 Starting Issue Reporting System...\n');

// Start the server
const server = spawn('node', [SERVER_FILE], {
  stdio: 'inherit',
  shell: true
});

// Wait 2 seconds for server to start, then open the browser
setTimeout(async () => {
  try {
    console.log(`\n📱 Opening browser at ${UI_URL}\n`);
    await open(UI_URL);
  } catch (error) {
    console.log(`\n⚠️  Please open your browser and navigate to:\n${UI_URL}\n`);
  }
}, 2000);

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down...');
  server.kill();
  process.exit(0);
});
