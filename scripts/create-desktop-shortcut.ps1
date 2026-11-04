# Creates an "AI Music Studio" desktop shortcut that builds and runs the app from this folder.
# (ASCII only: Windows PowerShell 5.1 misreads UTF-8 files without BOM.)
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\create-desktop-shortcut.ps1

$projectDir = Split-Path -Parent $PSScriptRoot
$desktop    = [Environment]::GetFolderPath('Desktop')
$lnkPath    = Join-Path $desktop 'AI Music Studio.lnk'

$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut($lnkPath)
$lnk.TargetPath       = 'cmd.exe'
$lnk.Arguments        = '/c npm start'
$lnk.WorkingDirectory = $projectDir
$lnk.WindowStyle      = 7   # minimized console
$icon = Join-Path $projectDir 'build\icon.ico'
if (Test-Path $icon) { $lnk.IconLocation = $icon }
$lnk.Save()

Write-Host "Shortcut created: $lnkPath"
