import { ChainId } from "../../../sdk-core/src/constants";
import { Token } from "../../../sdk-core/src/entities/token";
import { localnetConfig } from "../utils/localnet-config";

export type ChainTokens = { [chainId in ChainId]: Token };
export type ChainContracts = { [chainId in ChainId]: string };

const createChainTokens = (addresses: ChainContracts, decimals: number, symbol: string, name: string) =>
    Object.entries(addresses).reduce(
        (r, [chainId, address]) => {
            r[chainId] = new Token(parseInt(chainId) as ChainId, address, decimals, symbol, name);
            return r;
        }
    , {}) as ChainTokens;

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

export const Multicall: ChainContracts = {
    [ChainId.MAINNET]: localnetConfig.multicallAddress,
    [ChainId.TESTNET]: localnetConfig.multicallAddress,
    [ChainId.LOCALNET]: localnetConfig.multicallAddress,
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
