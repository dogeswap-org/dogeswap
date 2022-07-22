import { deployContract } from "ethereum-waffle";
import { Contract, Wallet } from "ethers";

import { expandTo18Decimals } from "./utilities";

import { Web3Provider } from "@ethersproject/providers";
import ERC20 from "../../artifacts/contracts/test/ERC20.sol/ERC20.json";
import UniswapV2Factory from "../../artifacts/contracts/UniswapV2Factory.sol/UniswapV2Factory.json";
import UniswapV2Pair from "../../artifacts/contracts/UniswapV2Pair.sol/UniswapV2Pair.json";

interface FactoryFixture {
    factory: Contract;
}

const overrides = {
    gasLimit: 9999999,
};

export async function factoryFixture([wallet]: Wallet[], _: Web3Provider): Promise<FactoryFixture> {
    const factory = await deployContract(wallet, UniswapV2Factory, [wallet.address], overrides);
    return { factory };
}

interface PairFixture extends FactoryFixture {
    token0: Contract;
    token1: Contract;
    pair: Contract;
}

export async function pairFixture([wallet]: Wallet[], provider: Web3Provider): Promise<PairFixture> {
    const { factory } = await factoryFixture([wallet], provider);

    const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides);
    const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides);

    await factory.createPair(tokenA.address, tokenB.address, overrides);
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    const pair = new Contract(pairAddress, JSON.stringify(UniswapV2Pair.abi), provider).connect(wallet);

    const token0Address = (await pair.token0()).address;
    const token0 = tokenA.address === token0Address ? tokenA : tokenB;
    const token1 = tokenA.address === token0Address ? tokenB : tokenA;

    return { factory, token0, token1, pair };
}
