@echo off
REM =========================================================================
REM  Portfolio Builder for Windows
REM  Updates index.html from portfolio.config.json
REM =========================================================================

echo [INFO] Updating portfolio from portfolio.config.json...
node build.js
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Portfolio updated successfully!
) else (
    echo [ERROR] Build failed. Please ensure Node.js is installed.
)
pause
