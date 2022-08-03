import { ChainId, NativeToken } from "@dogeswap/sdk-core";

export const chains = {
    [ChainId.MAINNET]: {
        urls: ["https://rpc01-sg.dogechain.dog", "https://rpc02-sg.dogechain.dog", "https://rpc03-sg.dogechain.dog"],
        name: "Dogechain Mainnet",
        nativeCurrency: NativeToken.Instance,
    },
    [ChainId.TESTNET]: {
        urls: ["https://rpc-testnet.dogechain.dog"],
        name: "Dogechain Testnet",
        nativeCurrency: NativeToken.Instance,
    },
    [ChainId.LOCALNET]: {
        urls: ["http://localhost:8545"],
        name: "Dogechain Localnet",
        nativeCurrency: NativeToken.Instance,
    },
};

export const urls = Object.keys(chains).reduce<{ [chainId: number]: string[] }>((accumulator, chainId) => {
    const validURLs = chains[parseInt(chainId) as ChainId].urls;
    if (validURLs.length) {
        accumulator[Number(chainId)] = validURLs;
    }

    return accumulator;
}, {});
