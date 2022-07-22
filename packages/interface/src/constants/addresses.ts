import { ChainId, Token } from "@dogeswap/sdk-core";
import { localnetConfig } from "../utils/localnet-config";

export type ChainTokens<T extends string = string> = { [chainId in ChainId]: Token<T> };
export type ChainContracts = { [chainId in ChainId]: string };

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
