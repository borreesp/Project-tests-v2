Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if ($PSVersionTable.PSVersion.Major -ge 7) {
  $PSNativeCommandUseErrorActionPreference = $false
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$verifyScript = Join-Path $scriptDir "verify.ps1"

if (-not (Test-Path $verifyScript)) {
  Write-Host "[preflight][error] Missing verify script: $verifyScript" -ForegroundColor Red
  exit 1
}

& $verifyScript
$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
  Write-Host "OK TO OPEN PR"
  exit 0
}

Write-Host "[preflight][error] verify.ps1 failed (exit code: $exitCode)" -ForegroundColor Red
exit 1
