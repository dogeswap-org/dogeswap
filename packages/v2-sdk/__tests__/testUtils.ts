import { ChainId } from "../../sdk-core/src/constants";
import { Token } from "../../sdk-core/src/entities/token";

export const testWDC = new Token(
    ChainId.LOCALNET,
    "0x1000000000000000000000000000000000000000",
    18,
    "WDC",
    "Wrapped Dogechain",
);
