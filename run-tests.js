const { spawn } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);
const testPattern = args[0] || '';

const spawnArgs = ['playwright', 'test', '--project=chromium', '--reporter=line'];
if (testPattern) {
  spawnArgs.push(testPattern);
}

const proc = spawn('npx', spawnArgs, {
  cwd: 'd:\\myfolder\\myproject\\testingndri\\frontend',
  shell: true,
  env: { ...process.env, FORCE_COLOR: '0' }
});

let passed = 0;
let failed = 0;
let failedNames = [];
let allTextLines = [];

proc.stdout.on('data', (data) => {
  const text = data.toString('utf8');
  const lines = text.split('\n');
  for (const line of lines) {
    const clean = line.replace(/[^\x20-\x7E\r\n\t]/g, '').trim();
    if (!clean) continue;
    // Don't store base64 image data lines
    if (clean.length > 500) continue;
    allTextLines.push(clean);
    if (allTextLines.length > 200) allTextLines.shift();
    
    if (/(\d+) passed/.test(clean)) {
      const m = clean.match(/(\d+) passed/);
      if (m) passed = parseInt(m[1]);
    }
    if (/(\d+) failed/.test(clean)) {
      const m = clean.match(/(\d+) failed/);
      if (m) failed = parseInt(m[1]);
    }
  }
});

proc.stderr.on('data', (data) => {
  const text = data.toString('utf8');
  const lines = text.split('\n');
  for (const line of lines) {
    const clean = line.replace(/[^\x20-\x7E\r\n\t]/g, '').trim();
    if (!clean || clean.length > 500) continue;
    allTextLines.push('[ERR] ' + clean);
    if (allTextLines.length > 200) allTextLines.shift();
  }
});

proc.on('close', (code) => {
  const result = `Exit code: ${code}\nPassed: ${passed}\nFailed: ${failed}\n\nLast 100 lines:\n${allTextLines.slice(-100).join('\n')}`;
  fs.writeFileSync('d:\\myfolder\\myproject\\testingndri\\e2e-round4.txt', result, 'utf8');
  process.stdout.write(result + '\n');
});
