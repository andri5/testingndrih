#Requires -Version 5.1
$TaskName = 'TSN-LocalAgent'
$AgentDir = $PSScriptRoot
$Log = Join-Path $AgentDir 'agent.log'

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $task) {
  Write-Host "Task $TaskName is not installed."
  exit 1
}

$info = Get-ScheduledTaskInfo -TaskName $TaskName
Write-Host "Task:   $TaskName"
Write-Host "State:  $($task.State)"
Write-Host "Last:   $($info.LastRunTime) result=$($info.LastTaskResult)"
Write-Host "Next:   $($info.NextRunTime)"
Write-Host "Log:    $Log"
if (Test-Path $Log) {
  Write-Host "----- last 20 log lines -----"
  Get-Content $Log -Tail 20
}
