import { Web3Provider } from "@ethersproject/providers";
import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";

import { ChainId } from "@dogeswap/sdk-core";
import { chains } from "../constants/chains";
import { defaultChainId } from "../utils/chainId";
import { NetworkConnector } from "./NetworkConnector";

const networkUrls = Object.entries(chains).reduce((r, [chainId, chain]) => {
    r[parseInt(chainId) as ChainId] = chain.urls[0];
    return r;
}, {} as Record<ChainId, string>);

export const network = new NetworkConnector({
    urls: networkUrls,
    defaultChainId: defaultChainId,
});

let networkLibrary: Web3Provider | undefined;
export function getNetworkLibrary(): Web3Provider {
    return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any));
}

export const injected = new InjectedConnector({
    supportedChainIds: Object.keys(ChainId)
        .map((x) => parseInt(x))
        .filter((x) => !isNaN(x)),
});

// mainnet only
export const walletconnect = new WalletConnectConnector({
    rpc: { [ChainId.MAINNET]: networkUrls[ChainId.MAINNET] },
    bridge: "https://bridge.walletconnect.org",
    qrcode: true,
});

// mainnet only
export const walletlink = new WalletLinkConnector({
    url: networkUrls[ChainId.MAINNET],
    appName: "DogeSwap",
    appLogoUrl:
        "https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg",
});
