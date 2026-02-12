Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
if ($PSVersionTable.PSVersion.Major -ge 7) {
  $PSNativeCommandUseErrorActionPreference = $false
}

function Write-Log {
  param([string]$Message)
  Write-Host ""
  Write-Host "[verify] $Message"
}

function Write-WarnLog {
  param([string]$Message)
  Write-Host ""
  Write-Host "[verify][warn] $Message" -ForegroundColor Yellow
}

function Fail {
  param([string]$Message)
  Write-Host ""
  Write-Host "[verify][error] $Message" -ForegroundColor Red
  exit 1
}

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Fail "Missing required tool '$Name'."
  }
}

function Invoke-CommandWithResult {
  param(
    [string]$FilePath,
    [string[]]$Arguments
  )
  & $FilePath @Arguments
  return $LASTEXITCODE
}

function Get-HttpStatusCode {
  param(
    [string]$Url,
    [int]$TimeoutSec = 2
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec $TimeoutSec -UseBasicParsing
    return [int]$response.StatusCode
  }
  catch {
    $response = $null

    $exception = $_.Exception
    if ($null -ne $exception) {
      $responseProperty = $exception.PSObject.Properties["Response"]
      if ($null -ne $responseProperty) {
        $response = $responseProperty.Value
      }
      elseif ($null -ne $exception.InnerException) {
        $innerResponseProperty = $exception.InnerException.PSObject.Properties["Response"]
        if ($null -ne $innerResponseProperty) {
          $response = $innerResponseProperty.Value
        }
      }
    }

    if ($null -ne $response -and $null -ne $response.StatusCode) {
      try {
        return [int]$response.StatusCode
      }
      catch {
      }
    }
    return $null
  }
}

