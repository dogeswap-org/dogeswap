import { ChainId, CurrencyAmount, Token, TradeType } from "@dogeswap/sdk-core";
import { Pair, Route, Trade } from "@dogeswap/v2-sdk";
import JSBI from "jsbi";
import { computeTradePriceBreakdown } from "../../src/utils/prices";
import { testWWDOGE } from "../../src/utils/testUtils";

describe("prices", () => {
    const token1 = new Token(ChainId.MAINNET, "0x0000000000000000000000000000000000000001", 18, "");
    const token2 = new Token(ChainId.MAINNET, "0x0000000000000000000000000000000000000002", 18, "");
    const token3 = new Token(ChainId.MAINNET, "0x0000000000000000000000000000000000000003", 18, "");

    const pair12 = new Pair(
        new CurrencyAmount(token1, JSBI.BigInt(10000)),
        new CurrencyAmount(token2, JSBI.BigInt(20000)),
    );
    const pair23 = new Pair(
        new CurrencyAmount(token2, JSBI.BigInt(20000)),
        new CurrencyAmount(token3, JSBI.BigInt(30000)),
    );

    describe("computeTradePriceBreakdown", () => {
        it("returns undefined for undefined", () => {
            expect(computeTradePriceBreakdown(undefined)).toEqual({
                priceImpactWithoutFee: undefined,
                realizedLPFee: undefined,
            });
        });

        it("correct realized lp fee for single hop", () => {
            expect(
                computeTradePriceBreakdown(
                    new Trade(
                        new Route([pair12], testWWDOGE, token1),
                        new CurrencyAmount(token1, JSBI.BigInt(1000)),
                        TradeType.EXACT_INPUT,
                        testWWDOGE,
                    ),
                ).realizedLPFee,
            ).toEqual(new CurrencyAmount(token1, JSBI.BigInt(3)));
        });

        it("correct realized lp fee for double hop", () => {
            expect(
                computeTradePriceBreakdown(
                    new Trade(
                        new Route([pair12, pair23], testWWDOGE, token1),
                        new CurrencyAmount(token1, JSBI.BigInt(1000)),
                        TradeType.EXACT_INPUT,
                        testWWDOGE,
                    ),
                ).realizedLPFee,
            ).toEqual(new CurrencyAmount(token1, JSBI.BigInt(5)));
        });
    });
});
