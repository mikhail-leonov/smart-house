#!/bin/bash

NAME="Editor"

TARGET_DIR="/etc/systemd/system/"
cd "$TARGET"
APP_NAME="smart-house-${NAME,,}"

systemctl status "${APP_NAME}.service"
