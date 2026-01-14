param(
  [ValidateSet("auth","noauth")]
  [string]$variant = "noauth"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$viteDir = Join-Path $root "vite-tsconditioner"
$goDir   = Join-Path $root "go_tsconditioner"
$distDir = Join-Path $root "dist"
$outDir  = Join-Path $goDir "ui\static-react\timeseries-dist"

Write-Host "== Build React ($variant) =="
Push-Location $viteDir
npm install
if ($variant -eq "auth") { npm run build:auth } else { npm run build:noauth }
Pop-Location

Write-Host "== Build Go ($variant) =="
New-Item -ItemType Directory -Force -Path (Join-Path $distDir $variant) | Out-Null

Push-Location $goDir
if ($variant -eq "auth") {
  go build -tags auth   -o (Join-Path $distDir "auth\server.exe")   .\cmd\server
} else {
  go build -tags noauth -o (Join-Path $distDir "noauth\server.exe") .\cmd\server
}
Pop-Location

Write-Host "Done. UI in: $outDir"
Write-Host "Binary in: $(Join-Path $distDir "$variant\server.exe")"