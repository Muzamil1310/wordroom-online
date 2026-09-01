@echo off
python build.py
wrangler pages deploy ./ --project-name=wordroomonline
pause
