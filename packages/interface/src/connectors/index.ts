import { Web3Provider } from "@ethersproject/providers";
import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";

import { ChainId } from "@dogeswap/sdk-core";
import { chainId } from "../env";
import { NetworkConnector } from "./NetworkConnector";

const networkUrls = {
    [ChainId.MAINNET]: "http://localhost:8545",
    [ChainId.TESTNET]: "http://localhost:8545",
    [ChainId.LOCALNET]: "http://localhost:8545",
};

export const network = new NetworkConnector({
    urls: networkUrls,
    defaultChainId: chainId,
});

let networkLibrary: Web3Provider | undefined;
export function getNetworkLibrary(): Web3Provider {
    return (networkLibrary = networkLibrary ?? new Web3Provider(network.provider as any));
}

export const injected = new InjectedConnector({
    supportedChainIds: [31337],
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
    appName: "Uniswap",
    appLogoUrl:
        "https://mpng.pngfly.com/20181202/bex/kisspng-emoji-domain-unicorn-pin-badges-sticker-unicorn-tumblr-emoji-unicorn-iphoneemoji-5c046729264a77.5671679315437924251569.jpg",
});
