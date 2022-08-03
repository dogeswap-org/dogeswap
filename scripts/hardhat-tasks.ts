import { Wallet } from "ethers";
import fs from "fs/promises";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { promptPassword } from "./deploy-utils";

// const arrayify = (arg: any) =>
//     (arg as string)
//         .split(",")
//         .map((x) => x.trim())
//         .filter((x) => x != undefined && x !== "");

const getWallet = async (walletPath: string, hre: HardhatRuntimeEnvironment) => {
    const walletJson = await fs.readFile(walletPath, { encoding: "utf8" });
    let wallet: Wallet;
    const walletObject = JSON.parse(walletJson);
    if (typeof walletObject.owner === "object" && typeof walletObject.owner.privateKey === "string") {
        wallet = new hre.ethers.Wallet(walletObject.owner.privateKey);
    } else {
        const walletPassword = await promptPassword();
        wallet = await hre.ethers.Wallet.fromEncryptedJson(walletJson, walletPassword);
    }

    return wallet.connect(hre.ethers.provider);
};

task("deploy")
    .addOptionalParam(
        "contracts",
        'The comma-separated list of contracts to deploy, or "*" for all.',
        "*",
        types.string,
    )
    .addOptionalParam("erc20", "The comma-separated list of ERC-20 tokens to create.", "", types.string)
    .addOptionalParam(
        "factory",
        "The address to the factory contract, if it exists. If unspecified the factory contract will be created.",
        undefined,
        types.string,
    )
    .addParam("wallet", "The path to the encrypted JSON wallet file.", undefined, types.inputFile, false)
    .addOptionalParam(
        "wdc",
        "The address to the WDC contract, if it exists. If unpecified the WDC contract will be created.",
        undefined,
        types.string,
    )
    .setAction(
        async ({ contracts: _contractsString, erc20: _erc20String, factory: _, wallet: walletPath, wdc: __ }, hre) => {
            const wallet = await getWallet(walletPath, hre);
            console.log("SUCCESSFULLY RETRIEVED WALLET", await wallet.getAddress());
            return;
        },
    );
