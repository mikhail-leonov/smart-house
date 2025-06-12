#!/bin/bash
cd /etc/systemd/system
mkdir -p smart-home
TARGET_DIR="/etc/systemd/system/smart-home/"
cd "$TARGET"
TARGET_DIR="/etc/systemd/system/smart-home/"
APP_NAME="UI"
TARGET="${TARGET_DIR}${APP_NAME}.service"
touch "$TARGET"
chmod a+x "$TARGET"
echo -e "[Unit]\rDescription=Smart House ${APP_NAME} Service\rAfter=network.target\r\r[Service]\rType=simple\rExecStart=/home/admin/smart-house/${APP_NAME}/service.cmd\rWorkingDirectory=/home/admin/smart-house/${APP_NAME}\rUser=admin\rRestart=on-failure\r\r[Install]\rWantedBy=multi-user.target\r" > "$TARGET"
