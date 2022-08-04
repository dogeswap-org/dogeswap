import { Web3Provider } from "@ethersproject/providers";
import { deployContract } from "ethereum-waffle";
import { Contract, Wallet } from "ethers";

import { expandTo18Decimals } from "./utilities";

import UniswapV2Factory from "../../../contracts-core/artifacts/contracts/DogeSwapV2Factory.sol/DogeSwapV2Factory.json";
import IUniswapV2Pair from "../../../contracts-core/artifacts/contracts/DogeSwapV2Pair.sol/DogeSwapV2Pair.json";
import UniswapV2Router from "../../artifacts/contracts/DogeSwapV2Router.sol/DogeSwapV2Router.json";
import ERC20 from "../../artifacts/contracts/localnet/ERC20.sol/ERC20.json";
import WETH9 from "../../artifacts/contracts/localnet/WDC.sol/WDC.json";

const overrides = {
    gasLimit: 9999999,
};

interface V2Fixture {
    token0: Contract;
    token1: Contract;
    WETH: Contract;
    WETHPartner: Contract;
    factory: Contract;
    router: Contract;
    pair: Contract;
    WETHPair: Contract;
}

export async function v2Fixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<V2Fixture> {
    // deploy tokens
    const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)]);
    const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)]);
    const WETH = await deployContract(wallet, WETH9);
    const WETHPartner = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)]);

    // deploy V2
    const factory = await deployContract(wallet, UniswapV2Factory, [wallet.address]);

    const router = await deployContract(wallet, UniswapV2Router, [factory.address, WETH.address], overrides);

    // initialize V2
    await factory.createPair(tokenA.address, tokenB.address);
    const pairAddress = await factory.getPair(tokenA.address, tokenB.address);
    const pair = new Contract(pairAddress, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet);

    const token0Address = await pair.token0();
    const token0 = tokenA.address === token0Address ? tokenA : tokenB;
    const token1 = tokenA.address === token0Address ? tokenB : tokenA;

    await factory.createPair(WETH.address, WETHPartner.address);
    const WETHPairAddress = await factory.getPair(WETH.address, WETHPartner.address);
    const WETHPair = new Contract(WETHPairAddress, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet);

    return {
        token0,
        token1,
        WETH,
        WETHPartner,
        factory,
        router,
        pair,
        WETHPair,
    };
}
