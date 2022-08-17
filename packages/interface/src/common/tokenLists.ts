import { ChainId } from "@dogeswap/sdk-core";
import { TokenList } from "@uniswap/token-lists";
import DogeSwapLogo from "../../assets/embedded/logo.png";
import { SupportedToken, tokens } from "./tokens";

const unlistedTokens: SupportedToken[] = ["wwdoge"];

const tokenLogoMap: Record<string, string> = {
    OMNOM: "https://omnomtoken.com/doge.gif",
    ETH: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
    USDC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    DAI: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
    USDT: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
    WBTC: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/logo.png",
};

const createTokenList = <TChain extends ChainId>(chainId: TChain) => {
    const listTokens = Object.entries(tokens[chainId])
        .filter(([symbol]) => !unlistedTokens.includes(symbol as SupportedToken))
        .map(([_, token]) => ({
            chainId,
            address: token.address,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            logoURI: tokenLogoMap[token.symbol?.toUpperCase()] ?? "https://about.dogeswap.org/assets/chain.svg",
        }));

    return {
        name: "Default",
        timestamp: new Date().toISOString(),
        version: {
            major: 3,
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
