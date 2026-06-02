const fs = require('node:fs');
const path = require('node:path');

const source = path.join(__dirname, '..', 'prisma', 'dev.db');
const backupDir = path.join(__dirname, '..', 'prisma', 'backups');

if (!fs.existsSync(source)) {
    console.log('[db:backup:sqlite] No SQLite database found at prisma/dev.db. Skipping backup.');
    process.exit(0);
}

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const target = path.join(backupDir, `dev-${stamp}.db`);
fs.copyFileSync(source, target);

console.log(`[db:backup:sqlite] Backup created: ${target}`);
