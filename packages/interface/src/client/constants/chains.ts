import { ChainId, NativeToken } from "@dogeswap/sdk-core";

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleArray<T>(array: T[]) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

export const chains = {
    [ChainId.MAINNET]: {
        // Random each time. If one is down then refreshing the page should lead to another.
        urls: shuffleArray([
            "https://rpc-sg.dogechain.dog",
            "https://rpc-us.dogechain.dog",
            "https://rpc.dogechain.dog",

            "https://rpc01-sg.dogechain.dog",
            "https://rpc02-sg.dogechain.dog",
            "https://rpc03-sg.dogechain.dog",
        ]),
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
