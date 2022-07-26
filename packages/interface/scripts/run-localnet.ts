import { ethers } from "hardhat";
import process from "process";
import { buildExternalContracts, deployExternalContracts } from "./deploy";

const erc20Tokens = ["DST", "USDT", "USDC", "DAI"];

const waitMs = (ms: number) => {
    return new Promise<void>((res) => {
        setTimeout(() => res(), ms);
    });
};

const isNetworkReady = async () => {
    const provider = ethers.getDefaultProvider("http://localhost:8545");
    for (let i = 0; i < 10; i++) {
        try {
            await provider.getBlockNumber();
            return;
        } catch (e) {}

        await waitMs(1000);
    }

    console.error("Could not connect to localnet");
    process.exit(1);
};

const run = async () => {
    const [signers] = await Promise.all([ethers.getSigners(), buildExternalContracts(), isNetworkReady()]);
    await deployExternalContracts(signers[0], "*", erc20Tokens);
};

run();
