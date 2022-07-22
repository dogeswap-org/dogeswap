import "@nomicfoundation/hardhat-toolbox";

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
    solidity: "0.7.6",
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true
        }
    }
};

export default config;
