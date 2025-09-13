// Simple startup script for the backend
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting IoT Backend API...');
console.log('📁 Working directory:', process.cwd());

// Check if package.json exists
const packagePath = path.join(__dirname, 'package.json');
const fs = require('fs');

if (!fs.existsSync(packagePath)) {
  console.error('❌ package.json not found!');
  console.log('Please run: npm init -y');
  process.exit(1);
}

// Start the server
const server = spawn('node', ['server.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
});

server.on('close', (code) => {
  console.log(`🛑 Server exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});