function Get-ComposeServices {
  $services = @(& docker compose config --services | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($LASTEXITCODE -ne 0) {
    Fail "Unable to read services from docker compose."
  }
  return $services
}

function Test-ServiceExists {
  param([string]$Service)
  return (Get-ComposeServices) -contains $Service
}

function Get-BackendService {
  $services = Get-ComposeServices
  Write-Log ("Detected compose services: " + ($services -join ", "))

  if (-not [string]::IsNullOrWhiteSpace($env:BACKEND_SERVICE)) {
    $requestedService = $env:BACKEND_SERVICE.Trim()
    if ($services -contains $requestedService) {
      return $requestedService
    }

    Fail "BACKEND_SERVICE='$requestedService' does not match any compose service. Available services: $($services -join ', ')"
  }

  if ($services -contains "backend") {
    return "backend"
  }

  if ($services -contains "api") {
    return "api"
  }

  $backendCandidates = @($services | Where-Object { $_ -match "backend" })
  if ($backendCandidates.Count -eq 1) {
    return $backendCandidates[0]
  }
  if ($backendCandidates.Count -gt 1) {
    Write-Log ("Ambiguous backend service candidates: " + ($backendCandidates -join ", "))
    Fail "Set BACKEND_SERVICE to one of: $($backendCandidates -join ', ')"
  }

  $apiCandidates = @($services | Where-Object { $_ -match "api" })
  if ($apiCandidates.Count -eq 1) {
    return $apiCandidates[0]
  }
  if ($apiCandidates.Count -gt 1) {
    Write-Log ("Ambiguous backend service candidates: " + ($apiCandidates -join ", "))
    Fail "Set BACKEND_SERVICE to one of: $($apiCandidates -join ', ')"
  }

  return $null
}

function Wait-BackendReady {
  param([string]$Service)

  $timeoutSeconds = 180
  $parsedTimeout = 0
  if ($env:BACKEND_READY_TIMEOUT_SECONDS -and [int]::TryParse($env:BACKEND_READY_TIMEOUT_SECONDS, [ref]$parsedTimeout)) {
    $timeoutSeconds = $parsedTimeout
  }

  $intervalSeconds = 2
  $maxAttempts = [Math]::Max([int]($timeoutSeconds / $intervalSeconds), 1)

  Write-Log "Waiting for backend service '$Service' to become ready..."

  $containerId = ""
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    $containerId = (& docker compose ps -q $Service 2>$null | Select-Object -First 1)
    if (-not [string]::IsNullOrWhiteSpace($containerId)) {
      break
    }
    Start-Sleep -Seconds $intervalSeconds
  }

  if ([string]::IsNullOrWhiteSpace($containerId)) {
    Fail "Could not resolve running container for service '$Service'."
  }

  $hasHealthcheck = (& docker inspect --format "{{if .Config.Healthcheck}}yes{{else}}no{{end}}" $containerId 2>$null | Select-Object -First 1)
  if ($LASTEXITCODE -ne 0) {
    $hasHealthcheck = "no"
  }

  if ($hasHealthcheck -eq "yes") {
    Write-Log "Container healthcheck detected; polling health status."
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
      $healthStatus = (& docker inspect --format "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $containerId 2>$null | Select-Object -First 1)
      if ($LASTEXITCODE -ne 0) {
        $healthStatus = "unknown"
      }

      switch ($healthStatus) {
        "healthy" {
          Write-Log "Backend container reported healthy."
          return
        }
        "unhealthy" {
          Fail "Backend container reported unhealthy."
        }
        default {
          Start-Sleep -Seconds $intervalSeconds
        }
      }
    }
    Fail "Timed out waiting for backend container healthcheck."
  }

  $baseUrl = if ($env:BACKEND_BASE_URL) { $env:BACKEND_BASE_URL.TrimEnd("/") } else { "http://localhost:8000" }
  $healthUrl = "$baseUrl/health"
  $openApiUrl = "$baseUrl/openapi.json"

  Write-Log "Probing /health..."
  $shortWindowSeconds = [Math]::Min([Math]::Max([int][Math]::Ceiling($timeoutSeconds / 4.0), 10), 30)
  $healthWindowAttempts = [Math]::Min($maxAttempts, [Math]::Max([int][Math]::Ceiling($shortWindowSeconds / [double]$intervalSeconds), 1))
  $healthLikelyExists = $false

  for ($attempt = 1; $attempt -le $healthWindowAttempts; $attempt++) {
    $statusCode = Get-HttpStatusCode -Url $healthUrl -TimeoutSec 2
    if ($statusCode -eq 200) {
      Write-Log "/health OK → backend ready"
      return
    }

    if ($null -ne $statusCode -and $statusCode -ne 404) {
      $healthLikelyExists = $true
    }

    if ($attempt -lt $healthWindowAttempts) {
      Start-Sleep -Seconds $intervalSeconds
    }
  }

  if ($healthLikelyExists) {
    for ($attempt = $healthWindowAttempts + 1; $attempt -le $maxAttempts; $attempt++) {
      $statusCode = Get-HttpStatusCode -Url $healthUrl -TimeoutSec 2
      if ($statusCode -eq 200) {
        Write-Log "/health OK → backend ready"
        return
      }
      Start-Sleep -Seconds $intervalSeconds
    }
    Fail "Timed out waiting for /health at $healthUrl."
  }

  Write-Log "/health not available → fallback to /openapi.json"
  $remainingAttempts = $maxAttempts - $healthWindowAttempts
  if ($remainingAttempts -lt 1) {
    $remainingAttempts = 1
  }

  for ($attempt = 1; $attempt -le $remainingAttempts; $attempt++) {
    $statusCode = Get-HttpStatusCode -Url $openApiUrl -TimeoutSec 2
    if ($statusCode -eq 200) {
      Write-Log "/openapi.json OK -> backend ready (fallback)"
      return
    }
    Start-Sleep -Seconds $intervalSeconds
  }

  Fail "Timed out waiting for backend readiness on $baseUrl (/health and /openapi.json fallback)."
}

function Test-ServiceCommandExists {
  param(
    [string]$Service,
    [string]$CommandName
  )

  Invoke-CommandWithResult docker @("compose", "exec", "-T", $Service, "sh", "-lc", "command -v $CommandName >/dev/null 2>&1") | Out-Null
  return $LASTEXITCODE -eq 0
}

function Get-DbDependentEndpointCandidate {
  $routersDir = Join-Path $rootDir "backend/src/adapters/inbound/http/routers"
  if (-not (Test-Path $routersDir)) {
    return $null
  }

  $routePattern = '(?ms)@router\.(?<method>get|post|put|patch|delete)\("(?<path>[^"]+)"[^\n]*\)\s*async def [^(]+\((?<signature>.*?)\):(?<body>.*?)(?=^@router\.|\z)'
  $routerFiles = Get-ChildItem -Path $routersDir -Filter "*.py" -File -Recurse | Sort-Object FullName

  foreach ($routerFile in $routerFiles) {
    $content = Get-Content -Path $routerFile.FullName -Raw
    $matches = [regex]::Matches($content, $routePattern)
    foreach ($match in $matches) {
      $method = $match.Groups["method"].Value
      $path = $match.Groups["path"].Value
      $signature = $match.Groups["signature"].Value

      if ($method -ne "get") {
        continue
      }
      if ($path -match "\{") {
        continue
      }
      if ($signature -notmatch "db_session_dep") {
        continue
      }
      if ($signature -match "current_user_dep|current_user_optional_dep") {
        continue
      }

      return $path
    }
  }

  return $null
}

