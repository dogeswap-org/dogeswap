import dotenv from "dotenv";
import ethers from "ethers";
import fs from "fs/promises";
import yargs from "yargs/yargs";
import { deployExternalContracts } from "./deploy";

dotenv.config();

const run = async () => {
    const args = await yargs(process.argv.slice(2))
        .alias("c", "contracts")
        .describe("c", 'The comma-separated list of contracts to deploy, or "*" for all.')
        .alias("e", "erc20")
        .describe("e", "The comma-separated list of ERC-20 tokens to create")
        .string(["c", "e"]).argv;

    const contracts = args.c?.split(",") ?? [];
    const erc20 = args.e?.split(",") ?? [];

    const walletFile = process.env.WALLET;
    if (typeof walletFile !== "string") {
        console.error("WALLET not specified in .env");
        process.exit(1);
    }

    const walletPassword = process.env.WALLET_PASSWORD;
    if (typeof walletPassword !== "string") {
        console.error("WALLET_PASSWORD not specified in .env");
        process.exit(1);
    }

    const walletJson = await fs.readFile(walletFile, { encoding: "utf8" });
    const wallet = await ethers.Wallet.fromEncryptedJson(walletJson, walletPassword);
    await deployExternalContracts(undefined, contracts, erc20, wallet);
};

run();
