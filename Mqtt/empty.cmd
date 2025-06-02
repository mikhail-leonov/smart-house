@echo off
setlocal enabledelayedexpansion

:: === Configuration ===
set "HOST=localhost"
set "TOPIC_BASE=#"
set "TMPFILE=%TEMP%\mqtt_retained_topics.txt"

:: === Clean up previous temp file ===
if exist "%TMPFILE%" del "%TMPFILE%"

echo Scanning for retained messages under topic [%TOPIC_BASE%]...

:: === Capture retained messages ===
mosquitto_sub -h %HOST% -t "%TOPIC_BASE%" --retained-only -v > "%TMPFILE%" 2>nul

if not exist "%TMPFILE%" (
    echo No retained messages found.
    goto :end
)

:: === Process and delete each retained topic ===
for /f "usebackq delims=" %%A in ("%TMPFILE%") do (
    set "line=%%A"
    setlocal enabledelayedexpansion

    :: Extract topic (everything before first space)
    for /f "tokens=1* delims= " %%T in ("!line!") do (
        set "topic=%%T"
        echo Deleting retained message from topic: [!topic!]
        mosquitto_pub -h %HOST% -t "!topic!" -r -n
    )

    endlocal
)

:end
echo Done.
endlocal
pause