function Run-DbSanityCheck {
  param([string]$Service)

  Write-Log "VERIFY_DB=1 → running DB sanity check..."

  if (Test-ServiceCommandExists -Service $Service -CommandName "alembic") {
    Invoke-CommandWithResult docker @("compose", "exec", "-T", $Service, "alembic", "current") | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Write-Log "DB sanity check PASS"
      return
    }

    Write-Log "DB sanity check FAIL"
    Fail "alembic current failed in backend service '$Service'."
  }

  $fallbackEndpoint = Get-DbDependentEndpointCandidate
  if ([string]::IsNullOrWhiteSpace($fallbackEndpoint)) {
    Write-Log "DB sanity check FAIL"
    Fail "VERIFY_DB=1 requested but DB sanity check cannot be performed; install alembic in container or provide a DB-dependent endpoint."
  }

  $baseUrl = if ($env:BACKEND_BASE_URL) { $env:BACKEND_BASE_URL.TrimEnd("/") } else { "http://localhost:8000" }
  $fallbackUrl = "$baseUrl$fallbackEndpoint"
  Write-WarnLog "alembic not found. Using DB-dependent endpoint fallback: $fallbackEndpoint"

  $statusCode = Get-HttpStatusCode -Url $fallbackUrl -TimeoutSec 5
  if ($statusCode -eq 200) {
    Write-Log "DB sanity check PASS"
    return
  }

  Write-Log "DB sanity check FAIL"
  Fail "DB-dependent endpoint check failed at $fallbackUrl (status: $statusCode)."
}

function Run-BackendTests {
  param([string]$Service)
  Write-Log "Running backend tests in service '$Service'."

  Invoke-CommandWithResult docker @("compose", "exec", "-T", $Service, "pytest") | Out-Null
  if ($LASTEXITCODE -eq 0) {
    return
  }

  Invoke-CommandWithResult docker @("compose", "exec", "-T", $Service, "sh", "-lc", "command -v pytest >/dev/null 2>&1") | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Fail "Backend pytest command failed. Fix failing tests before merging."
  }

  Write-WarnLog "pytest not found in container '$Service'. Trying fallback command: docker compose exec -T $Service poetry run pytest"
  Invoke-CommandWithResult docker @("compose", "exec", "-T", $Service, "poetry", "run", "pytest") | Out-Null
  if ($LASTEXITCODE -eq 0) {
    return
  }

  Fail "pytest is unavailable in container '$Service'. Suggested command: docker compose exec -T $Service poetry run pytest"
}

function Test-WebScriptExists {
  param([string]$ScriptName)
  if (-not (Test-Path "apps/web/package.json")) {
    return $false
  }

  $packageJson = Get-Content -Path "apps/web/package.json" -Raw | ConvertFrom-Json
  if (-not $packageJson.scripts) {
    return $false
  }

  return $null -ne $packageJson.scripts.PSObject.Properties[$ScriptName]
}

function Test-GitRef {
  param([string]$RefName)
  & git rev-parse --verify --quiet $RefName 1>$null 2>$null
  return $LASTEXITCODE -eq 0
}

