#!/bin/bash
DIR="/home/admin/smart-house/Control.Telegram/"
cd "$DIR" || exit 1

echo "$(basename "$DIR")"
npx mocha test/test.mjs
