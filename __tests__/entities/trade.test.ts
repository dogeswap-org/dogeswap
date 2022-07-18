import { Pair } from '../../src/entities/pair'
import { Route } from '../../src/entities/route'
import { Trade } from '../../src/entities/trade'
import JSBI from 'jsbi'
import { Token } from "../../../sdk-core/src/entities/token"
import { ChainId, TradeType } from "../../../sdk-core/src/constants"
import CurrencyAmount from "../../../sdk-core/src/entities/fractions/currencyAmount"
import Percent from "../../../sdk-core/src/entities/fractions/percent"
import { DOGECHAIN } from "../../../sdk-core/src/entities/ether"
import Price from "../../../sdk-core/src/entities/fractions/price"
import { testWDC } from "../testUtils"

describe('Trade', () => {
  const token0 = new Token(ChainId.LOCALNET, '0x0000000000000000000000000000000000000001', 18, 't0')
  const token1 = new Token(ChainId.LOCALNET, '0x0000000000000000000000000000000000000002', 18, 't1')
  const token2 = new Token(ChainId.LOCALNET, '0x0000000000000000000000000000000000000003', 18, 't2')
  const token3 = new Token(ChainId.LOCALNET, '0x0000000000000000000000000000000000000004', 18, 't3')

  const pair_0_1 = new Pair(
    new CurrencyAmount(token0, JSBI.BigInt(1000)),
    new CurrencyAmount(token1, JSBI.BigInt(1000))
  )
  const pair_0_2 = new Pair(
    new CurrencyAmount(token0, JSBI.BigInt(1000)),
    new CurrencyAmount(token2, JSBI.BigInt(1100))
  )
  const pair_0_3 = new Pair(new CurrencyAmount(token0, JSBI.BigInt(1000)), new CurrencyAmount(token3, JSBI.BigInt(900)))
  const pair_1_2 = new Pair(
    new CurrencyAmount(token1, JSBI.BigInt(1200)),
    new CurrencyAmount(token2, JSBI.BigInt(1000))
  )
  const pair_1_3 = new Pair(
    new CurrencyAmount(token1, JSBI.BigInt(1200)),
    new CurrencyAmount(token3, JSBI.BigInt(1300))
  )

  const pair_weth_0 = new Pair(
    new CurrencyAmount(testWDC, JSBI.BigInt(1000)),
    new CurrencyAmount(token0, JSBI.BigInt(1000))
  )

  const empty_pair_0_1 = new Pair(
    new CurrencyAmount(token0, JSBI.BigInt(0)),
    new CurrencyAmount(token1, JSBI.BigInt(0))
  )

  it('can be constructed with DOGECHAIN as input', () => {
    const trade = new Trade(
      new Route([pair_weth_0], testWDC, DOGECHAIN),
      CurrencyAmount.ether(JSBI.BigInt(100)),
      TradeType.EXACT_INPUT,
      testWDC
    )
    expect(trade.inputAmount.currency).toEqual(DOGECHAIN)
    expect(trade.outputAmount.currency).toEqual(token0)
  })
  it('can be constructed with DOGECHAIN as input for exact output', () => {
    const trade = new Trade(
      new Route([pair_weth_0], testWDC, DOGECHAIN, token0),
      new CurrencyAmount(token0, JSBI.BigInt(100)),
      TradeType.EXACT_OUTPUT,
      testWDC
    )
    expect(trade.inputAmount.currency).toEqual(DOGECHAIN)
    expect(trade.outputAmount.currency).toEqual(token0)
  })

  it('can be constructed with DOGECHAIN as output', () => {
    const trade = new Trade(
      new Route([pair_weth_0], testWDC, token0, DOGECHAIN),
      CurrencyAmount.ether(JSBI.BigInt(100)),
      TradeType.EXACT_OUTPUT,
      testWDC
    )
    expect(trade.inputAmount.currency).toEqual(token0)
    expect(trade.outputAmount.currency).toEqual(DOGECHAIN)
  })
  it('can be constructed with DOGECHAIN as output for exact input', () => {
    const trade = new Trade(
      new Route([pair_weth_0], testWDC, token0, DOGECHAIN),
      new CurrencyAmount(token0, JSBI.BigInt(100)),
      TradeType.EXACT_INPUT,
      testWDC,
    )
    expect(trade.inputAmount.currency).toEqual(token0)
    expect(trade.outputAmount.currency).toEqual(DOGECHAIN)
  })

  describe('#bestTradeExactIn', () => {
    it('throws with empty pairs', () => {
      expect(() => Trade.bestTradeExactIn([], new CurrencyAmount(token0, JSBI.BigInt(100)), token2, testWDC)).toThrow('PAIRS')
    })
    it('throws with max hops of 0', () => {
      expect(() =>
        Trade.bestTradeExactIn([pair_0_2], new CurrencyAmount(token0, JSBI.BigInt(100)), token2, testWDC, { maxHops: 0 })
      ).toThrow('MAX_HOPS')
    })

    it('provides best route', () => {
      const result = Trade.bestTradeExactIn(
        [pair_0_1, pair_0_2, pair_1_2],
        new CurrencyAmount(token0, JSBI.BigInt(100)),
        token2,
        testWDC
      )
      expect(result).toHaveLength(2)
      expect(result[0].route.pairs).toHaveLength(1) // 0 -> 2 at 10:11
      expect(result[0].route.path).toEqual([token0, token2])
      expect(result[0].inputAmount).toEqual(new CurrencyAmount(token0, JSBI.BigInt(100)))
      expect(result[0].outputAmount).toEqual(new CurrencyAmount(token2, JSBI.BigInt(99)))
      expect(result[1].route.pairs).toHaveLength(2) // 0 -> 1 -> 2 at 12:12:10
      expect(result[1].route.path).toEqual([token0, token1, token2])
      expect(result[1].inputAmount).toEqual(new CurrencyAmount(token0, JSBI.BigInt(100)))
      expect(result[1].outputAmount).toEqual(new CurrencyAmount(token2, JSBI.BigInt(69)))
    })

    it('doesnt throw for zero liquidity pairs', () => {
      expect(
        Trade.bestTradeExactIn([empty_pair_0_1], new CurrencyAmount(token0, JSBI.BigInt(100)), token1, testWDC)
      ).toHaveLength(0)
    })

    it('respects maxHops', () => {
      const result = Trade.bestTradeExactIn(
        [pair_0_1, pair_0_2, pair_1_2],
        new CurrencyAmount(token0, JSBI.BigInt(10)),
        token2,
        testWDC,
        { maxHops: 1 }
      )
      expect(result).toHaveLength(1)
      expect(result[0].route.pairs).toHaveLength(1) // 0 -> 2 at 10:11
      expect(result[0].route.path).toEqual([token0, token2])
    })

    it('insufficient input for one pair', () => {
      const result = Trade.bestTradeExactIn(
        [pair_0_1, pair_0_2, pair_1_2],
        new CurrencyAmount(token0, JSBI.BigInt(1)),
        token2,
        testWDC
      )
      expect(result).toHaveLength(1)
      expect(result[0].route.pairs).toHaveLength(1) // 0 -> 2 at 10:11
      expect(result[0].route.path).toEqual([token0, token2])
      expect(result[0].outputAmount).toEqual(new CurrencyAmount(token2, JSBI.BigInt(1)))
    })

    it('respects n', () => {
      const result = Trade.bestTradeExactIn(
        [pair_0_1, pair_0_2, pair_1_2],
        new CurrencyAmount(token0, JSBI.BigInt(10)),
        token2,
        testWDC,
        { maxNumResults: 1 }
      )

      expect(result).toHaveLength(1)
    })

    it('no path', () => {
      const result = Trade.bestTradeExactIn(
        [pair_0_1, pair_0_3, pair_1_3],
        new CurrencyAmount(token0, JSBI.BigInt(10)),
        token2,
        testWDC
      )
      expect(result).toHaveLength(0)
    })

    it('works for DOGECHAIN currency input', () => {
      const result = Trade.bestTradeExactIn(
        [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
        CurrencyAmount.ether(JSBI.BigInt(100)),
        token3,
        testWDC
      )
      expect(result).toHaveLength(2)
      expect(result[0].inputAmount.currency).toEqual(DOGECHAIN)
      expect(result[0].route.path).toEqual([testWDC, token0, token1, token3])
      expect(result[0].outputAmount.currency).toEqual(token3)
      expect(result[1].inputAmount.currency).toEqual(DOGECHAIN)
      expect(result[1].route.path).toEqual([testWDC, token0, token3])
      expect(result[1].outputAmount.currency).toEqual(token3)
    })
    it('works for DOGECHAIN currency output', () => {
      const result = Trade.bestTradeExactIn(
        [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
        new CurrencyAmount(token3, JSBI.BigInt(100)),
        DOGECHAIN,
        testWDC,
      )
      expect(result).toHaveLength(2)
      expect(result[0].inputAmount.currency).toEqual(token3)
      expect(result[0].route.path).toEqual([token3, token0, testWDC])
      expect(result[0].outputAmount.currency).toEqual(DOGECHAIN)
      expect(result[1].inputAmount.currency).toEqual(token3)
      expect(result[1].route.path).toEqual([token3, token1, token0, testWDC])
      expect(result[1].outputAmount.currency).toEqual(DOGECHAIN)
    })
  })

  describe('#maximumAmountIn', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = new Trade(
        new Route([pair_0_1, pair_1_2], testWDC, token0),
        new CurrencyAmount(token0, JSBI.BigInt(100)),
        TradeType.EXACT_INPUT,
        testWDC
      )
      it('throws if less than 0', () => {
        expect(() => exactIn.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        )
      })
      it('returns exact if 0', () => {
        expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn.inputAmount)
      })
      it('returns exact if nonzero', () => {
        expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token0, JSBI.BigInt(100))
        )
        expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token0, JSBI.BigInt(100))
        )
        expect(exactIn.maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token0, JSBI.BigInt(100))
        )
      })
    })
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = new Trade(
        new Route([pair_0_1, pair_1_2], testWDC, token0),
        new CurrencyAmount(token2, JSBI.BigInt(100)),
        TradeType.EXACT_OUTPUT,
        testWDC
      )

      it('throws if less than 0', () => {
        expect(() => exactOut.maximumAmountIn(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        )
      })
      it('returns exact if 0', () => {
        expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactOut.inputAmount)
      })
      it('returns slippage amount if nonzero', () => {
        expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token0, JSBI.BigInt(156))
        )
        expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token0, JSBI.BigInt(163))
        )
        expect(exactOut.maximumAmountIn(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token0, JSBI.BigInt(468))
        )
      })
    })
  })

  describe('#minimumAmountOut', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = new Trade(
        new Route([pair_0_1, pair_1_2], testWDC, token0),
        new CurrencyAmount(token0, JSBI.BigInt(100)),
        TradeType.EXACT_INPUT,
        testWDC
      )
      it('throws if less than 0', () => {
        expect(() => exactIn.minimumAmountOut(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        )
      })
      it('returns exact if 0', () => {
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactIn.outputAmount)
      })
      it('returns exact if nonzero', () => {
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token2, JSBI.BigInt(69))
        )
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token2, JSBI.BigInt(65))
        )
        expect(exactIn.minimumAmountOut(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token2, JSBI.BigInt(23))
        )
      })
    })
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = new Trade(
        new Route([pair_0_1, pair_1_2], testWDC, token0),
        new CurrencyAmount(token2, JSBI.BigInt(100)),
        TradeType.EXACT_OUTPUT,
        testWDC
      )

      it('throws if less than 0', () => {
        expect(() => exactOut.minimumAmountOut(new Percent(JSBI.BigInt(-1), JSBI.BigInt(100)))).toThrow(
          'SLIPPAGE_TOLERANCE'
        )
      })
      it('returns exact if 0', () => {
        expect(exactOut.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(exactOut.outputAmount)
      })
      it('returns slippage amount if nonzero', () => {
        expect(exactOut.minimumAmountOut(new Percent(JSBI.BigInt(0), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token2, JSBI.BigInt(100))
        )
        expect(exactOut.minimumAmountOut(new Percent(JSBI.BigInt(5), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token2, JSBI.BigInt(100))
        )
        expect(exactOut.minimumAmountOut(new Percent(JSBI.BigInt(200), JSBI.BigInt(100)))).toEqual(
          new CurrencyAmount(token2, JSBI.BigInt(100))
        )
      })
    })
  })

  describe('#worstExecutionPrice', () => {
    describe('tradeType = EXACT_INPUT', () => {
      const exactIn = new Trade(
        new Route([pair_0_1, pair_1_2], testWDC, token0),
        new CurrencyAmount(token0, 100),
        TradeType.EXACT_INPUT,
        testWDC
      )
      it('throws if less than 0', () => {
        expect(() => exactIn.minimumAmountOut(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
      })
      it('returns exact if 0', () => {
        expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(exactIn.executionPrice)
      })
      it('returns exact if nonzero', () => {
        expect(exactIn.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 100, 69))
        expect(exactIn.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 100, 65))
        expect(exactIn.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 100, 23))
      })
    })
    describe('tradeType = EXACT_OUTPUT', () => {
      const exactOut = new Trade(
        new Route([pair_0_1, pair_1_2], testWDC, token0),
        new CurrencyAmount(token2, 100),
        TradeType.EXACT_OUTPUT,
        testWDC
      )

      it('throws if less than 0', () => {
        expect(() => exactOut.worstExecutionPrice(new Percent(-1, 100))).toThrow('SLIPPAGE_TOLERANCE')
      })
      it('returns exact if 0', () => {
        expect(exactOut.worstExecutionPrice(new Percent(0, 100))).toEqual(exactOut.executionPrice)
      })
      it('returns slippage amount if nonzero', () => {
        expect(exactOut.worstExecutionPrice(new Percent(0, 100))).toEqual(new Price(token0, token2, 156, 100))
        expect(exactOut.worstExecutionPrice(new Percent(5, 100))).toEqual(new Price(token0, token2, 163, 100))
        expect(exactOut.worstExecutionPrice(new Percent(200, 100))).toEqual(new Price(token0, token2, 468, 100))
      })
    })
  })

  describe('#bestTradeExactOut', () => {
    it('throws with empty pairs', () => {
      expect(() => Trade.bestTradeExactOut([], token0, new CurrencyAmount(token2, JSBI.BigInt(100)), testWDC)).toThrow('PAIRS')
    })
    it('throws with max hops of 0', () => {
      expect(() =>
        Trade.bestTradeExactOut([pair_0_2], token0, new CurrencyAmount(token2, JSBI.BigInt(100)), testWDC, { maxHops: 0 })
      ).toThrow('MAX_HOPS')
    })

    it('provides best route', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        new CurrencyAmount(token2, JSBI.BigInt(100)),
        testWDC
      )
      expect(result).toHaveLength(2)
      expect(result[0].route.pairs).toHaveLength(1) // 0 -> 2 at 10:11
      expect(result[0].route.path).toEqual([token0, token2])
      expect(result[0].inputAmount).toEqual(new CurrencyAmount(token0, JSBI.BigInt(101)))
      expect(result[0].outputAmount).toEqual(new CurrencyAmount(token2, JSBI.BigInt(100)))
      expect(result[1].route.pairs).toHaveLength(2) // 0 -> 1 -> 2 at 12:12:10
      expect(result[1].route.path).toEqual([token0, token1, token2])
      expect(result[1].inputAmount).toEqual(new CurrencyAmount(token0, JSBI.BigInt(156)))
      expect(result[1].outputAmount).toEqual(new CurrencyAmount(token2, JSBI.BigInt(100)))
    })

    it('doesnt throw for zero liquidity pairs', () => {
      expect(
        Trade.bestTradeExactOut([empty_pair_0_1], token1, new CurrencyAmount(token1, JSBI.BigInt(100)), testWDC)
      ).toHaveLength(0)
    })

    it('respects maxHops', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        new CurrencyAmount(token2, JSBI.BigInt(10)),
        testWDC,
        { maxHops: 1 }
      )
      expect(result).toHaveLength(1)
      expect(result[0].route.pairs).toHaveLength(1) // 0 -> 2 at 10:11
      expect(result[0].route.path).toEqual([token0, token2])
    })

    it('insufficient liquidity', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        new CurrencyAmount(token2, JSBI.BigInt(1200)),
        testWDC
      )
      expect(result).toHaveLength(0)
    })

    it('insufficient liquidity in one pair but not the other', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        new CurrencyAmount(token2, JSBI.BigInt(1050)),
        testWDC
      )
      expect(result).toHaveLength(1)
    })

    it('respects n', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_2, pair_1_2],
        token0,
        new CurrencyAmount(token2, JSBI.BigInt(10)),
        testWDC,
        { maxNumResults: 1 }
      )

      expect(result).toHaveLength(1)
    })

    it('no path', () => {
      const result = Trade.bestTradeExactOut(
        [pair_0_1, pair_0_3, pair_1_3],
        token0,
        new CurrencyAmount(token2, JSBI.BigInt(10)),
        testWDC
      )
      expect(result).toHaveLength(0)
    })

    it('works for DOGECHAIN currency input', () => {
      const result = Trade.bestTradeExactOut(
        [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
        DOGECHAIN,
        new CurrencyAmount(token3, JSBI.BigInt(100)),
        testWDC
      )
      expect(result).toHaveLength(2)
      expect(result[0].inputAmount.currency).toEqual(DOGECHAIN)
      expect(result[0].route.path).toEqual([testWDC, token0, token1, token3])
      expect(result[0].outputAmount.currency).toEqual(token3)
      expect(result[1].inputAmount.currency).toEqual(DOGECHAIN)
      expect(result[1].route.path).toEqual([testWDC, token0, token3])
      expect(result[1].outputAmount.currency).toEqual(token3)
    })
    it('works for DOGECHAIN currency output', () => {
      const result = Trade.bestTradeExactOut(
        [pair_weth_0, pair_0_1, pair_0_3, pair_1_3],
        token3,
        CurrencyAmount.ether(JSBI.BigInt(100)),
        testWDC
      )
      expect(result).toHaveLength(2)
      expect(result[0].inputAmount.currency).toEqual(token3)
      expect(result[0].route.path).toEqual([token3, token0, testWDC])
      expect(result[0].outputAmount.currency).toEqual(DOGECHAIN)
      expect(result[1].inputAmount.currency).toEqual(token3)
      expect(result[1].route.path).toEqual([token3, token1, token0, testWDC])
      expect(result[1].outputAmount.currency).toEqual(DOGECHAIN)
    })
  })
})
