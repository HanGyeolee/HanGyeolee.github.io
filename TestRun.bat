@echo off
cmd /c setLegacy.bat
cmd /c npm i
yarn start
if %ERRORLEVEL%==9009 (
	npm start
)
pause