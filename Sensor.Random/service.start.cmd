#!/bin/bash

NAME="Sensor.Random"

TARGET_DIR="/etc/systemd/system/"
cd "$TARGET"
APP_NAME="smart-house-${NAME,,}"

systemctl daemon-reexec
systemctl daemon-reload

systemctl start "${APP_NAME}.service"