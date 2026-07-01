# MH Photo Booth Studio - per-user uninstaller (no administrator required).
$ErrorActionPreference = 'SilentlyContinue'

$AppName = 'MH Photo Booth Studio'
$Dest    = Join-Path $env:LOCALAPPDATA "Programs\$AppName"

Write-Host "Desinstalando $AppName..."

# Remove shortcuts
Remove-Item (Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\$AppName.lnk") -Force
Remove-Item (Join-Path ([Environment]::GetFolderPath('Desktop')) "$AppName.lnk") -Force

# Remove Add/Remove Programs entry
Remove-Item 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\MHPhotoBoothStudio' -Recurse -Force

# Remove program files. A detached process deletes the folder after this script exits
# (a running script cannot delete its own directory).
Start-Process powershell -WindowStyle Hidden -ArgumentList @(
  '-NoProfile','-Command',
  "Start-Sleep -Seconds 2; Remove-Item -Recurse -Force `"$Dest`""
)

Write-Host "[OK] Desinstalado. Tus eventos y fotos en %APPDATA% se conservan."
Write-Host "     (Borralos manualmente si ya no los necesitas.)"
