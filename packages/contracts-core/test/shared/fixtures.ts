import { Contract } from "ethers";
import { ethers } from "hardhat";
import DogeSwapV2Pair from "../../artifacts/contracts/DogeSwapV2Pair.sol/DogeSwapV2Pair.json";
import { deployContract, expandTo18Decimals } from "./utilities";

interface FactoryFixture {
    factory: Contract;
}

interface FullFixture extends FactoryFixture {
    token0: Contract;
    token1: Contract;
    pair: Contract;
}

export async function factoryFixture(): Promise<FactoryFixture> {
    const [owner] = await ethers.getSigners();
    const factory = await deployContract("DogeSwapV2Factory", owner, owner.address);
    return { factory };
}

export async function fullFixture(): Promise<FullFixture> {
    const [owner] = await ethers.getSigners();

    const { factory } = await factoryFixture();

    const tokenA = await deployContract("ERC20", owner, expandTo18Decimals(10000));
    const tokenB = await deployContract("ERC20", owner, expandTo18Decimals(10000));

    await factory.createPair(tokenA.address, tokenB.address);
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    const pair = new Contract(pairAddress, JSON.stringify(DogeSwapV2Pair.abi), owner);

    const token0Address = (await pair.token0()).address;
    const token0 = tokenA.address === token0Address ? tokenA : tokenB;
    const token1 = tokenA.address === token0Address ? tokenB : tokenA;

    return { factory, token0, token1, pair };
}
