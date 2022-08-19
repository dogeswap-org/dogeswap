# DogeSwap

## Run the app locally (port 9000)

```bash
yarn
yarn dev
```

## Run the app in production

```bash
export NODE_ENV=production
yarn
yarn build
node packages/interface/dist/server/server.js -c <CHAIN ID> -p <PORT>
```
