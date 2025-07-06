#!/bin/bash
DIR="/home/admin/smart-house/LLM/"
cd "$DIR" || exit 1

echo "$(basename "$DIR")"
npx mocha test/test.mjs
