import { ChainId, DOGECHAIN } from "@dogeswap/sdk-core";

export const createChainMap = <T>(generateValue: <TChainId extends ChainId>(x: TChainId) => T) => ({
    [ChainId.MAINNET]: generateValue(ChainId.MAINNET),
    [ChainId.TESTNET]: generateValue(ChainId.TESTNET),
    [ChainId.LOCALNET]: generateValue(ChainId.LOCALNET),
});

export const chains = {
    [ChainId.MAINNET]: {
        urls: ["http://localhost:8545"],
        name: "Dogechain Mainnet",
        nativeCurrency: DOGECHAIN,
    },
    [ChainId.TESTNET]: {
        urls: ["http://localhost:8545"],
        name: "Dogechain Testnet",
        nativeCurrency: DOGECHAIN,
    },
    [ChainId.LOCALNET]: {
        urls: ["http://localhost:8545"],
        name: "Dogechain Localnet",
        nativeCurrency: DOGECHAIN,
    },
};

export const urls = Object.keys(chains).reduce<{ [chainId: number]: string[] }>((accumulator, chainId) => {
    const validURLs = chains[parseInt(chainId) as ChainId].urls;
    if (validURLs.length) {
        accumulator[Number(chainId)] = validURLs;
    }

    return accumulator;
}, {});
