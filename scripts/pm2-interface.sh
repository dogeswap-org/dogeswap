#!/bin/bash
cd "${0%/*}/.."
pm2 start packages/interface/dist/server/server.js --name @dogeswap/interface --watch