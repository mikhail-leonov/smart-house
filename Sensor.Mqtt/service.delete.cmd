#!/bin/bash
cd /etc/systemd/system
mkdir -p smart-home
TARGET_DIR="/etc/systemd/system/smart-home/"
cd "$TARGET"
TARGET_DIR="/etc/systemd/system/smart-home/"
APP_NAME="Sensor.Mqtt"
TARGET="${TARGET_DIR}${APP_NAME}.service"
rm -f -r "$TARGET"
