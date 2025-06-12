#!/bin/bash

NAME="Editor"

APP_NAME="smart-house-${NAME,,}"
TARGET_DIR="/etc/systemd/system"
UNIT_NAME="${APP_NAME}.service"
TARGET_PATH="${TARGET_DIR}/${UNIT_NAME}"

# Stop and disable service before removing it
sudo systemctl stop "$UNIT_NAME"
sudo systemctl disable "$UNIT_NAME"

# Remove the service file
sudo rm -f "$TARGET_PATH"

# Reload systemd to apply changes
sudo systemctl daemon-reload
