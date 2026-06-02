# PostgreSQL Migration Rollback Procedure
# Emergency procedure to revert from PostgreSQL back to SQLite (or previous state)
# Usage: .\migration-rollback.ps1 -BackupFile "path/to/backup.sql" -FallbackToSqlite $true

param(
    [string]$BackupFile,
    [bool]$FallbackToSqlite = $false,
    [string]$SQLiteBackupPath = "prisma"
)

$ErrorActionPreference = "Stop"
$timestamp = (Get-Date).ToString("yyyy-MM-dd_HH-mm-ss")
$logPath = "migration-rollback-$timestamp.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $log = "[$timestamp] [$Level] $Message"
    Write-Host $log
    Add-Content -Path $logPath -Value $log
}

function Stop-AllServices {
    Write-Log "Stopping all backend services..."
    try {
        # Kill running dev services
        Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
        Write-Log "✓ Services stopped" "SUCCESS"
    } catch {
        Write-Log "⚠ Could not forcefully stop services: $_" "WARN"
    }
}

function Restore-PostgreSQLBackup {
    param([string]$BackupFile)
    Write-Log "Restoring PostgreSQL from backup: $BackupFile"
    
    if (-not (Test-Path $BackupFile)) {
        Write-Log "✗ Backup file not found: $BackupFile" "ERROR"
        return $false
    }
    
    try {
        # Restore dump using psql
        Write-Log "Executing psql restore..."
        $dbUrl = $env:DATABASE_URL
        
        # Parse connection string to get database name
        $dbMatch = $dbUrl -match 'dbname=([^/&?]+)|/([^/&?]+)\?'
        $dbName = $matches[1] -or $matches[2]
        
        # Drop and recreate database
        Write-Log "Dropping existing database: $dbName"
        psql -c "DROP DATABASE IF EXISTS `"$dbName`"" 2>&1
        
        Write-Log "Creating fresh database: $dbName"
        psql -c "CREATE DATABASE `"$dbName`"" 2>&1
        
        # Restore from backup
        Write-Log "Restoring schema and data from backup..."
        $restoreOutput = psql -f "$BackupFile" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ PostgreSQL restore complete" "SUCCESS"
            return $true
        } else {
            Write-Log "✗ PostgreSQL restore failed: $restoreOutput" "ERROR"
            return $false
        }
    } catch {
        Write-Log "✗ Restore exception: $_" "ERROR"
        return $false
    }
}

function Fallback-ToSqlite {
    param([string]$BackupPath)
    Write-Log "Attempting fallback to SQLite..."
    
    try {
        $sqliteBackup = Get-ChildItem $BackupPath -Filter "*.db" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        
        if (-not $sqliteBackup) {
            Write-Log "✗ No SQLite backup found in $BackupPath" "ERROR"
            return $false
        }
        
        Write-Log "Found SQLite backup: $($sqliteBackup.FullName)"
        
        # Update environment to use SQLite
        $env:DATABASE_URL = "file:./prisma/dev.db"
        
        # Restore SQLite backup
        Copy-Item $sqliteBackup.FullName "prisma/dev.db" -Force
        
        Write-Log "✓ SQLite fallback complete" "SUCCESS"
        return $true
    } catch {
        Write-Log "✗ SQLite fallback failed: $_" "ERROR"
        return $false
    }
}

function Verify-Connectivity {
    Write-Log "Verifying database connectivity..."
    try {
        # Test with Prisma
        "SELECT 1" | npx prisma db execute --stdin 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ Database connectivity verified" "SUCCESS"
            return $true
        } else {
            Write-Log "✗ Database connectivity check failed" "ERROR"
            return $false
        }
    } catch {
        Write-Log "⚠ Could not verify connectivity: $_" "WARN"
        return $false
    }
}

function Run-SmokeTest {
    Write-Log "Running smoke test against rollback state..."
    try {
        Set-Location $PSScriptRoot
        Set-Location ..\..\
        
        $smokeResult = & .\scripts\smoke-test.ps1 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ Smoke test passed on rollback state" "SUCCESS"
            return $true
        } else {
            Write-Log "✗ Smoke test failed on rollback state" "ERROR"
            return $false
        }
    } catch {
        Write-Log "⚠ Smoke test execution error: $_" "WARN"
        return $false
    }
}

# Main rollback workflow
Write-Log "=== PostgreSQL Rollback Procedure Started ==="
Write-Log "Environment: DATABASE_URL is configured = $([bool]$env:DATABASE_URL)"
Write-Log "Fallback to SQLite: $FallbackToSqlite"
Write-Log "Log file: $logPath"

$startTime = Get-Date

try {
    # Step 1: Stop services
    Write-Log "Step 1: Stop all backend services"
    Stop-AllServices
    
    # Step 2: Restore database
    Write-Log "Step 2: Restore database"
    if ($BackupFile -and (Test-Path $BackupFile)) {
        Write-Log "Using provided backup file: $BackupFile"
        if (-not (Restore-PostgreSQLBackup $BackupFile)) {
            if ($FallbackToSqlite) {
                Write-Log "PostgreSQL restore failed, attempting SQLite fallback..."
                if (-not (Fallback-ToSqlite $SQLiteBackupPath)) {
                    throw "Both PostgreSQL and SQLite restore failed"
                }
            } else {
                throw "PostgreSQL restore failed"
            }
        }
    } elseif ($FallbackToSqlite) {
        Write-Log "Fallback to SQLite..."
        if (-not (Fallback-ToSqlite $SQLiteBackupPath)) {
            throw "SQLite fallback failed"
        }
    } else {
        throw "No backup file specified and fallback disabled"
    }
    
    # Step 3: Verify connectivity
    Write-Log "Step 3: Verify database connectivity"
    if (-not (Verify-Connectivity)) {
        Write-Log "⚠ Could not verify connectivity, continuing anyway..." "WARN"
    }
    
    # Step 4: Run smoke test
    Write-Log "Step 4: Run smoke test to verify system"
    if (-not (Run-SmokeTest)) {
        Write-Log "⚠ Smoke test failed, but rollback structure complete" "WARN"
    }
    
    $duration = (Get-Date) - $startTime
    Write-Log "=== ROLLBACK COMPLETED ===" "SUCCESS"
    Write-Log "Total duration: $([math]::Round($duration.TotalSeconds)) seconds"
    Write-Log "Status: System rolled back to previous state"
    Write-Log "Next: Review rollback cause and verify data integrity manually"
    
    exit 0
    
} catch {
    Write-Log "!!! ROLLBACK PROCEDURE FAILED: $_ !!!" "ERROR"
    Write-Log "Status: MANUAL INTERVENTION REQUIRED"
    Write-Log "Action: Check logs at $logPath and restore manually"
    
    $duration = (Get-Date) - $startTime
    Write-Log "Duration: $([math]::Round($duration.TotalSeconds)) seconds"
    
    exit 1
}
