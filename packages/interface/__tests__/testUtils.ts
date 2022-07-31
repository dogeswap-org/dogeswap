import { ChainId, Token } from "@dogeswap/sdk-core";

export const testWDC = new Token(
    ChainId.LOCALNET,
    "0x1000000000000000000000000000000000000000",
    18,
    "WDC",
    "Wrapped Dogechain",
);
