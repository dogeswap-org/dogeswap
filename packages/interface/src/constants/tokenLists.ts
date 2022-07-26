import { ChainId } from "@dogeswap/sdk-core";
import { TokenList } from "@uniswap/token-lists";
import { addresses } from "./addresses";

const createLocalnetTokenListItem = <T extends ChainId>(chainId: T, symbol: ListTokens<T>) => ({
    chainId: ChainId.LOCALNET,
    address: addresses[chainId][symbol] as unknown as string, // TS can't figure out how ListTokens<T> maps to an address list.
    name: symbol,
    symbol,
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/4490/thumb/aergo.png?1647696770",
});

type BlacklistedAddressKeys = "factory" | "router" | "multicall" | "wdc";
type ListTokens<TChain extends ChainId> = Exclude<keyof typeof addresses[TChain], BlacklistedAddressKeys> & string;

const createTokenList = <TChain extends ChainId>(chainId: TChain, ...tokens: Array<ListTokens<TChain>>) =>
    ({
        name: "Local",
        timestamp: new Date().toISOString(),
        version: {
            major: 0,
            minor: 0,
            patch: 0,
        },
        tags: {},
        logoURI: "ipfs://QmNa8mQkrNKp1WEEeGjFezDmDeodkWRevGFN8JCV7b4Xir",
        keywords: [],
        tokens: tokens.map((x) => createLocalnetTokenListItem(chainId, x)),
    } as TokenList);

export const tokenLists = {
    [ChainId.MAINNET]: createTokenList(ChainId.MAINNET),
    [ChainId.TESTNET]: createTokenList(ChainId.TESTNET),
    [ChainId.LOCALNET]: createTokenList(ChainId.LOCALNET, "dai", "dst", "usdc", "usdt"),
};
