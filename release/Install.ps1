# MH Photo Booth Studio - per-user installer (no administrator required).
# Installs to %LOCALAPPDATA%\Programs, creates shortcuts, registers an uninstaller.
$ErrorActionPreference = 'Stop'

$AppName  = 'MH Photo Booth Studio'
$ExeName  = 'MH Photo Booth Studio.exe'
$Version  = '1.0.0'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Source    = Join-Path $ScriptDir 'MH Photo Booth Studio-win32-x64'

Write-Host ''
Write-Host '============================================'
Write-Host "  Instalador - $AppName v$Version"
Write-Host '============================================'
Write-Host ''

if (-not (Test-Path (Join-Path $Source $ExeName))) {
  Write-Host "[ERROR] No se encontro la aplicacion en:" -ForegroundColor Red
  Write-Host "        $Source" -ForegroundColor Red
  Write-Host "        Extrae el ZIP completo antes de ejecutar este instalador." -ForegroundColor Red
  exit 1
}

$Dest = Join-Path $env:LOCALAPPDATA "Programs\$AppName"
Write-Host "Instalando en: $Dest"

if (Test-Path $Dest) {
  Write-Host "Eliminando version anterior..."
  Remove-Item -Recurse -Force $Dest
}
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

Write-Host "Copiando archivos (puede tardar un momento)..."
Copy-Item -Recurse -Force (Join-Path $Source '*') $Dest
$TargetExe = Join-Path $Dest $ExeName

# --- Shortcuts (Start Menu + Desktop) ---
$WshShell  = New-Object -ComObject WScript.Shell
$StartMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$LnkStart  = Join-Path $StartMenu "$AppName.lnk"
$Shortcut  = $WshShell.CreateShortcut($LnkStart)
$Shortcut.TargetPath       = $TargetExe
$Shortcut.WorkingDirectory = $Dest
$Shortcut.IconLocation     = $TargetExe
$Shortcut.Description       = 'Cabina fotografica para eventos - Jardines Club Hipico'
$Shortcut.Save()

$Desktop  = [Environment]::GetFolderPath('Desktop')
$LnkDesk  = Join-Path $Desktop "$AppName.lnk"
Copy-Item $LnkStart $LnkDesk -Force
Write-Host "Accesos directos creados (Menu Inicio y Escritorio)."

# --- Uninstaller + Add/Remove Programs entry (HKCU, no admin) ---
Copy-Item (Join-Path $ScriptDir 'Uninstall.ps1') (Join-Path $Dest 'Uninstall.ps1') -Force
$RegKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\MHPhotoBoothStudio'
New-Item -Path $RegKey -Force | Out-Null
Set-ItemProperty $RegKey 'DisplayName'     $AppName
Set-ItemProperty $RegKey 'DisplayVersion'  $Version
Set-ItemProperty $RegKey 'Publisher'       'Miguel'
Set-ItemProperty $RegKey 'InstallLocation' $Dest
Set-ItemProperty $RegKey 'DisplayIcon'     $TargetExe
Set-ItemProperty $RegKey 'NoModify'        1
Set-ItemProperty $RegKey 'NoRepair'        1
Set-ItemProperty $RegKey 'UninstallString' "powershell -NoProfile -ExecutionPolicy Bypass -File `"$Dest\Uninstall.ps1`""

Write-Host ''
Write-Host "[OK] Instalacion completada." -ForegroundColor Green
Write-Host "Inicia la app desde el Menu Inicio o el acceso directo del Escritorio."
Write-Host "Para desinstalar: Configuracion de Windows > Aplicaciones, o ejecuta Uninstall.ps1."
Write-Host ''
