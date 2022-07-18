const assertDefined = (name: string) => {
    const value = process.env[name];
    if (value == undefined) {
        throw new Error(`${name} must be a defined environment variable`);
    }

    return value;
};

const CHAIN_ID = assertDefined("CHAIN_ID");
const NETWORK_URL = assertDefined("NETWORK_URL");
const FACTORY_ADDRESS = assertDefined("FACTORY_ADDRESS");
const ROUTER_01_ADDRESS = assertDefined("ROUTER_01_ADDRESS");
const ROUTER_02_ADDRESS = assertDefined("ROUTER_02_ADDRESS");
const WDC_ADDRESS = assertDefined("WDC_ADDRESS");
const DAI_ADDRESS = assertDefined("DAI_ADDRESS");
const USDT_ADDRESS = assertDefined("USDT_ADDRESS");
const USDC_ADDRESS = assertDefined("USDC_ADDRESS");

export const env = {
    CHAIN_ID: parseInt(CHAIN_ID),
    NETWORK_URL,
    FACTORY_ADDRESS,
    ROUTER_01_ADDRESS,
    ROUTER_02_ADDRESS,
    WDC_ADDRESS,
    DAI_ADDRESS,
    USDT_ADDRESS,
    USDC_ADDRESS,
};
