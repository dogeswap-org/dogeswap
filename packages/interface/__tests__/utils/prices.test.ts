import JSBI from "jsbi";
import { ChainId, TradeType } from "../../../sdk-core/src/constants";
import CurrencyAmount from "../../../sdk-core/src/entities/fractions/currencyAmount";
import { Token } from "../../../sdk-core/src/entities/token";
import { Pair } from "../../../v2-sdk/src/entities/pair";
import { Route } from "../../../v2-sdk/src/entities/route";
import { Trade } from "../../../v2-sdk/src/entities/trade";
import { computeTradePriceBreakdown } from "../../src/utils/prices";
import { testWDC } from "../../src/utils/testUtils";

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
                        new Route([pair12], testWDC, token1),
                        new CurrencyAmount(token1, JSBI.BigInt(1000)),
                        TradeType.EXACT_INPUT,
                        testWDC,
                    ),
                ).realizedLPFee,
            ).toEqual(new CurrencyAmount(token1, JSBI.BigInt(3)));
        });

        it("correct realized lp fee for double hop", () => {
            expect(
                computeTradePriceBreakdown(
                    new Trade(
                        new Route([pair12, pair23], testWDC, token1),
                        new CurrencyAmount(token1, JSBI.BigInt(1000)),
                        TradeType.EXACT_INPUT,
                        testWDC,
                    ),
                ).realizedLPFee,
            ).toEqual(new CurrencyAmount(token1, JSBI.BigInt(5)));
        });
    });
});
