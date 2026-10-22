@echo off
chcp 65001 > nul
echo ========================================================
echo   🚀 جاري رفع التحديثات تلقائياً إلى GitHub...
echo ========================================================
cd /d "%~dp0"

git config user.name "ehabamr062-ux"
git config user.email "ehabamr062-ux@users.noreply.github.com"

git add -A
git commit -m "تحديث تلقائي: تحسينات وتعديلات النظام"
git push origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ========================================================
    echo   ✅ تم الرفع بنجاح إلى GitHub!
    echo   🔗 https://github.com/ehabamr062-ux/cash-counter-money
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo   ❌ حدث خطأ أثناء الرفع. تأكد من تسجيل دخولك في Git أو اتصالك بالإنترنت.
    echo ========================================================
)
echo.
pause
