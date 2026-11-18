#Requires -Version 5.1
$ErrorActionPreference = 'Stop'
$TaskName = 'TSN-LocalAgent'
$AgentDir = $PSScriptRoot

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
$runner = Join-Path $AgentDir 'run-windows.cmd'
if (Test-Path $runner) { Remove-Item $runner -Force }

Write-Host "Removed Scheduled Task: $TaskName"
Write-Host "agent.env and agent.log were kept (delete manually if needed)."
