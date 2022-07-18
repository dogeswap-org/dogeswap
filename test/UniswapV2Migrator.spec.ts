import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { AddressZero, MaxUint256 } from 'ethers/constants'
import { bigNumberify } from 'ethers/utils'
import { solidity, MockProvider, createFixtureLoader } from 'ethereum-waffle'

import { v2Fixture } from './shared/fixtures'
import { expandTo18Decimals, MINIMUM_LIQUIDITY } from './shared/utilities'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999
}

describe('UniswapV2Migrator', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
  const [wallet] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet])

  let WDCPartner: Contract
  let WDCPair: Contract
  let router: Contract
  let migrator: Contract
  let WDCExchangeV1: Contract
  beforeEach(async function() {
    const fixture = await loadFixture(v2Fixture)
    WDCPartner = fixture.WDCPartner
    WDCPair = fixture.WDCPair
    router = fixture.router01 // we used router01 for this contract
    migrator = fixture.migrator
    WDCExchangeV1 = fixture.WDCExchangeV1
  })

  it('migrate', async () => {
    const WDCPartnerAmount = expandTo18Decimals(1)
    const ETHAmount = expandTo18Decimals(4)
    await WDCPartner.approve(WDCExchangeV1.address, MaxUint256)
    await WDCExchangeV1.addLiquidity(bigNumberify(1), WDCPartnerAmount, MaxUint256, {
      ...overrides,
      value: ETHAmount
    })
    await WDCExchangeV1.approve(migrator.address, MaxUint256)
    const expectedLiquidity = expandTo18Decimals(2)
    const WDCPairToken0 = await WDCPair.token0()
    await expect(
      migrator.migrate(WDCPartner.address, WDCPartnerAmount, ETHAmount, wallet.address, MaxUint256, overrides)
    )
      .to.emit(WDCPair, 'Transfer')
      .withArgs(AddressZero, AddressZero, MINIMUM_LIQUIDITY)
      .to.emit(WDCPair, 'Transfer')
      .withArgs(AddressZero, wallet.address, expectedLiquidity.sub(MINIMUM_LIQUIDITY))
      .to.emit(WDCPair, 'Sync')
      .withArgs(
        WDCPairToken0 === WDCPartner.address ? WDCPartnerAmount : ETHAmount,
        WDCPairToken0 === WDCPartner.address ? ETHAmount : WDCPartnerAmount
      )
      .to.emit(WDCPair, 'Mint')
      .withArgs(
        router.address,
        WDCPairToken0 === WDCPartner.address ? WDCPartnerAmount : ETHAmount,
        WDCPairToken0 === WDCPartner.address ? ETHAmount : WDCPartnerAmount
      )
    expect(await WDCPair.balanceOf(wallet.address)).to.eq(expectedLiquidity.sub(MINIMUM_LIQUIDITY))
  })
})
