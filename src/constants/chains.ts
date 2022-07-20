import { ChainId, DOGECHAIN } from "../../../sdk-core/src";

export const chains = {
    [ChainId.MAINNET]: {
        urls: ["localhost:8545"],
        name: "Dogechain Mainnet",
        nativeCurrency: DOGECHAIN,
    },
    [ChainId.TESTNET]: {
        urls: ["localhost:8545"],
        name: "Dogechain Testnet",
        nativeCurrency: DOGECHAIN,
    },
    [ChainId.LOCALNET]: {
        urls: ["localhost:8545"],
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
