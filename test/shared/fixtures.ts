import { Wallet, Contract } from 'ethers'
import { Web3Provider } from 'ethers/providers'
import { deployContract } from 'ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import UniswapV2Factory from '@uniswap/v2-core/build/UniswapV2Factory.json'
import IUniswapV2Pair from '@uniswap/v2-core/build/IUniswapV2Pair.json'

import ERC20 from '../../build/ERC20.json'
import WDC from '../../build/WDC.json'
import UniswapV1Exchange from '../../build/UniswapV1Exchange.json'
import UniswapV1Factory from '../../build/UniswapV1Factory.json'
import UniswapV2Router02 from '../../build/UniswapV2Router02.json'
import RouterEventEmitter from '../../build/RouterEventEmitter.json'

const overrides = {
  gasLimit: 9999999
}

interface V2Fixture {
  token0: Contract
  token1: Contract
  WDC: Contract
  WDCPartner: Contract
  factoryV1: Contract
  factoryV2: Contract
  router02: Contract
  routerEventEmitter: Contract
  router: Contract
  WDCExchangeV1: Contract
  pair: Contract
  WDCPair: Contract
}

export async function v2Fixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<V2Fixture> {
  // deploy tokens
  const tokenA = await deployContract(wallet, ERC20, ["Test Token", "TT", expandTo18Decimals(10000)])
  const tokenB = await deployContract(wallet, ERC20, ["Test Token", "TT", expandTo18Decimals(10000)])
  const WDC = await deployContract(wallet, WDC)
  const WDCPartner = await deployContract(wallet, ERC20, ["Test Token", "TT", expandTo18Decimals(10000)])

  // deploy V1
  const factoryV1 = await deployContract(wallet, UniswapV1Factory, [])
  await factoryV1.initializeFactory((await deployContract(wallet, UniswapV1Exchange, [])).address)

  // deploy V2
  const factoryV2 = await deployContract(wallet, UniswapV2Factory, [wallet.address])

  // deploy routers
  const router02 = await deployContract(wallet, UniswapV2Router02, [factoryV2.address, WDC.address], overrides)

  // event emitter for testing
  const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [])

  // initialize V1
  await factoryV1.createExchange(WDCPartner.address, overrides)
  const WDCExchangeV1Address = await factoryV1.getExchange(WDCPartner.address)
  const WDCExchangeV1 = new Contract(WDCExchangeV1Address, JSON.stringify(UniswapV1Exchange.abi), provider).connect(
    wallet
  )

  // initialize V2
  await factoryV2.createPair(tokenA.address, tokenB.address)
  const pairAddress = await factoryV2.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet)

  const token0Address = await pair.token0()
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  await factoryV2.createPair(WDC.address, WDCPartner.address)
  const WDCPairAddress = await factoryV2.getPair(WDC.address, WDCPartner.address)
  const WDCPair = new Contract(WDCPairAddress, JSON.stringify(IUniswapV2Pair.abi), provider).connect(wallet)

  return {
    token0,
    token1,
    WDC,
    WDCPartner,
    factoryV1,
    factoryV2,
    router02,
    router: router02, // the default router, 01 had a minor bug
    routerEventEmitter,
    migrator,
    WDCExchangeV1,
    pair,
    WDCPair
  }
}
