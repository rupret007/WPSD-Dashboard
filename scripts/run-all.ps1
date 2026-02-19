# WPSD Dashboard - Install, build, lint, and optional smoke tests
# Usage: .\scripts\run-all.ps1 [-SkipInstall] [-SkipSmoke]
#   -SkipInstall  Skip npm install (use if deps already installed)
#   -SkipSmoke   Skip smoke tests (backend must be running for smoke tests)

param(
    [switch]$SkipInstall,
    [switch]$SkipSmoke
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
if (-not $ProjectRoot) { $ProjectRoot = (Get-Location).Path }
Set-Location $ProjectRoot

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "npm not found. Ensure Node.js is installed and in PATH." -ForegroundColor Red
    exit 1
}

Write-Host "WPSD Dashboard - run-all" -ForegroundColor Cyan
Write-Host "Project root: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

# 1. Install
if (-not $SkipInstall) {
    Write-Host "[1/4] Installing dependencies (root, backend, frontend)..." -ForegroundColor Yellow
    npm run install:all
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host ""
} else {
    Write-Host "[1/4] Skipping install (SkipInstall)." -ForegroundColor Gray
    Write-Host ""
}

# 2. Build
Write-Host "[2/4] Building backend and frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host ""

# 3. Lint (frontend)
Write-Host "[3/4] Linting frontend..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\frontend"
npm run lint
$lintExit = $LASTEXITCODE
Set-Location $ProjectRoot
if ($lintExit -ne 0) {
    Write-Host "Lint reported issues (exit $lintExit). Continuing." -ForegroundColor Yellow
}
Write-Host ""

# 4. Smoke tests (optional; backend must be running)
if (-not $SkipSmoke) {
    Write-Host "[4/4] Smoke tests (backend must be running on port 3456)..." -ForegroundColor Yellow
    $base = "http://localhost:3456"
    $passed = 0
    $failed = 0

    try {
        $r = Invoke-WebRequest -Uri "$base/api/config" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) {
            Write-Host "  GET /api/config -> $($r.StatusCode)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  GET /api/config -> $($r.StatusCode)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  GET /api/config -> FAIL (is backend running?)" -ForegroundColor Red
        $failed++
    }

    try {
        $r = Invoke-WebRequest -Uri "$base/api/tgif/info" -UseBasicParsing -TimeoutSec 5
        if ($r.StatusCode -eq 200) {
            Write-Host "  GET /api/tgif/info -> $($r.StatusCode)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  GET /api/tgif/info -> $($r.StatusCode)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  GET /api/tgif/info -> FAIL" -ForegroundColor Red
        $failed++
    }

    if ($failed -gt 0) {
        Write-Host ""
        Write-Host "Smoke tests: $passed passed, $failed failed. Start backend with: npm run backend" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Smoke tests passed ($passed endpoints)." -ForegroundColor Green
    }
} else {
    Write-Host "[4/4] Skipping smoke tests (SkipSmoke). Start backend and run without -SkipSmoke to test." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Done. Run the app: npm run dev" -ForegroundColor Cyan
