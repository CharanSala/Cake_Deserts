param(
    [switch]$Draco,
    [string[]]$Only
)

$ErrorActionPreference = "Stop"

$blenderExe = $null
$cmd = Get-Command "blender" -ErrorAction SilentlyContinue
if ($cmd) {
    $blenderExe = $cmd.Source
}

if (-not $blenderExe) {
    $searchRoots = @(
        "C:\Program Files\Blender Foundation",
        "$env:LOCALAPPDATA\Programs\Blender Foundation"
    )
    foreach ($root in $searchRoots) {
        if (Test-Path $root) {
            $candidate = Get-ChildItem -Path $root -Directory |
                Sort-Object Name -Descending |
                ForEach-Object { Join-Path $_.FullName "blender.exe" } |
                Where-Object { Test-Path $_ } |
                Select-Object -First 1
            if ($candidate) {
                $blenderExe = $candidate
                break
            }
        }
    }
}

if (-not $blenderExe) {
    Write-Error "Blender executable not found in PATH or standard installation folders. Install Blender 3.6+ or 4.x and re-run."
    exit 1
}

$scriptPath = Join-Path $PSScriptRoot "generate-models.py"
$argsList = @("--background", "--python", $scriptPath, "--")
if ($Draco) { $argsList += "--draco" }
if ($Only -and $Only.Count -gt 0) {
    $argsList += "--only"
    $argsList += $Only
}

Write-Host "Running Blender at: $blenderExe"
& $blenderExe @argsList
