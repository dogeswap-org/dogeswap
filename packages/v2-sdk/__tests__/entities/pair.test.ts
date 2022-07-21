import { ChainId } from "../../../sdk-core/src/constants"
import CurrencyAmount from "../../../sdk-core/src/entities/fractions/currencyAmount"
import Price from "../../../sdk-core/src/entities/fractions/price"
import { Token } from "../../../sdk-core/src/entities/token"
import { currencyEquals } from "../../../sdk-core/src/utils/currencyEquals"
import { computePairAddress, Pair } from "../../src/entities/pair"
import { InsufficientInputAmountError } from "../../src/errors"
import { testWDC } from "../testUtils"

describe('computePairAddress', () => {
  it('should correctly compute the pool address', () => {
    const tokenA = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18, 'USDC', 'USD Coin')
    const tokenB = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'DAI Stablecoin')
    const result = computePairAddress({
      factoryAddress: '0x1111111111111111111111111111111111111111',
      tokenA,
      tokenB
    })

    expect(result).toEqual('0x29CA40173D60cD069798A476a246F9041004990a')
  })
  it('should give same result regardless of token order', () => {
    const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18, 'USDC', 'USD Coin')
    const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'DAI Stablecoin')
    let tokenA: Token = USDC
    let tokenB: Token = DAI
    const resultA = computePairAddress({
      factoryAddress: '0x1111111111111111111111111111111111111111',
      tokenA,
      tokenB
    })

    tokenA = DAI
    tokenB = USDC
    const resultB = computePairAddress({
      factoryAddress: '0x1111111111111111111111111111111111111111',
      tokenA,
      tokenB
    })

    expect(resultA).toEqual(resultB)
  })
})

