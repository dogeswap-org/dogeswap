import { Contract, Signer } from "ethers";
import { ethers } from "hardhat";

import { expandTo18Decimals } from "./utilities";

import { Artifact } from "hardhat/types";
import UniswapV2Factory from "../../../contracts-core/artifacts/contracts/DogeSwapV2Factory.sol/DogeSwapV2Factory.json";
import IUniswapV2Pair from "../../../contracts-core/artifacts/contracts/DogeSwapV2Pair.sol/DogeSwapV2Pair.json";

const overrides = {
    gasLimit: 9999999,
};

interface V2Fixture {
    token0: Contract;
    token1: Contract;
    WWDOGE: Contract;
    WWDOGEPartner: Contract;
    factory: Contract;
    router: Contract;
    pair: Contract;
    WWDOGEPair: Contract;
}

export const deployContract = async (name: string, signer: Signer, ...args: any[]) => {
    const factory = await ethers.getContractFactory(name, signer);
    return factory.deploy(...args);
};

export const deployContractFromArtifact = async (artifact: Artifact, signer: Signer, ...args: any[]) => {
    const factory = await ethers.getContractFactoryFromArtifact(artifact, signer);
    return factory.deploy(...args);
};

export async function fixture(): Promise<V2Fixture> {
    const [signer] = await ethers.getSigners();

    // deploy tokens
    const tokenA = await deployContract("ERC20", signer, "Token A", "A", expandTo18Decimals(10000));
    const tokenB = await deployContract("ERC20", signer, "Token B", "B", expandTo18Decimals(10000));
    const WWDOGE = await deployContract("WWDOGE", signer);
    const WWDOGEPartner = await deployContract("ERC20", signer, "WWDOGE Partner", "WWDOGEP", expandTo18Decimals(10000));

    // deploy V2
    const factory = await deployContractFromArtifact(UniswapV2Factory, signer, signer.address);
    const router = await deployContract("DogeSwapV2Router", signer, factory.address, WWDOGE.address, overrides);

    // initialize V2
    await factory.createPair(tokenA.address, tokenB.address);
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    const pair = new Contract(pairAddress, JSON.stringify(IUniswapV2Pair.abi), signer);

    const token0Address = await pair.token0();
    const token0 = tokenA.address === token0Address ? tokenA : tokenB;
    const token1 = tokenA.address === token0Address ? tokenB : tokenA;

    await factory.createPair(WWDOGE.address, WWDOGEPartner.address);
    const WWDOGEPairAddress = await factory.getPair(WWDOGE.address, WWDOGEPartner.address);
    const WWDOGEPair = new Contract(WWDOGEPairAddress, JSON.stringify(IUniswapV2Pair.abi), signer);

    return {
        token0,
        token1,
        WWDOGE,
        WWDOGEPartner,
        factory,
        router,
        pair,
        WWDOGEPair,
    };
}
