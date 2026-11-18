#Requires -Version 5.1
<#
.SYNOPSIS
  Install Test Sambil Ngopi local-agent as a Windows Scheduled Task (shared VPN runner).

.DESCRIPTION
  One office/VPN PC runs the agent continuously after user logon.
  QA only clicks "Jalankan di PC ini" in the cloud UI — no per-user agent.

  Prerequisites:
    1. Clone repo + backend deps + Playwright browsers
    2. Copy agent.env.example -> agent.env and set AGENT_TOKEN
    3. VPN/LAN must reach internal staging from this PC

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\local-agent\install-windows-task.ps1
#>

$ErrorActionPreference = 'Stop'
$TaskName = 'TSN-LocalAgent'
$AgentDir = $PSScriptRoot
$RepoRoot = (Resolve-Path (Join-Path $AgentDir '..\..')).Path
$EnvFile = Join-Path $AgentDir 'agent.env'
$Runner = Join-Path $AgentDir 'run-windows.cmd'
$NodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $NodeCmd) {
  Write-Error "Node.js not found in PATH. Install Node 20+ then retry."
}

if (-not (Test-Path $EnvFile)) {
  Write-Host "Missing agent.env. Creating from example..."
  Copy-Item (Join-Path $AgentDir 'agent.env.example') $EnvFile
  Write-Error "Edit $EnvFile — set AGENT_TOKEN (Settings → Integrations → CI/CD API Tokens), then re-run this script."
}

$tokenLine = Get-Content $EnvFile | Where-Object { $_ -match '^\s*AGENT_TOKEN\s*=' } | Select-Object -First 1
if (-not $tokenLine -or $tokenLine -match 'tsn_your_token_here' -or $tokenLine -match '=\s*$') {
  Write-Error "Set a real AGENT_TOKEN in $EnvFile before installing."
}

$playwrightPkg = Join-Path $RepoRoot 'backend\node_modules\playwright'
if (-not (Test-Path $playwrightPkg)) {
  Write-Host "Installing backend dependencies..."
  Push-Location (Join-Path $RepoRoot 'backend')
  try {
    npm install
    npx playwright install chromium
  } finally {
    Pop-Location
  }
}

# Wrapper so Task Scheduler can start without embedding secrets on the command line
@(
  '@echo off'
  "cd /d `"$RepoRoot`""
  "node `"$AgentDir\run.mjs`" >> `"$AgentDir\agent.log`" 2>&1"
) | Set-Content -Path $Runner -Encoding ASCII

$action = New-ScheduledTaskAction -Execute $Runner -WorkingDirectory $RepoRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1) `
  -ExecutionTimeLimit ([TimeSpan]::Zero)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Out-Null

Start-ScheduledTask -TaskName $TaskName
Start-Sleep -Seconds 2
$info = Get-ScheduledTaskInfo -TaskName $TaskName

Write-Host ""
Write-Host "Installed Scheduled Task: $TaskName"
Write-Host "  Repo:     $RepoRoot"
Write-Host "  Env:      $EnvFile"
Write-Host "  Log:      $(Join-Path $AgentDir 'agent.log')"
Write-Host "  Last run: $($info.LastRunTime) (result $($info.LastTaskResult))"
Write-Host ""
Write-Host "QA flow: open Internal scenario → Jalankan di PC ini"
Write-Host "VPN must be connected on this PC while the agent runs."
Write-Host "Uninstall: powershell -File scripts\local-agent\uninstall-windows-task.ps1"