function Get-VerifyDiffRange {
  $diffRange = ""

  if ($env:GITHUB_BASE_REF) {
    $baseRef = "origin/$($env:GITHUB_BASE_REF)"
    if (-not (Test-GitRef $baseRef)) {
      Write-Log "Fetching base branch '$($env:GITHUB_BASE_REF)' for web-change diff..."
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

function Get-ChangedFilesForVerify {
  param([string]$DiffRange)

  & git diff --quiet --
  $workingTreeDirty = $LASTEXITCODE -ne 0
  & git diff --cached --quiet --
  $indexDirty = $LASTEXITCODE -ne 0
  $untracked = @(& git ls-files --others --exclude-standard | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })

  $hasUncommittedChanges = $workingTreeDirty -or $indexDirty -or ($untracked.Count -gt 0)

  if ($hasUncommittedChanges) {
    Write-Log "Detected local uncommitted changes; using HEAD + working tree diff for web policy."
    return @(
      (& git diff --name-only HEAD | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
      $untracked
    ) | Sort-Object -Unique
  }

  return @(& git diff --name-only $DiffRange | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
}

function Test-WebChangesPresent {
  $diffRange = Get-VerifyDiffRange
  Write-Log "Web policy diff range: $diffRange"
  $changedFiles = Get-ChangedFilesForVerify -DiffRange $diffRange
  return @($changedFiles | Where-Object { $_ -like "apps/web/*" }).Count -gt 0
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path (Join-Path $scriptDir "..")

$dockerStackStarted = $false
Push-Location $rootDir
try {
  Write-Log "Checking required tools..."
  Require-Command "docker"
  Require-Command "pnpm"
  Require-Command "node"
  Require-Command "git"

  $webChanged = Test-WebChangesPresent
  if ($webChanged) {
    Write-Log "Detected changes in apps/web/**; web lint/tests cannot be skipped."
  }

  Invoke-CommandWithResult docker @("compose", "version") | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Fail "Missing 'docker compose' plugin/command."
  }

  Invoke-CommandWithResult docker @("info") | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Fail "Docker daemon is not reachable. Start Docker Desktop (or your docker engine) and retry."
  }

  Write-Log "Starting docker compose stack (detached + build)."
  Invoke-CommandWithResult docker @("compose", "up", "-d", "--build") | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Fail "Failed to start docker compose stack."
  }
  $dockerStackStarted = $true

  $backendService = Get-BackendService
  if ([string]::IsNullOrWhiteSpace($backendService)) {
    Fail "No backend service found. Expected 'backend' or a service containing 'backend'/'api'."
  }
  Write-Log "Using backend service: $backendService"

  Wait-BackendReady -Service $backendService

  if ($env:VERIFY_DB -eq "1") {
    Run-DbSanityCheck -Service $backendService
  }

  if (Test-ServiceExists "backend") {
    Run-BackendTests -Service "backend"
  }
  else {
    Run-BackendTests -Service $backendService
  }

  if (-not (Test-Path "node_modules") -or -not (Test-Path "pnpm-lock.yaml")) {
    Write-Log "Installing workspace dependencies with pnpm (node_modules missing or lockfile missing)."
    Invoke-CommandWithResult pnpm @("-w", "install") | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Fail "pnpm workspace install failed."
    }
  }
  else {
    Write-Log "Skipping pnpm install (node_modules and pnpm-lock.yaml already present)."
  }

  Write-Log "Running no-latest dependency policy check."
  & (Join-Path $scriptDir "check-no-latest-deps.ps1")
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  if (Test-WebScriptExists "lint") {
    Write-Log "Running web lint script."
    Invoke-CommandWithResult pnpm @("--filter", "@apps/web", "run", "lint") | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Fail "Web lint failed."
    }
  }
  else {
    if ($webChanged) {
      Fail "web changed but lint script missing. Add a 'lint' script to apps/web/package.json."
    }
    Write-Log "SKIP web lint: script not found"
  }

  if (Test-WebScriptExists "test:ci") {
    Write-Log "Running web test:ci script."
    Invoke-CommandWithResult pnpm @("--filter", "@apps/web", "run", "test:ci") | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Fail "Web test:ci failed."
    }
  }
  elseif (Test-WebScriptExists "test") {
    Write-Log "Running web test script."
    Invoke-CommandWithResult pnpm @("--filter", "@apps/web", "run", "test") | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Fail "Web test failed."
    }
  }
  else {
    if ($webChanged) {
      Fail "web changed but tests missing. Add 'test' or 'test:ci' script to apps/web/package.json."
    }
    Write-Log "SKIP web tests: script not found"
  }

  Write-Log "Running docs enforcement check."
  & (Join-Path $scriptDir "check-docs-changes.ps1")
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  Write-Log "Verification completed successfully."
}
finally {
  if ($env:KEEP_DOCKER_UP -eq "1") {
    Write-Log "KEEP_DOCKER_UP=1, skipping docker compose down."
  }
  elseif ($dockerStackStarted) {
    Write-Log "Stopping docker compose stack."
    Invoke-CommandWithResult docker @("compose", "down", "--remove-orphans") | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-WarnLog "Failed to stop docker compose stack cleanly."
    }
  }

  Pop-Location
}
