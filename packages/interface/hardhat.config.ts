import "@nomicfoundation/hardhat-toolbox";

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
    solidity: "0.8.9",
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
        },
    },
    paths: {
        sources: "./localnet-contract-stubs",
    },
};

export default config;
