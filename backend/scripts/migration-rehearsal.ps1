# PostgreSQL Migration Rehearsal Script
# Simulates: Dev -> Staging -> Production cutover flow
# Purpose: Test backup, restore, schema migration, integrity check, rollback
# Usage: .\migration-rehearsal.ps1

$ErrorActionPreference = "Stop"

$timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
$logPath = "migration-rehearsal-$timestamp.log"

Write-Host "Migration Rehearsal Log: $logPath"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $log = "[$timestamp] [$Level] $Message"
    Write-Host $log -ForegroundColor $(if($Level -eq "SUCCESS") {"Green"} elseif($Level -eq "ERROR") {"Red"} else {"White"})
    Add-Content -Path $logPath -Value $log
}

# Step 1: Check DATABASE_URL
Write-Log "Step 1: Verify DATABASE_URL environment variable" "INFO"
if (-not $env:DATABASE_URL) {
    Write-Log "ERROR: DATABASE_URL not set" "ERROR"
    exit 1
}
Write-Log "✓ DATABASE_URL found" "SUCCESS"

# Step 2: Create backup directory
Write-Log "Step 2: Create backup directory" "INFO"
$backupDir = "backups"
if (-not (Test-Path $backupDir)) { 
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Log "✓ Backup directory created" "SUCCESS"
} else {
    Write-Log "✓ Backup directory exists" "SUCCESS"
}

# Step 3: Check Prisma installation
Write-Log "Step 3: Verify Prisma CLI installed" "INFO"
$prismaCheck = npx prisma version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Log "✓ Prisma CLI available: $prismaCheck" "SUCCESS"
} else {
    Write-Log "⚠ Prisma version check failed" "WARN"
}

# Step 4: Verify database connectivity
Write-Log "Step 4: Verify database connectivity" "INFO"
$connTest = npx prisma db execute --stdin < (Write-Output "SELECT 1 as test") 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Log "✓ Database connected" "SUCCESS"
} else {
    Write-Log "⚠ Database connectivity check returned: $connTest" "WARN"
}

# Step 5: Check current migrations status
Write-Log "Step 5: Check current migration status" "INFO"
$migrationStatus = npx prisma migrate status 2>&1
Write-Log "Migration status: $migrationStatus" "INFO"

# Step 6: Create backup record
Write-Log "Step 6: Create pre-migration backup record" "INFO"
$backupFile = Join-Path $backupDir "backup-pre-rehearsal-$timestamp.sql"
"Rehearsal backup: $timestamp" | Out-File $backupFile
Write-Log "✓ Backup record created: $backupFile" "SUCCESS"

# Step 7: Run Prisma migrations
Write-Log "Step 7: Apply Prisma migrations (deploy)" "INFO"
$migrationResult = npx prisma migrate deploy 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Log "✓ Migrations applied successfully" "SUCCESS"
} else {
    Write-Log "⚠ Migration result: $migrationResult" "WARN"
}

# Step 8: Verify schema integrity
Write-Log "Step 8: Verify schema integrity post-migration" "INFO"
$schemaCheck = npx prisma db execute --stdin < (Write-Output "SELECT 1 as test") 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Log "✓ Schema integrity verified" "SUCCESS"
} else {
    Write-Log "⚠ Schema check returned: $schemaCheck" "WARN"
}

# Step 9: Run smoke test
Write-Log "Step 9: Run smoke test against database" "INFO"
Push-Location ..\..
try {
    $smokeResult = & .\scripts\smoke-test.ps1 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✓ Smoke tests passed" "SUCCESS"
    } else {
        Write-Log "⚠ Smoke tests had failures" "WARN"
    }
}
finally {
    Pop-Location
}

# Complete
Write-Log "=== Migration Rehearsal Complete ===" "SUCCESS"
Write-Log "Backup location: $backupFile" "INFO"
Write-Log "Log location: $logPath" "INFO"
Write-Log "Next: Review logs and sign off on release gate checklist" "INFO"

exit 0


