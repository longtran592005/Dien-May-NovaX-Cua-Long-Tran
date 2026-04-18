#!/usr/bin/env node

const { execSync } = require('node:child_process');

const PORTS = [3000, 4010, 4020, 4030, 4040, 4050, 8080];

function run(command) {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
}

function killPid(pid) {
    if (!pid || Number.isNaN(Number(pid))) return false;

    try {
        if (process.platform === 'win32') {
            execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore' });
        } else {
            execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        }
        return true;
    } catch {
        return false;
    }
}

function collectPidsWindows(port) {
    try {
        const output = run(`netstat -ano -p tcp | findstr :${port}`);
        const pids = new Set();

        for (const line of output.split(/\r?\n/)) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            const cols = trimmed.split(/\s+/);
            const local = cols[1] || '';
            const state = (cols[3] || '').toUpperCase();
            const pid = cols[4];
            if (local.endsWith(`:${port}`) && state === 'LISTENING' && pid) {
                pids.add(pid);
            }
        }

        return [...pids];
    } catch {
        return [];
    }
}

function collectPidsUnix(port) {
    try {
        const output = run(`lsof -ti tcp:${port} -sTCP:LISTEN`);
        return output
            .split(/\r?\n/)
            .map((v) => v.trim())
            .filter(Boolean);
    } catch {
        return [];
    }
}

let killedCount = 0;

for (const port of PORTS) {
    const pids = process.platform === 'win32' ? collectPidsWindows(port) : collectPidsUnix(port);
    if (pids.length === 0) continue;

    for (const pid of pids) {
        if (killPid(pid)) {
            killedCount += 1;
            process.stdout.write(`[free-ports] freed ${port} (pid ${pid})\n`);
        }
    }
}

if (killedCount === 0) {
    process.stdout.write('[free-ports] no occupied dev ports found\n');
}
