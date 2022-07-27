import { ChainId } from "@dogeswap/sdk-core";

export const defaultChainId = parseInt(CHAIN_ID) as ChainId;

if (ChainId[defaultChainId] == undefined) {
    throw new Error(`Invalid CHAIN_ID environment variable ${defaultChainId}`);
}
