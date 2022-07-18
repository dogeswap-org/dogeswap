import childPromise from "child_process";
import { Contract } from "ethers/lib/ethers";
import fsSync from "fs";
import fs from "fs/promises";
import glob from "glob";
import { ethers } from "hardhat";
import { Artifact } from "hardhat/types";
import os from "os";
import path from "path";

const erc20Tokens = ["WDC", "DST", "USDT", "USDC", "DAI"];

const exec = (command: string, cwd: string) => {
    return new Promise<void>((res, rej) => {
        const proc = childPromise.exec(command, { cwd }, err => {
            if (err) {
                rej(err);
            } else {
                res();
            }
        });

        proc.stderr?.on("data", x => console.error(x));
        proc.stdout?.on("data", x => console.log(x));
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
        throw new Error(`Could not retrieve single contract artifact. Results: ${JSON.stringify(result)}`);
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
            x =>
                !x.endsWith(".dbg.json") &&
                !x.startsWith("interfaces") &&
                !x.startsWith("test") &&
                !x.startsWith("examples"),
        )
        .map(async x => {
            const fullPath = path.join(artifactsDir, x);
            return await parseArtifact(fullPath);
        });
};

const writeLocalEnvFile = async (contractAddresses: Record<string, string>) => {
    const envPath = path.resolve(__dirname, "..", ".env");
    let env: string;
    if (fsSync.existsSync(envPath)) {
        env = await fs.readFile(envPath, { encoding: "utf8" });
    } else {
        env = "";
    }

    const contractEnvVariables = {
        // TODO: Staking rewards?
        // USDT_STAKING_REWARD_ADDRESS=${contractAddresses["UniswapV2Factory"]}
        // DAI_STAKING_REWARD_ADDRESS=${contractAddresses["UniswapV2Factory"]}
        // USDC_STAKING_REWARD_ADDRESS=${contractAddresses["UniswapV2Factory"]}
        FACTORY_ADDRESS: contractAddresses["UniswapV2Factory"],
        ROUTER_01_ADDRESS: contractAddresses["UniswapV2Router01"],
        ROUTER_02_ADDRESS: contractAddresses["UniswapV2Router02"],
    };

    const erc20EnvVariables = erc20Tokens.reduce((r, x) => {
        r[`${x}_ADDRESS`] = contractAddresses[x];
        return r;
    }, {});

    const existingEnvVariables = env
        .split(os.EOL)
        .map(x => x.trim())
        .filter(x => x !== "")
        .map(x => {
            const indexOfEquals = x.indexOf("=");
            return [x.substring(0, indexOfEquals), x.substring(indexOfEquals + 1)];
        })
        .reduce((r, [key, value]) => {
            r[key] = value;
            return r;
        }, {});

    const data = Object.entries({ ...existingEnvVariables, ...contractEnvVariables, ...erc20EnvVariables }).reduce(
        (r, [key, value]) => `${r}${key}=${value}\n`,
        "",
    );

    await fs.writeFile(envPath, data, { encoding: "utf-8" });
};

const deployExternalContracts = async () => {
    const signers = await ethers.getSigners();
    const [owner] = signers;

    const erc20Artifact = await getContractArtifact("contracts-periphery", "**/ERC20.json");
    const wethArtifact = await getContractArtifact("contracts-periphery", "**/WDC9.json");
    const coreArtifacts = await getProjectContractArtifacts("contracts-core");
    const peripheryArtifacts = await getProjectContractArtifacts("contracts-periphery");
    const artifacts = [erc20Artifact, wethArtifact, ...coreArtifacts, ...peripheryArtifacts];

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
            case "UniswapV2Router01":
            case "UniswapV2Router02":
                await deployContract(addresses["UniswapV2Factory"], addresses["WDC9"]);
                break;
            case "SafeMath":
                if (didDeploySafeMath) {
                    continue;
                }

                await deployContract();
                didDeploySafeMath = true;
                break;
            case "UniswapV2Migrator":
            case "IUniswapV2Migrator":
                continue;
            default:
                await deployContract();
        }
    }

    return addresses;
};

const run = async () => {
    await buildExternalContracts();
    const contractAddresses = await deployExternalContracts();
    await writeLocalEnvFile(contractAddresses);
};

run();
