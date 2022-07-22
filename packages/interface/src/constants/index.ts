import Percent, { ChainId, Token } from "@dogeswap/sdk-core";
import { AbstractConnector } from "@web3-react/abstract-connector";
import JSBI from "jsbi";
import { injected, walletconnect, walletlink } from "../connectors";
import { localnetConfig } from "../utils/localnet-config";
import { ChainTokens, DAI, USDC, USDT, WDC } from "./addresses";

export const routerAddress = {
    [ChainId.MAINNET]: localnetConfig.routerAddress,
    [ChainId.TESTNET]: localnetConfig.routerAddress,
    [ChainId.LOCALNET]: localnetConfig.routerAddress,
};

export const getRouterAddress = (chainId: number | undefined) => {
    return routerAddress[chainId as ChainId];
};

// a list of tokens by chain
type ChainTokenList = {
    readonly [chainId in ChainId]: Token[];
};

const createListElement = (chain: ChainId, ...tokens: ChainTokens[]) => tokens.map((x) => x[chain]);

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
    [ChainId.MAINNET]: createListElement(ChainId.MAINNET, WDC, DAI, USDC, USDT),
    [ChainId.TESTNET]: createListElement(ChainId.TESTNET, WDC),
    [ChainId.LOCALNET]: createListElement(ChainId.LOCALNET, WDC, DAI, USDC, USDT),
};

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
    [ChainId.MAINNET]: {
        // e.g. [AMPL.address]: [DAI, WDC[ChainId.MAINNET]],
    },
};

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = { ...BASES_TO_CHECK_TRADES_AGAINST };

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = { ...BASES_TO_CHECK_TRADES_AGAINST };

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
    [ChainId.MAINNET]: [
        [USDC[ChainId.MAINNET], USDT[ChainId.MAINNET]],
        [DAI[ChainId.MAINNET], USDT[ChainId.MAINNET]],
    ],
};

export interface WalletInfo {
    connector?: AbstractConnector;
    name: string;
    iconName: string;
    description: string;
    href: string | null;
    color: string;
    primary?: true;
    mobile?: true;
    mobileOnly?: true;
}

export const SUPPORTED_WALLETS: { [key: string]: WalletInfo } = {
    INJECTED: {
        connector: injected,
        name: "Injected",
        iconName: "arrow-right.svg",
        description: "Injected web3 provider.",
        href: null,
        color: "#010101",
        primary: true,
    },
    METAMASK: {
        connector: injected,
        name: "MetaMask",
        iconName: "metamask.png",
        description: "Easy-to-use browser extension.",
        href: null,
        color: "#E8831D",
    },
    WALLET_CONNECT: {
        connector: walletconnect,
        name: "WalletConnect",
        iconName: "walletConnectIcon.svg",
        description: "Connect to Trust Wallet, Rainbow Wallet and more...",
        href: null,
        color: "#4196FC",
        mobile: true,
    },
    WALLET_LINK: {
        connector: walletlink,
        name: "Coinbase Wallet",
        iconName: "coinbaseWalletIcon.svg",
        description: "Use Coinbase Wallet app on mobile device",
        href: null,
        color: "#315CF5",
    },
    COINBASE_LINK: {
        name: "Open in Coinbase Wallet",
        iconName: "coinbaseWalletIcon.svg",
        description: "Open in Coinbase Wallet app.",
        href: "https://go.cb-w.com/mtUDhEZPy1",
        color: "#315CF5",
        mobile: true,
        mobileOnly: true,
    },
};

export const NetworkContextName = "NETWORK";

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 50;
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20;

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000));
export const BIPS_BASE = JSBI.BigInt(10000);
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE); // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE); // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE); // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE); // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE); // 15%

// used to ensure the user doesn't send so much ETH so they end up with <.01
export const MIN_ETH: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)); // .01 ETH
export const BETTER_TRADE_LINK_THRESHOLD = new Percent(JSBI.BigInt(75), JSBI.BigInt(10000));
