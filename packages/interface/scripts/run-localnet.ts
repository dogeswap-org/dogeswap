import fsSync from "fs";
import fs from "fs/promises";
import { ethers } from "hardhat";
import path from "path";
import process from "process";
import { buildExternalContracts, deployExternalContracts } from "./deploy";

const erc20Tokens = ["DST", "USDT", "USDC", "DAI"];

const writeConfigFile = async (contractAddresses: Record<string, string>) => {
    const configPath = path.resolve(__dirname, "..", "config.json");
    let existingConfig = {};
    if (fsSync.existsSync(configPath)) {
        const existingConfigJson = await fs.readFile(configPath, { encoding: "utf8" });
        try {
            existingConfig = JSON.parse(existingConfigJson);
        } catch {
            console.log("Could not parse existing config.json. A new config file will be created.");
        }
    }

    const erc20EnvVariables = erc20Tokens.reduce((r, x) => {
        r[`${x.toLowerCase()}Address`] = contractAddresses[x];
        return r;
    }, {} as Record<string, string>);

    const data = {
        ...existingConfig,
        localnet: {
            factoryAddress: contractAddresses["UniswapV2Factory"],
            router02Address: contractAddresses["UniswapV2Router02"],
            multicallAddress: contractAddresses["UniswapInterfaceMulticall"],
            ...erc20EnvVariables,
            wdcAddress: contractAddresses["WDC"],
        },
    };

    await fs.writeFile(configPath, JSON.stringify(data, undefined, 4), { encoding: "utf-8" });
};

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
    const contractAddresses = await deployExternalContracts(signers[0], "*", erc20Tokens);
    await writeConfigFile(contractAddresses);
};

run();
