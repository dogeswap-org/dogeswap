import type { BaseProvider } from "@ethersproject/providers";

type Provider = BaseProvider & { isMetaMask?: boolean };

declare global {
    interface Window {
        ethereum?: Provider;
        web3?: Provider;
    }
}
