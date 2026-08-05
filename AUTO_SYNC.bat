@echo off
title Auto Sync SISKAPERBAPO Harga Pasar Jember
cd /d %~dp0
echo ==================================================
echo    AUTO SYNC SISKAPERBAPO HARGA PASAR JEMBER
echo ==================================================
echo.
echo Mengambil harga terbaru dari SISKAPERBAPO...
node scripts/update-prices.js

echo.
echo Mengirim data harga terbaru ke server online...
git add js/data.js public/js/data.js
git commit -m "Auto-sync harga pasar dari Komputer Kantor 24 Jam"
git push origin main

echo.
echo ==================================================
echo    [SUKSES] DATA HARGA TELAH TER-UPDATE ONLINE!
echo ==================================================
