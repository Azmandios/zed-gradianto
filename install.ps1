# Installs the Gradianto theme family into Zed's local themes directory.
$ErrorActionPreference = "Stop"

$source = Join-Path $PSScriptRoot "themes\gradianto.json"
$targetDir = Join-Path $env:APPDATA "Zed\themes"
$target = Join-Path $targetDir "gradianto.json"

if (-not (Test-Path $source)) {
  throw "Theme file not found: $source. Run 'node scripts/build.js' first."
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
Copy-Item $source $target -Force

Write-Host "Installed: $target"
Write-Host "Restart Zed, then run 'theme selector: toggle' (Ctrl+K Ctrl+T)."
