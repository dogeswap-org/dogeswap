import { ChainId } from "../../sdk-core/src/constants";
import { Token } from "../../sdk-core/src/entities/token";

export const testWDC = new Token(
    ChainId.LOCALNET,
    "0x1000000000000000000000000000000000000000",
    18,
    "WDC",
    "Wrapped Dogechain",
);

export const configureEnv = () => {
    let addressIndex = 0;
    const getAddress = () => `0x000000000000000000000000000000000000000${addressIndex}`;

    process.env.CHAIN_ID = ChainId.LOCALNET.toString();
    process.env.NETWORK_URL = "localhost:31773";
    process.env.FACTORY_ADDRESS = getAddress();
    process.env.ROUTER_01_ADDRESS = getAddress();
    process.env.ROUTER_02_ADDRESS = getAddress();
    process.env.WDC_ADDRESS = getAddress();
    process.env.DAI_ADDRESS = getAddress();
    process.env.USDT_ADDRESS = getAddress();
    process.env.USDC_ADDRESS = getAddress();
};
