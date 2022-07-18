import { ChainId } from "../../../sdk-core/src/constants";
import { Token } from "../../../sdk-core/src/entities/token";
import { localnetConfig } from "../utils/localnet-config";

export const WDC = {
    [ChainId.MAINNET]: new Token(ChainId.MAINNET, localnetConfig.wdcAddress, 18, "WDC", "Wrapped Dogechain"),
    [ChainId.TESTNET]: new Token(ChainId.TESTNET, localnetConfig.wdcAddress, 18, "WDC", "Wrapped Dogechain"),
    [ChainId.LOCALNET]: new Token(ChainId.LOCALNET, localnetConfig.wdcAddress, 18, "WDC", "Wrapped Dogechain"),
};
