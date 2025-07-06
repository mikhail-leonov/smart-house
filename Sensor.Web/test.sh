#!/bin/bash
DIR="/home/admin/smart-house/Sensor.Web/"
cd "$DIR" || exit 1

echo "$(basename "$DIR")"
npx mocha test/test.mjs
