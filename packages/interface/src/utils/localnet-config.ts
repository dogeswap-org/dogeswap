import { ChainId } from "@dogeswap/sdk-core";
import { TokenList } from "@uniswap/token-lists";

const localTokens = {
    DST: true,
    USDT: true,
    USDC: true,
    DAI: true,
    WDC: true,
};

const localnet = {
    factoryAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    router02Address: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
    multicallAddress: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    dstAddress: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    usdtAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    usdcAddress: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
    daiAddress: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
    wdcAddress: "0x9A676e781A523b5d0C0e43731313A708CB607508"
}

interface LocalnetConfigBase {
    factoryAddress: string;
    routerAddress: string;
    multicallAddress: string;
    localTokenList: TokenList;
}

type TokenAddressConfig = { [key in keyof typeof localTokens as `${Lowercase<key>}Address`]: string };

type LocalnetConfig = LocalnetConfigBase & TokenAddressConfig;

const getTokenAddress = (token: string) =>
    (localnet as Record<string, string | undefined>)[`${token.toLowerCase()}Address`];

const createLocalnetTokenListItem = (symbol: string) => ({
    chainId: ChainId.LOCALNET,
    address: getTokenAddress(symbol),
    name: symbol,
    symbol,
    decimals: 18,
    logoURI: "https://assets.coingecko.com/coins/images/4490/thumb/aergo.png?1647696770",
});

const addressConfig = Object.keys(localTokens).reduce<Record<string, string>>((r, x) => {
    r[`${x.toLowerCase()}Address`] = getTokenAddress(x) as string;
    return r;
}, {});

const createLocalnetTokenList = () =>
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
    tokens: Object.keys(localTokens).map((x) => createLocalnetTokenListItem(x)),
} as TokenList);

export const localnetConfig = {
    factoryAddress: localnet.factoryAddress,
    routerAddress: localnet.router02Address,
    multicallAddress: localnet.multicallAddress,

    ...addressConfig,

    localTokenList: createLocalnetTokenList(),
} as LocalnetConfig;
