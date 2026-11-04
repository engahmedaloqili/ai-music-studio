# ينشئ أيقونة "AI Music Studio" على سطح المكتب تشغّل التطبيق من مجلد المشروع مباشرة
# (مفيد أثناء التطوير قبل بناء ملف التثبيت). التشغيل:
#   powershell -ExecutionPolicy Bypass -File scripts\create-desktop-shortcut.ps1

$projectDir = Split-Path -Parent $PSScriptRoot
$desktop    = [Environment]::GetFolderPath('Desktop')
$lnkPath    = Join-Path $desktop 'AI Music Studio.lnk'

$shell = New-Object -ComObject WScript.Shell
$lnk = $shell.CreateShortcut($lnkPath)
$lnk.TargetPath       = 'cmd.exe'
$lnk.Arguments        = '/c npm start'
$lnk.WorkingDirectory = $projectDir
$lnk.WindowStyle      = 7   # تصغير نافذة الأوامر
$icon = Join-Path $projectDir 'build\icon.ico'
if (Test-Path $icon) { $lnk.IconLocation = $icon }
$lnk.Save()

Write-Host "تم إنشاء الأيقونة: $lnkPath"
