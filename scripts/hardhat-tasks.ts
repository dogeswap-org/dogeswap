import fs from "fs/promises";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { deployExternalContracts, promptPassword } from "./deploy-utils";

const arrayify = (arg: any) =>
    (arg as string)
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x != undefined && x !== "");

const tryGetJsonWallet = async (walletPath: string, hre: HardhatRuntimeEnvironment) => {
    const walletJson = await fs.readFile(walletPath, { encoding: "utf8" });
    try {
        JSON.parse(walletJson);
    } catch {
        console.log("The wallet is not a JSON wallet. Attempting to load JS wallet...");
        return undefined;
    }

    const walletPassword = await promptPassword();
    return await hre.ethers.Wallet.fromEncryptedJson(walletJson, walletPassword);
};

const tryGetJsWallet = async (walletPath: string, hre: HardhatRuntimeEnvironment) => {
    try {
        const wallet = require(walletPath);
        if (typeof wallet.owner === "object" && typeof wallet.owner.privateKey === "string") {
            return new hre.ethers.Wallet(wallet.owner.privateKey);
        }
    } catch (e) {
        console.error("Could not load JS wallet", e);
    }

    return undefined;
};

const getWallet = async (walletPath: string, hre: HardhatRuntimeEnvironment) => {
    const wallet = (await tryGetJsonWallet(walletPath, hre)) ?? (await tryGetJsWallet(walletPath, hre));
    if (wallet == undefined) {
        console.error("Could not instantiate wallet");
        process.exit(1);
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
        "wwdoge",
        "The address to the WWDOGE contract, if it exists. If unpecified the WWDOGE contract will be created.",
        undefined,
        types.string,
    )
    .setAction(async ({ contracts: contractsString, erc20: erc20String, factory, wallet: walletPath, wwdoge }, hre) => {
        const wallet = await getWallet(walletPath, hre);
        const contracts = contractsString === "*" ? contractsString : arrayify(contractsString);
        const erc20 = arrayify(erc20String);
        await deployExternalContracts(wwdoge, factory, contracts, erc20, wallet, hre);
    });
