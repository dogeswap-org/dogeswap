import childPromise from "child_process";
import { Contract } from "ethers/lib/ethers";
import fsSync from "fs";
import fs from "fs/promises";
import glob from "glob";
import { ethers } from "hardhat";
import { Artifact } from "hardhat/types";
import path from "path";

const erc20Tokens = ["DST", "USDT", "USDC", "DAI"];

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

const buildExternalContracts = async () => {
    await exec("yarn compile", path.join(__dirname, "..", "..", "contracts-core"));
    await exec("yarn compile", path.join(__dirname, "..", "..", "contracts-periphery"));
};

const parseArtifact = async (path: string) => {
    const jsonString = await fs.readFile(path, { encoding: "utf-8" });
    return JSON.parse(jsonString) as Artifact;
};

const getContractArtifactsDir = (project: string) =>
    path.join(__dirname, "..", "..", project, "artifacts", "contracts");

const getContractArtifact = async (project: string, globPattern: string) => {
    const dir = getContractArtifactsDir(project);
    const result = await getGlob(globPattern, dir);
    if (result.length !== 1) {
        throw new Error(
            `Could not retrieve single contract artifact. Project: ${project}. Pattern: ${globPattern}. Results: ${JSON.stringify(
                result,
            )}`,
        );
    }

    return parseArtifact(path.join(dir, result[0]));
};

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
        .map(async (x) => {
            const fullPath = path.join(artifactsDir, x);
            return await parseArtifact(fullPath);
        });
};

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
    }, {});

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

const deployExternalContracts = async () => {
    const signers = await ethers.getSigners();
    const [owner] = signers;

    const coreArtifacts = await getProjectContractArtifacts("contracts-core");
    const peripheryArtifacts = await getProjectContractArtifacts("contracts-periphery");
    const artifacts = [...coreArtifacts, ...peripheryArtifacts];

    const addresses: Record<string, string> = {};
    let didDeploySafeMath = false;

    for await (const artifact of artifacts) {
        const contractFactory = await ethers.getContractFactoryFromArtifact(artifact);

        const deployContract = (...args: any[]) => deployNamedContract(artifact.contractName, ...args);

        const deployNamedContract = async (name: string, ...args: any[]) => {
            let contract: Contract;
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
            case "UniswapV2Factory":
                await deployContract(owner.address);
                break;
            case "UniswapV2Router02":
                await deployContract(addresses["UniswapV2Factory"], addresses["WDC"]);
                break;
            case "SafeMath":
                if (didDeploySafeMath) {
                    continue;
                }

                await deployContract();
                didDeploySafeMath = true;
                break;
            default:
                await deployContract();
        }
    }

    return addresses;
};

const run = async () => {
    await buildExternalContracts();
    const contractAddresses = await deployExternalContracts();
    await writeConfigFile(contractAddresses);
};

run();
