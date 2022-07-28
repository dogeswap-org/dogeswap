import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/config";
import "./scripts/hardhat-tasks";

const config: HardhatUserConfig = {
    solidity: "0.8.9",
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
        },
        testnet: {
            url: "http://localhost:8545",
            chainId: 31337,
        },
    },
};

export default config;
