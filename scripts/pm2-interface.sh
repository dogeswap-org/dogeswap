#!/bin/bash
cd "${0%/*}/.."
yarn
yarn build
pm2 start packages/interface/dist/client/main.js --name @dogeswap/interface --watch