@echo off
setlocal enabledelayedexpansion

:: Configuration
set HOST=localhost
set TOPIC_BASE=home/#

echo Listing retained topics under %TOPIC_BASE%...

:: Temporary file to store retained topics
set TMPFILE=%TEMP%\mqtt_retained_topics.txt

:: Subscribe and collect retained messages
mosquitto_sub -h %HOST% -t %TOPIC_BASE% --retained-only -v -C 100 > "%TMPFILE%"

if not exist "%TMPFILE%" (
    echo No retained messages found.
    goto :end
)

:: Parse and publish null message to each retained topic
for /f "usebackq tokens=1,* delims= " %%A in ("%TMPFILE%") do (
    echo Deleting retained message from topic: %%A
    mosquitto_pub -h %HOST% -t "%%A" -r -n
)

:end
echo Done.
endlocal
pause
