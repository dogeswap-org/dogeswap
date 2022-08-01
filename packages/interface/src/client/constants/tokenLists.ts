import { ChainId } from "@dogeswap/sdk-core";
import { TokenList } from "@uniswap/token-lists";
import DogeSwapLogo from "../../../assets/embedded/logo.svg";
import { SupportedToken, tokens } from "./tokens";

const unlistedTokens: SupportedToken[] = ["wdc"];

const createTokenList = <TChain extends ChainId>(chainId: TChain) => {
    const listTokens = Object.entries(tokens[chainId])
        .filter(([symbol]) => !unlistedTokens.includes(symbol as SupportedToken))
        .map(([_, token]) => ({
            chainId,
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            logoURI: "https://assets.coingecko.com/coins/images/4490/thumb/aergo.png?1647696770",
        }));

    return {
        name: "Default",
        timestamp: new Date().toISOString(),
        version: {
            major: 0,
            minor: 0,
            patch: 0,
        },
        tags: {},
        logoURI: DogeSwapLogo,
        keywords: [],
        tokens: listTokens,
    } as TokenList;
};

export const tokenLists = {
    [ChainId.MAINNET]: createTokenList(ChainId.MAINNET),
    [ChainId.TESTNET]: createTokenList(ChainId.TESTNET),
    [ChainId.LOCALNET]: createTokenList(ChainId.LOCALNET),
};
