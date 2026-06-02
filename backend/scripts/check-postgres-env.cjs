const required = ['DATABASE_URL'];

const missing = required.filter((name) => !process.env[name] || !process.env[name].trim());

if (missing.length > 0) {
    console.error(`[db:check:postgres-env] Missing required env vars: ${missing.join(', ')}`);
    console.error('[db:check:postgres-env] Set DATABASE_URL before running Prisma migrations.');
    process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!/^postgres(ql)?:\/\//i.test(url)) {
    console.error('[db:check:postgres-env] DATABASE_URL must use the postgresql:// scheme.');
    process.exit(1);
}

console.log('[db:check:postgres-env] Environment looks valid for PostgreSQL migration.');