describe('Pair', () => {
  const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18, 'USDC', 'USD Coin')
  const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'DAI Stablecoin')

  describe('constructor', () => {
    it('cannot be used for tokens on different chains', () => {
      expect(
        () => new Pair(new CurrencyAmount(USDC, '100'), new CurrencyAmount(testWDC, '100'))
      ).toThrow('CHAIN_IDS')
    })
  })

  describe('#getAddress', () => {
    it('returns the correct address', () => {
      expect(Pair.getAddress(USDC, DAI)).toEqual('0xE86Df7Fe4372baAeF5B7726D4E8320DfF7822ff8')
    })
  })

  describe('#token0', () => {
    it('always is the token that sorts before', () => {
      expect(new Pair(new CurrencyAmount(USDC, '100'), new CurrencyAmount(DAI, '100')).token0).toEqual(DAI)
      expect(new Pair(new CurrencyAmount(DAI, '100'), new CurrencyAmount(USDC, '100')).token0).toEqual(DAI)
    })
  })
  describe('#token1', () => {
    it('always is the token that sorts after', () => {
      expect(new Pair(new CurrencyAmount(USDC, '100'), new CurrencyAmount(DAI, '100')).token1).toEqual(USDC)
      expect(new Pair(new CurrencyAmount(DAI, '100'), new CurrencyAmount(USDC, '100')).token1).toEqual(USDC)
    })
  })
  describe('#reserve0', () => {
    it('always comes from the token that sorts before', () => {
      expect(new Pair(new CurrencyAmount(USDC, '100'), new CurrencyAmount(DAI, '101')).reserve0).toEqual(
        new CurrencyAmount(DAI, '101')
      )
      expect(new Pair(new CurrencyAmount(DAI, '101'), new CurrencyAmount(USDC, '100')).reserve0).toEqual(
        new CurrencyAmount(DAI, '101')
      )
    })
  })
  describe('#reserve1', () => {
    it('always comes from the token that sorts after', () => {
      expect(new Pair(new CurrencyAmount(USDC, '100'), new CurrencyAmount(DAI, '101')).reserve1).toEqual(
        new CurrencyAmount(USDC, '100')
      )
      expect(new Pair(new CurrencyAmount(DAI, '101'), new CurrencyAmount(USDC, '100')).reserve1).toEqual(
        new CurrencyAmount(USDC, '100')
      )
    })
  })

  describe('#token0Price', () => {
    it('returns price of token0 in terms of token1', () => {
      expect(new Pair(new CurrencyAmount(USDC, '101'), new CurrencyAmount(DAI, '100')).token0Price).toEqual(
        new Price(DAI, USDC, '100', '101')
      )
      expect(new Pair(new CurrencyAmount(DAI, '100'), new CurrencyAmount(USDC, '101')).token0Price).toEqual(
        new Price(DAI, USDC, '100', '101')
      )
    })
  })

  describe('#token1Price', () => {
    it('returns price of token1 in terms of token0', () => {
      expect(new Pair(new CurrencyAmount(USDC, '101'), new CurrencyAmount(DAI, '100')).token1Price).toEqual(
        new Price(USDC, DAI, '101', '100')
      )
      expect(new Pair(new CurrencyAmount(DAI, '100'), new CurrencyAmount(USDC, '101')).token1Price).toEqual(
        new Price(USDC, DAI, '101', '100')
      )
    })
  })

  describe('#priceOf', () => {
    const pair = new Pair(new CurrencyAmount(USDC, '101'), new CurrencyAmount(DAI, '100'))
    it('returns price of token in terms of other token', () => {
      expect(pair.priceOf(DAI)).toEqual(pair.token0Price)
      expect(pair.priceOf(USDC)).toEqual(pair.token1Price)
    })

    it('throws if invalid token', () => {
      expect(() => pair.priceOf(testWDC)).toThrow('TOKEN')
    })
  })

  describe('#reserveOf', () => {
    it('returns reserves of the given token', () => {
      expect(new Pair(new CurrencyAmount(USDC, '100'), new CurrencyAmount(DAI, '101')).reserveOf(USDC)).toEqual(
        new CurrencyAmount(USDC, '100')
      )
      expect(new Pair(new CurrencyAmount(DAI, '101'), new CurrencyAmount(USDC, '100')).reserveOf(USDC)).toEqual(
        new CurrencyAmount(USDC, '100')
      )
    })

    it('throws if not in the pair', () => {
      expect(() =>
        new Pair(new CurrencyAmount(DAI, '101'), new CurrencyAmount(USDC, '100')).reserveOf(testWDC)
      ).toThrow('TOKEN')
    })
  })

  describe('#chainId', () => {
    it('returns the token0 chainId', () => {
      expect(new Pair(new CurrencyAmount(USDC, '100'), new CurrencyAmount(DAI, '100')).chainId).toEqual(ChainId.MAINNET)
      expect(new Pair(new CurrencyAmount(DAI, '100'), new CurrencyAmount(USDC, '100')).chainId).toEqual(ChainId.MAINNET)
    })
  })
  describe('#involvesToken', () => {
    expect(new Pair(new CurrencyAmount(USDC, '100'), new CurrencyAmount(DAI, '100')).involvesToken(USDC)).toEqual(true)
    expect(new Pair(new CurrencyAmount(USDC, '100'), new CurrencyAmount(DAI, '100')).involvesToken(DAI)).toEqual(true)
    expect(
      new Pair(new CurrencyAmount(USDC, '100'), new CurrencyAmount(DAI, '100')).involvesToken(testWDC)
    ).toEqual(false)
  })
  describe('miscellaneous', () => {
    it('getLiquidityMinted:0', async () => {
      const tokenA = new Token(ChainId.TESTNET, '0x0000000000000000000000000000000000000001', 18, "")
      const tokenB = new Token(ChainId.TESTNET, '0x0000000000000000000000000000000000000002', 18, "")
      const pair = new Pair(new CurrencyAmount(tokenA, '0'), new CurrencyAmount(tokenB, '0'))

      expect(() => {
        pair.getLiquidityMinted(
          new CurrencyAmount(pair.liquidityToken, '0'),
          new CurrencyAmount(tokenA, '1000'),
          new CurrencyAmount(tokenB, '1000')
        )
      }).toThrow(InsufficientInputAmountError)

      expect(() => {
        pair.getLiquidityMinted(
          new CurrencyAmount(pair.liquidityToken, '0'),
          new CurrencyAmount(tokenA, '1000000'),
          new CurrencyAmount(tokenB, '1')
        )
      }).toThrow(InsufficientInputAmountError)

      const liquidity = pair.getLiquidityMinted(
        new CurrencyAmount(pair.liquidityToken, '0'),
        new CurrencyAmount(tokenA, '1001'),
        new CurrencyAmount(tokenB, '1001')
      )

      expect(liquidity.raw.toString()).toEqual('1')
    })

    it('getLiquidityMinted:!0', async () => {
      const tokenA = new Token(ChainId.TESTNET, '0x0000000000000000000000000000000000000001', 18, "")
      const tokenB = new Token(ChainId.TESTNET, '0x0000000000000000000000000000000000000002', 18, "")
      const pair = new Pair(new CurrencyAmount(tokenA, '10000'), new CurrencyAmount(tokenB, '10000'))

      expect(
        pair
          .getLiquidityMinted(
            new CurrencyAmount(pair.liquidityToken, '10000'),
            new CurrencyAmount(tokenA, '2000'),
            new CurrencyAmount(tokenB, '2000')
          )
          .raw.toString()
      ).toEqual('2000')
    })

    it('getLiquidityValue:!feeOn', async () => {
      const tokenA = new Token(ChainId.TESTNET, '0x0000000000000000000000000000000000000001', 18, "")
      const tokenB = new Token(ChainId.TESTNET, '0x0000000000000000000000000000000000000002', 18, "")
      const pair = new Pair(new CurrencyAmount(tokenA, '1000'), new CurrencyAmount(tokenB, '1000'))

      {
        const liquidityValue = pair.getLiquidityValue(
          tokenA,
          new CurrencyAmount(pair.liquidityToken, '1000'),
          new CurrencyAmount(pair.liquidityToken, '1000'),
          false
        )
        expect(currencyEquals(liquidityValue.currency, tokenA)).toBe(true)
        expect(liquidityValue.raw.toString()).toBe('1000')
      }

      // 500
      {
        const liquidityValue = pair.getLiquidityValue(
          tokenA,
          new CurrencyAmount(pair.liquidityToken, '1000'),
          new CurrencyAmount(pair.liquidityToken, '500'),
          false
        )
        expect(currencyEquals(liquidityValue.currency, tokenA)).toBe(true)
        expect(liquidityValue.raw.toString()).toBe('500')
      }

      // tokenB
      {
        const liquidityValue = pair.getLiquidityValue(
          tokenB,
          new CurrencyAmount(pair.liquidityToken, '1000'),
          new CurrencyAmount(pair.liquidityToken, '1000'),
          false
        )
        expect(currencyEquals(liquidityValue.currency, tokenB)).toBe(true)
        expect(liquidityValue.raw.toString()).toBe('1000')
      }
    })

    it('getLiquidityValue:feeOn', async () => {
      const tokenA = new Token(ChainId.TESTNET, '0x0000000000000000000000000000000000000001', 18, "")
      const tokenB = new Token(ChainId.TESTNET, '0x0000000000000000000000000000000000000002', 18, "")
      const pair = new Pair(new CurrencyAmount(tokenA, '1000'), new CurrencyAmount(tokenB, '1000'))

      const liquidityValue = pair.getLiquidityValue(
        tokenA,
        new CurrencyAmount(pair.liquidityToken, '500'),
        new CurrencyAmount(pair.liquidityToken, '500'),
        true,
        '250000' // 500 ** 2
      )
      expect(currencyEquals(liquidityValue.currency, tokenA)).toBe(true)
      expect(liquidityValue.raw.toString()).toBe('917') // ceiling(1000 - (500 * (1 / 6)))
    })
  })
})
