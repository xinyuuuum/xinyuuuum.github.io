@echo off
echo Downloading required libraries for Interview Tracker...
echo.
echo This will download React, MUI, and other required libraries.
echo You need an internet connection for this step.
echo.
pause

powershell -ExecutionPolicy Bypass -File "%~dp0download-libs.ps1"

pause