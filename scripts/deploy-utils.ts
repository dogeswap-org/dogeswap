import childPromise from "child_process";
import { ethers, Signer } from "ethers";
import fs from "fs";
import glob from "glob";
import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";
import path from "path";
import process from "process";
import readline from "readline";
import { Writable } from "stream";

const parseArtifact = (path: string) => {
    const jsonString = fs.readFileSync(path, { encoding: "utf-8" });
    return JSON.parse(jsonString) as Artifact;
};

const getContractArtifactsDir = (project: string) =>
    path.resolve(__dirname, "..", "packages", project, "artifacts", "contracts");

const getGlob = (pattern: string, cwd: string) =>
    new Promise<string[]>((res, rej) => {
        glob(pattern, { cwd }, (err, matches) => {
            if (err) {
                rej(err);
            } else {
                res(matches);
            }
        });
    });

const exec = (command: string, cwd: string) => {
    return new Promise<void>((res, rej) => {
        const proc = childPromise.exec(command, { cwd }, (err) => {
            if (err) {
                rej(err);
            } else {
                res();
            }
        });

        proc.stderr?.on("data", (x) => console.error(x));
        proc.stdout?.on("data", (x) => console.log(x));
    });
};

export const buildExternalContracts = async () => {
    await exec("yarn build", path.join(__dirname, "..", "packages", "contracts-core"));
    await exec("yarn build", path.join(__dirname, "..", "packages", "contracts-periphery"));
};

const getProjectContractArtifacts = async (project: string) => {
    const artifactsDir = getContractArtifactsDir(project);
    const matches = await getGlob("**/*.json", artifactsDir);
    return matches
        .filter(
            (x) =>
                !x.endsWith(".dbg.json") &&
                !x.startsWith("interfaces") &&
                !x.startsWith("test") &&
                !x.startsWith("examples"),
        )
        .map((x) => {
            const fullPath = path.join(artifactsDir, x);
            return parseArtifact(fullPath);
        });
};

export const promptPassword = async () => {
    return new Promise<string>((res) => {
        let muted = false;

        const mutableStdout = new Writable({
            write: function (chunk, encoding, callback) {
                if (!muted) {
                    process.stdout.write(chunk, encoding);
                }

                callback();
            },
        });

        const rl = readline.createInterface({
            input: process.stdin,
            output: mutableStdout,
            terminal: true,
        });

        rl.question("Wallet password: ", function (password) {
            rl.close();
            console.log();
            res(password);
        });

        muted = true;
    });
};

export const deployExternalContracts = async (
    wwdogeAddress: string | undefined,
    factoryAddress: string | undefined,
    contracts: string[] | "*",
    erc20Tokens: string[],
    signer: Signer,
    hre: HardhatRuntimeEnvironment,
) => {
    const deploymentOrder = ["ERC20", "WWDOGE", "DogeSwapV2Factory", "DogeSwapV2Router", "DogeSwapInterfaceMulticall"];

    const [signerAddress, coreArtifacts, peripheryArtifacts] = await Promise.all([
        signer.getAddress(),
        getProjectContractArtifacts("contracts-core"),
        getProjectContractArtifacts("contracts-periphery"),
    ]);

    const allArtifacts = [...coreArtifacts, ...peripheryArtifacts];
    const deployArtifacts = deploymentOrder.map((x) => {
        const artifact = allArtifacts.find((y) => y.contractName === x);
        if (artifact == undefined) {
            console.error(`Could not find artifact for contract ${x}`);
            process.exit(1);
        }

        return artifact;
    });

    const addresses: Record<string, string> = {};

    for (const artifact of deployArtifacts) {
        if (contracts !== "*" && !contracts.includes(artifact.contractName)) {
            continue;
        }

        const deployContract = (...args: any[]) => deployNamedContract(artifact.contractName, ...args);

        const deployNamedContract = async (name: string, ...args: any[]) => {
            const contractFactory = await hre.ethers.getContractFactoryFromArtifact(artifact, signer);
            let contract: ethers.Contract;
            try {
                contract = await contractFactory.deploy(...args);
            } catch (e) {
                console.error(`Error deploying ${name}\n`, e);
                process.exit(1);
            }

            addresses[name] = contract.address;
            console.log(`Deployed ${name}`.padEnd(40), contract.address);
        };

        switch (artifact.contractName) {
            case "ERC20":
                for (const erc20Token of erc20Tokens) {
                    await deployNamedContract(erc20Token, erc20Token, erc20Token, ethers.utils.parseEther("1000000"));
                }
                break;
            case "WWDOGE":
                if (wwdogeAddress == undefined) {
                    console.log("WWDOGE address unspecified. Deploying.");
                    await deployContract();
                } else {
                    console.log("WWDOGE address specified. Skipping deployment.");
                }
                break;
            case "DogeSwapV2Factory":
                if (factoryAddress == undefined) {
                    console.log("Factory address unspecified. Deploying.");
                    await deployContract(signerAddress);
                } else {
                    console.log("Fatory address specified. Skipping deployment.");
                }
                break;
            case "DogeSwapV2Router":
                await deployContract(
                    factoryAddress ?? addresses["DogeSwapV2Factory"],
                    wwdogeAddress ?? addresses["WWDOGE"],
                );
                break;
            default:
                await deployContract();
        }
    }

    return addresses;
};
