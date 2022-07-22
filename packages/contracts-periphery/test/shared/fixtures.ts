import { deployContract } from "ethereum-waffle";
import { Contract, Wallet } from "ethers";

import { expandTo18Decimals } from "./utilities";

import IUniswapV2Pair from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import UniswapV2Factory from "@uniswap/v2-core/build/UniswapV2Factory.json";

import { Web3Provider } from "@ethersproject/providers";
import RouterEventEmitter from "../../artifacts/contracts/test/RouterEventEmitter.sol/RouterEventEmitter.json";
import ERC20 from "../../artifacts/contracts/tokens/ERC20.sol/ERC20.json";
import WDC_ABI from "../../artifacts/contracts/tokens/WDC.sol/WDC.json";
import UniswapV2Router02 from "../../artifacts/contracts/UniswapV2Router02.sol/UniswapV2Router02.json";

const overrides = {
    gasLimit: 30000000,
};

interface V2Fixture {
    token0: Contract;
    token1: Contract;
    WDC: Contract;
    WDCPartner: Contract;
    factoryV2: Contract;
    routerEventEmitter: Contract;
    router: Contract;
    pair: Contract;
    WDCPair: Contract;
}

export async function v2Fixture([wallet]: Wallet[], provider: Web3Provider): Promise<V2Fixture> {
    // deploy tokens
    const tokenA = await deployContract(wallet, ERC20, ["Test Token", "TT", expandTo18Decimals(10000)], overrides);
    const tokenB = await deployContract(wallet, ERC20, ["Test Token", "TT", expandTo18Decimals(10000)], overrides);
    const WDC = await deployContract(wallet, WDC_ABI, undefined, overrides);
    const WDCPartner = await deployContract(wallet, ERC20, ["Test Token", "TT", expandTo18Decimals(10000)], overrides);

    // deploy V2
    const factoryV2 = await deployContract(wallet, UniswapV2Factory, [wallet.address], overrides);

    console.log("factoryV2")

    // deploy routers
    const router02 = await deployContract(wallet, UniswapV2Router02, [factoryV2.address, WDC.address], overrides);
    console.log("router02")

    // event emitter for testing
    const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [], overrides);
    console.log("routerEventEmitter")

    // initialize V2
    await factoryV2.createPair(tokenA.address, tokenB.address);
    console.log("factoryV2.createPair")
    const pairAddress = await factoryV2.getPair(tokenA.address, tokenB.address);
    console.log("pairAddress")
    const pair = new Contract(pairAddress, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet);

    console.log("pair")

    const token0Address = await pair.token0();
    const token0 = tokenA.address === token0Address ? tokenA : tokenB;
    const token1 = tokenA.address === token0Address ? tokenB : tokenA;

    await factoryV2.createPair(WDC.address, WDCPartner.address);
    const WDCPairAddress = await factoryV2.getPair(WDC.address, WDCPartner.address);
    const WDCPair = new Contract(WDCPairAddress, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet);

    return {
        token0,
        token1,
        WDC,
        WDCPartner,
        factoryV2,
        router: router02, // the default router, 01 had a minor bug
        routerEventEmitter,
        pair,
        WDCPair,
    };
}
