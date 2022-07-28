import fs from "fs/promises";
import { task, types } from "hardhat/config";
import { deployExternalContracts, promptPassword } from "./deploy-utils";

task("deploy")
    .addOptionalParam(
        "contracts",
        'The comma-separated list of contracts to deploy, or "*" for all.',
        "*",
        types.string,
    )
    .addOptionalParam("erc20", "The comma-separated list of ERC-20 tokens to create.", "", types.string)
    .addParam("wallet", "The path to the encrypted JSON wallet file.", undefined, types.inputFile, false)
    .setAction(async ({ contracts, erc20, wallet: walletPath }, hre) => {
        const walletPassword = await promptPassword();
        const walletJson = await fs.readFile(walletPath, { encoding: "utf8" });
        const wallet = await hre.ethers.Wallet.fromEncryptedJson(walletJson, walletPassword);
        await deployExternalContracts(undefined, contracts, erc20, wallet, hre);
    });
