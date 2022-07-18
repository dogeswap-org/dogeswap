import type { BaseProvider } from "@ethersproject/providers";

declare global {
    interface Window {
        ethereum?: BaseProvider;
    }
}
