import { ChainId, Token } from "@dogeswap/sdk-core";
import { localnetConfig } from "../utils/localnet-config";

export type ChainTokens<T extends string = string> = { [chainId in ChainId]: Token<T> };
export type ChainContracts = { [chainId in ChainId]: string };

export const addresses = {
    [ChainId.MAINNET]: {
        infrastructure: {},
        tokens: {}
    },
    [ChainId.TESTNET]: {
        infrastructure: {},
        tokens: {}
    },
    [ChainId.LOCALNET]: {
        infrastructure: {
            factory: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
            router: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
            multicall: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
        },
        tokens: {
            dst: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
            usdt: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
            usdc: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
            dai: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
            wdc: "0x9A676e781A523b5d0C0e43731313A708CB607508",
        }
    },
};

const createChainTokens = <T extends string>(addresses: ChainContracts, decimals: number, symbol: T, name: string) =>
    Object.entries(addresses).reduce((r, [chainId, address]) => {
        r[parseInt(chainId) as ChainId] = new Token(parseInt(chainId) as ChainId, address, decimals, symbol, name);
        return r;
    }, {} as Partial<ChainTokens<T>>) as ChainTokens<T>;

export const WDC = createChainTokens(
    {
        [ChainId.MAINNET]: localnetConfig.wdcAddress,
        [ChainId.TESTNET]: localnetConfig.wdcAddress,
        [ChainId.LOCALNET]: localnetConfig.wdcAddress,
    },
    18,
    "WDC",
    "Wrapped Dogechain",
);

export const multicall: ChainContracts = {
    [ChainId.MAINNET]: localnetConfig.multicallAddress,
    [ChainId.TESTNET]: localnetConfig.multicallAddress,
    [ChainId.LOCALNET]: localnetConfig.multicallAddress,
};

export const factory: ChainContracts = {
    [ChainId.MAINNET]: localnetConfig.factoryAddress,
    [ChainId.TESTNET]: localnetConfig.factoryAddress,
    [ChainId.LOCALNET]: localnetConfig.factoryAddress,
};

export const DAI = createChainTokens(
    {
        [ChainId.MAINNET]: localnetConfig.daiAddress,
        [ChainId.TESTNET]: localnetConfig.daiAddress,
        [ChainId.LOCALNET]: localnetConfig.daiAddress,
    },
    18,
    "DAI",
    "Dai Stablecoin",
);

export const USDC = createChainTokens(
    {
        [ChainId.MAINNET]: localnetConfig.usdcAddress,
        [ChainId.TESTNET]: localnetConfig.usdcAddress,
        [ChainId.LOCALNET]: localnetConfig.usdcAddress,
    },
    18,
    "USDC",
    "USD//C",
);

export const USDT = createChainTokens(
    {
        [ChainId.MAINNET]: localnetConfig.usdtAddress,
        [ChainId.TESTNET]: localnetConfig.usdtAddress,
        [ChainId.LOCALNET]: localnetConfig.usdtAddress,
    },
    18,
    "USDT",
    "Tether USD",
);
