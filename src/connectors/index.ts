import { Web3Provider } from "@ethersproject/providers";
import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { env } from "../utils/env";

import { ChainId } from "../../../sdk-core/src/constants";
import { NetworkConnector } from "./NetworkConnector";

const { CHAIN_ID, NETWORK_URL } = env;

export const network = new NetworkConnector({
    urls: { [CHAIN_ID]: NETWORK_URL },
});

let networkLibrary: Web3Provider | undefined;
export function getNetworkLibrary(): Web3Provider {
    return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any));
}

export const injected = new InjectedConnector({
    supportedChainIds: [1, 3, 4, 5, 42],
});

// mainnet only
export const walletconnect = new WalletConnectConnector({
    rpc: { [ChainId.MAINNET]: NETWORK_URL },
    bridge: "https://bridge.walletconnect.org",
    qrcode: true,
    pollingInterval: 15000,
});

// mainnet only
export const walletlink = new WalletLinkConnector({
    url: NETWORK_URL,
    appName: "Uniswap",
    appLogoUrl:
        "https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg",
});
