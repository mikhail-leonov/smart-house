#!/bin/bash

NAME="Control.GMail"

TARGET_DIR="/etc/systemd/system/"
cd "$TARGET"
APP_NAME="smart-house-${NAME,,}"
TARGET="${TARGET_DIR}${APP_NAME}.service"
touch "$TARGET"
chmod a+x "$TARGET"
echo -e "[Unit]\rDescription=Smart House ${APP_NAME} Service\rAfter=network.target\r\r[Service]\rType=simple\rExecStart=/home/admin/smart-house/${NAME}/service.cmd\rWorkingDirectory=/home/admin/smart-house/${NAME}\rUser=admin\rRestart=on-failure\r\r[Install]\rWantedBy=multi-user.target\r" > "$TARGET"

systemctl daemon-reexec
systemctl daemon-reload

systemctl enable "${APP_NAME}.service"
systemctl start "${APP_NAME}.service"