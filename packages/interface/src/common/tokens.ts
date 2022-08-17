import { ChainId, Token } from "@dogeswap/sdk-core";
import { addresses } from "./addresses";

export type ChainToken<T extends ChainId> = keyof typeof addresses[T]["tokens"];

type AddressableTokenMap = { [chainId in ChainId]: ChainToken<chainId> };
export type SupportedToken = AddressableTokenMap[keyof AddressableTokenMap];

interface TokenMetadata {
    name: string;
    decimals?: number;
}

const tokenMetadata: Record<SupportedToken, TokenMetadata> = {
    dst: {
        name: "DogeSwap Token",
    },
    omnom: {
        name: "DogeEatDoge",
    },
    wwdoge: {
        name: "Wrapped wrapped Dogecoin",
    },
    eth: {
        name: "Ethereum",
    },
    usdc: {
        name: "USD Coin",
        decimals: 6,
    },
    dai: {
        name: "Dai Stablecoin",
    },
    usdt: {
        name: "Tether USD",
        decimals: 6,
    },
    wbtc: {
        name: "Wrapped BTC",
        decimals: 8,
    },
};

const createTokens = <T extends ChainId>(chainId: T) => {
    return Object.entries(addresses[chainId]["tokens"]).reduce((r, [symbol, address]) => {
        const { name, decimals } = tokenMetadata[symbol as SupportedToken];
        r[symbol as ChainToken<T>] = new Token(chainId, address, decimals ?? 18, symbol.toUpperCase(), name);
        return r;
    }, {} as Record<ChainToken<T>, Token>);
};

export const tokens = {
    [ChainId.MAINNET]: createTokens(ChainId.MAINNET),
    [ChainId.TESTNET]: createTokens(ChainId.TESTNET),
    [ChainId.LOCALNET]: createTokens(ChainId.LOCALNET),
};

export const getToken = <T extends SupportedToken>(token: T, chainId: ChainId | undefined) => {
    if (chainId == undefined) {
        return undefined;
    }

    return (tokens as Record<ChainId, Partial<Record<SupportedToken, Token>>>)[chainId]?.[token] as
        | Token<Uppercase<T>>
        | undefined;
};
