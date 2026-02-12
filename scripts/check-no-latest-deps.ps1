Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Write-Log {
  param([string]$Message)
  Write-Host "[no-latest-deps] $Message"
}

function Fail {
  param([string]$Message)
  Write-Host "[no-latest-deps][error] $Message" -ForegroundColor Red
  exit 1
}

function Get-PackageJsonPaths {
  param([string]$RootDir)

  $paths = New-Object System.Collections.Generic.List[string]

  $rootPackage = Join-Path $RootDir "package.json"
  if (Test-Path $rootPackage) {
    $paths.Add((Resolve-Path $rootPackage).Path)
  }

  foreach ($dir in @("apps", "packages")) {
    $target = Join-Path $RootDir $dir
    if (-not (Test-Path $target)) {
      continue
    }

    $files = Get-ChildItem -Path $target -Recurse -Filter "package.json" -File
    foreach ($file in $files) {
      $paths.Add($file.FullName)
    }
  }

  return $paths | Sort-Object -Unique
}

function Get-RelativePath {
  param(
    [string]$BasePath,
    [string]$TargetPath
  )

  $baseFullPath = [System.IO.Path]::GetFullPath($BasePath)
  $targetFullPath = [System.IO.Path]::GetFullPath($TargetPath)

  Push-Location $baseFullPath
  try {
    $relative = (Resolve-Path -LiteralPath $targetFullPath -Relative)
    if ($relative.StartsWith(".\")) {
      return $relative.Substring(2)
    }
    if ($relative.StartsWith("./")) {
      return $relative.Substring(2)
    }
    return $relative
  }
  finally {
    Pop-Location
  }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = (Resolve-Path (Join-Path $scriptDir "..")).Path

Push-Location $rootDir
try {
  $packageJsonPaths = Get-PackageJsonPaths -RootDir $rootDir
  $sections = @("dependencies", "devDependencies", "peerDependencies", "optionalDependencies")
  $violations = New-Object System.Collections.Generic.List[string]

  foreach ($filePath in $packageJsonPaths) {
    $raw = Get-Content -Path $filePath -Raw

    try {
      $packageJson = $raw | ConvertFrom-Json
    }
    catch {
      Fail "Failed to parse JSON in $filePath"
    }

    $relativePath = (Get-RelativePath -BasePath $rootDir -TargetPath $filePath).Replace('\', '/')

    foreach ($section in $sections) {
      $sectionProp = $packageJson.PSObject.Properties[$section]
      if ($null -eq $sectionProp) {
        continue
      }

      $deps = $sectionProp.Value
      if ($null -eq $deps) {
        continue
      }

      foreach ($dep in $deps.PSObject.Properties) {
        if ([string]$dep.Value -eq "latest") {
          $violations.Add(('{0}: {1}.{2} = "latest"' -f $relativePath, $section, $dep.Name))
        }
      }
    }
  }

  if ($violations.Count -gt 0) {
    Write-Host ""
    Write-Host "[no-latest-deps][error] Found forbidden \"latest\" dependency specifiers:" -ForegroundColor Red
    foreach ($violation in $violations) {
      Write-Host $violation
    }
    Write-Host ""
    Write-Host "Fix: pin this dependency to an exact version (preferably from pnpm-lock.yaml), then run pnpm -w install."
    exit 1
  }

  Write-Host "NO_LATEST_DEPS PASS"
}
finally {
  Pop-Location
}
