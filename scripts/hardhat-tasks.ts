import fs from "fs/promises";
import { task, types } from "hardhat/config";
import { deployExternalContracts, promptPassword } from "./deploy-utils";

const arrayify = (arg: any) =>
    (arg as string)
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x != undefined && x !== "");

task("deploy")
    .addOptionalParam(
        "contracts",
        'The comma-separated list of contracts to deploy, or "*" for all.',
        "*",
        types.string,
    )
    .addOptionalParam("erc20", "The comma-separated list of ERC-20 tokens to create.", "", types.string)
    .addParam("wallet", "The path to the encrypted JSON wallet file.", undefined, types.inputFile, false)
    .setAction(async ({ contracts: contractsString, erc20: erc20String, wallet: walletPath }, hre) => {
        const walletPassword = await promptPassword();
        const walletJson = await fs.readFile(walletPath, { encoding: "utf8" });
        const walletNoProvider = await hre.ethers.Wallet.fromEncryptedJson(walletJson, walletPassword);
        const wallet = walletNoProvider.connect(hre.ethers.provider);
        const contracts = contractsString === "*" ? contractsString : arrayify(contractsString);
        const erc20 = arrayify(erc20String);
        await deployExternalContracts(undefined, undefined, contracts, erc20, wallet, hre);
    });
