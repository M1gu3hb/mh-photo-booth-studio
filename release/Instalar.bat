@echo off
REM MH Photo Booth Studio - lanzador del instalador (doble clic).
title Instalador - MH Photo Booth Studio
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install.ps1"
echo.
pause
