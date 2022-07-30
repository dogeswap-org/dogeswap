#!/bin/bash
cd "${0%/*}/.."
pm2 start packages/interface/dist/server/main.js --name @dogeswap/interface --watch