Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if ($PSVersionTable.PSVersion.Major -ge 7) {
  $PSNativeCommandUseErrorActionPreference = $false
}

function Write-Log {
  param([string]$Message)
  Write-Host "[docs-check] $Message"
}

function Fail {
  param([string]$Message)
  Write-Host "[docs-check][error] $Message" -ForegroundColor Red
  exit 1
}

function Test-GitRef {
  param([string]$RefName)
  & git rev-parse --verify --quiet $RefName 1>$null 2>$null
  return $LASTEXITCODE -eq 0
}

function Get-DiffRange {
  $diffRange = ""

  if ($env:GITHUB_BASE_REF) {
    $baseRef = "origin/$($env:GITHUB_BASE_REF)"
    if (-not (Test-GitRef $baseRef)) {
      Write-Log "Fetching base branch '$($env:GITHUB_BASE_REF)' for CI diff..."
      & git fetch --no-tags origin "$($env:GITHUB_BASE_REF):refs/remotes/origin/$($env:GITHUB_BASE_REF)" *> $null
      if ($LASTEXITCODE -ne 0) {
        & git fetch --no-tags origin $env:GITHUB_BASE_REF *> $null
      }
    }
    if (Test-GitRef $baseRef) {
      $diffRange = "$baseRef...HEAD"
    }
  }

  if ([string]::IsNullOrWhiteSpace($diffRange)) {
    if (Test-GitRef "origin/main") {
      $diffRange = "origin/main...HEAD"
    }
    elseif (Test-GitRef "HEAD~1") {
      $diffRange = "HEAD~1...HEAD"
    }
    else {
      $diffRange = "HEAD"
    }
  }

  return $diffRange
}

function Test-CodeFile {
  param([string]$Path)
  $pattern = '^(backend/.+(\.py|\.sql)|backend/alembic/.+|backend/.+/migrations/.+|apps/.+\.(ts|tsx|js|jsx)|packages/.+\.(ts|tsx|js|jsx|mjs|cjs))$'
  return $Path -match $pattern
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path (Join-Path $scriptDir "..")
Push-Location $rootDir

try {
  $diffRange = Get-DiffRange
  Write-Log "Using diff range: $diffRange"

  & git diff --quiet --
  $workingTreeDirty = $LASTEXITCODE -ne 0
  & git diff --cached --quiet --
  $indexDirty = $LASTEXITCODE -ne 0
  $untracked = @(& git ls-files --others --exclude-standard | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

  $hasUncommittedChanges = $workingTreeDirty -or $indexDirty -or ($untracked.Count -gt 0)

  if ($hasUncommittedChanges) {
    Write-Log "Detected local uncommitted changes; using HEAD + working tree diff."
    $changedFiles = @(@(
      (& git diff --name-only HEAD | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
      $untracked
    ) | Sort-Object -Unique)
  }
  else {
    $changedFiles = @(& git diff --name-only $diffRange | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  }

  if ($changedFiles.Count -eq 0) {
    Write-Log "No changes detected in range. Skipping docs enforcement."
    exit 0
  }

  $codeFiles = @($changedFiles | Where-Object { Test-CodeFile $_ })

  if ($codeFiles.Count -eq 0) {
    Write-Log "No code changes detected in backend/apps/packages/migrations. Skipping docs requirement."
    exit 0
  }

  Write-Log "Code changes detected in:"
  foreach ($file in $codeFiles) {
    Write-Host "  - $file"
  }

  if ($hasUncommittedChanges) {
    $statusLines = @(
      (& git diff --name-status HEAD | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
      ($untracked | ForEach-Object { "A`t$_" })
    )
  }
  else {
    $statusLines = @(& git diff --name-status $diffRange | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  }

  $docPattern = '^docs/changes/[0-9]{4}-[0-9]{2}-[0-9]{2}_.+\.md$'
  $newDocs = @()

  foreach ($line in $statusLines) {
    $parts = $line -split "`t", 2
    if ($parts.Count -lt 2) {
      continue
    }

    $status = $parts[0]
    $path = $parts[1]
    if ($status -eq "A" -and $path -match $docPattern) {
      $newDocs += $path
    }
  }

  $newDocs = @($newDocs | Sort-Object -Unique)

  if ($newDocs.Count -eq 0) {
    Fail "Code changes require a NEW file in docs/changes/YYYY-MM-DD_short_title.md. Example: docs/changes/2026-02-12_fix_runtime_validation.md"
  }

  $requiredHeaders = @(
    "1. CONTEXTO",
    "2. CAMBIOS REALIZADOS",
    "3. IMPACTO EN EL DOMINIO",
    "4. ESTADO DE USO",
    "5. RIESGO DE REFRACTOR FUTURO",
    "6. CONTRATO EXTERNO AFECTADO",
    "7. CHECK DE COHERENCIA"
  )

  foreach ($doc in $newDocs) {
    if (-not (Test-Path $doc)) {
      Fail "Document declared as added but not found on disk: $doc"
    }

    Write-Log "Validating required sections in $doc"
    $content = Get-Content -Path $doc -Raw
    foreach ($header in $requiredHeaders) {
      if ($content -notmatch [regex]::Escape($header)) {
        Fail "Missing header '$header' in $doc. Required structure is defined in AGENTS.md."
      }
    }
  }

  Write-Log "Documentation enforcement passed."
}
finally {
  Pop-Location
}
