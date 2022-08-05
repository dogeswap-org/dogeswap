import { ChainId, CurrencyAmount, NativeToken, Percent, Token } from "@dogeswap/sdk-core";
import JSBI from "jsbi";
import invariant from "tiny-invariant";
import { Pair } from "../src/entities/pair";
import { Route } from "../src/entities/route";
import { Trade } from "../src/entities/trade";
import { Router } from "../src/router";
import { testWWDOGE } from "./testUtils";

function checkDeadline(deadline: string[] | string): void {
    expect(typeof deadline).toBe("string");
    invariant(typeof deadline === "string");
    // less than 5 seconds on the deadline
    expect(new Date().getTime() / 1000 - parseInt(deadline)).toBeLessThanOrEqual(5);
}

const factoryAddress = "0x0000000000000000000000000000000000000000";

describe("Router", () => {
    const token0 = new Token(ChainId.LOCALNET, "0x0000000000000000000000000000000000000001", 18, "t0");
    const token1 = new Token(ChainId.LOCALNET, "0x0000000000000000000000000000000000000002", 18, "t1");

    const pair_0_1 = new Pair(
        new CurrencyAmount(token0, JSBI.BigInt(1000)),
        new CurrencyAmount(token1, JSBI.BigInt(1000)),
        factoryAddress,
    );

    const pair_wwdoge_0 = new Pair(
        new CurrencyAmount(testWWDOGE, "1000"),
        new CurrencyAmount(token0, "1000"),
        factoryAddress,
    );

    describe("#swapCallParameters", () => {
        describe("exact in", () => {
            it("ether to token1", () => {
                const result = Router.swapCallParameters(
                    Trade.exactIn(
                        new Route([pair_wwdoge_0, pair_0_1], testWWDOGE, NativeToken.Instance, token1),
                        CurrencyAmount.dogechain(JSBI.BigInt(100)),
                        testWWDOGE,
                        factoryAddress,
                    ),
                    {
                        ttl: 50,
                        recipient: "0x0000000000000000000000000000000000000004",
                        allowedSlippage: new Percent("1", "100"),
                    },
                );
                expect(result.methodName).toEqual("swapExactWDOGEForTokens");
                expect(result.args.slice(0, -1)).toEqual([
                    "0x51",
                    [testWWDOGE.address, token0.address, token1.address],
                    "0x0000000000000000000000000000000000000004",
                ]);
                expect(result.value).toEqual("0x64");
                checkDeadline(result.args[result.args.length - 1]);
            });

            it("deadline specified", () => {
                const result = Router.swapCallParameters(
                    Trade.exactIn(
                        new Route([pair_wwdoge_0, pair_0_1], testWWDOGE, NativeToken.Instance, token1),
                        CurrencyAmount.dogechain(JSBI.BigInt(100)),
                        testWWDOGE,
                        factoryAddress,
                    ),
                    {
                        deadline: 50,
                        recipient: "0x0000000000000000000000000000000000000004",
                        allowedSlippage: new Percent("1", "100"),
                    },
                );
                expect(result.methodName).toEqual("swapExactWDOGEForTokens");
                expect(result.args).toEqual([
                    "0x51",
                    [testWWDOGE.address, token0.address, token1.address],
                    "0x0000000000000000000000000000000000000004",
                    "0x32",
                ]);
                expect(result.value).toEqual("0x64");
            });

            it("token1 to ether", () => {
                const result = Router.swapCallParameters(
                    Trade.exactIn(
                        new Route([pair_0_1, pair_wwdoge_0], testWWDOGE, token1, NativeToken.Instance),
                        new CurrencyAmount(token1, JSBI.BigInt(100)),
                        testWWDOGE,
                        factoryAddress,
                    ),
                    {
                        ttl: 50,
                        recipient: "0x0000000000000000000000000000000000000004",
                        allowedSlippage: new Percent("1", "100"),
                    },
                );
                expect(result.methodName).toEqual("swapExactTokensForWDOGE");
                expect(result.args.slice(0, -1)).toEqual([
                    "0x64",
                    "0x51",
                    [token1.address, token0.address, testWWDOGE.address],
                    "0x0000000000000000000000000000000000000004",
                ]);
                expect(result.value).toEqual("0x0");
                checkDeadline(result.args[result.args.length - 1]);
            });
            it("token0 to token1", () => {
                const result = Router.swapCallParameters(
                    Trade.exactIn(
                        new Route([pair_0_1], testWWDOGE, token0, token1),
                        new CurrencyAmount(token0, JSBI.BigInt(100)),
                        testWWDOGE,
                        factoryAddress,
                    ),
                    {
                        ttl: 50,
                        recipient: "0x0000000000000000000000000000000000000004",
                        allowedSlippage: new Percent("1", "100"),
                    },
                );
                expect(result.methodName).toEqual("swapExactTokensForTokens");
                expect(result.args.slice(0, -1)).toEqual([
                    "0x64",
                    "0x59",
                    [token0.address, token1.address],
                    "0x0000000000000000000000000000000000000004",
                ]);
                expect(result.value).toEqual("0x0");
                checkDeadline(result.args[result.args.length - 1]);
            });
        });
        describe("exact out", () => {
            it("ether to token1", () => {
                const result = Router.swapCallParameters(
                    Trade.exactOut(
                        new Route([pair_wwdoge_0, pair_0_1], testWWDOGE, NativeToken.Instance, token1),
                        new CurrencyAmount(token1, JSBI.BigInt(100)),
                        testWWDOGE,
                        factoryAddress,
                    ),
                    {
                        ttl: 50,
                        recipient: "0x0000000000000000000000000000000000000004",
                        allowedSlippage: new Percent("1", "100"),
                    },
                );
                expect(result.methodName).toEqual("swapWDOGEForExactTokens");
                expect(result.args.slice(0, -1)).toEqual([
                    "0x64",
                    [testWWDOGE.address, token0.address, token1.address],
                    "0x0000000000000000000000000000000000000004",
                ]);
                expect(result.value).toEqual("0x80");
                checkDeadline(result.args[result.args.length - 1]);
            });
            it("token1 to ether", () => {
                const result = Router.swapCallParameters(
                    Trade.exactOut(
                        new Route([pair_0_1, pair_wwdoge_0], testWWDOGE, token1, NativeToken.Instance),
                        CurrencyAmount.dogechain(JSBI.BigInt(100)),
                        testWWDOGE,
                        factoryAddress,
                    ),
                    {
                        ttl: 50,
                        recipient: "0x0000000000000000000000000000000000000004",
                        allowedSlippage: new Percent("1", "100"),
                    },
                );
                expect(result.methodName).toEqual("swapTokensForExactWDOGE");
                expect(result.args.slice(0, -1)).toEqual([
                    "0x64",
                    "0x80",
                    [token1.address, token0.address, testWWDOGE.address],
                    "0x0000000000000000000000000000000000000004",
                ]);
                expect(result.value).toEqual("0x0");
                checkDeadline(result.args[result.args.length - 1]);
            });
            it("token0 to token1", () => {
                const result = Router.swapCallParameters(
                    Trade.exactOut(
                        new Route([pair_0_1], testWWDOGE, token0, token1),
                        new CurrencyAmount(token1, JSBI.BigInt(100)),
                        testWWDOGE,
                        factoryAddress,
                    ),
                    {
                        ttl: 50,
                        recipient: "0x0000000000000000000000000000000000000004",
                        allowedSlippage: new Percent("1", "100"),
                    },
                );
                expect(result.methodName).toEqual("swapTokensForExactTokens");
                expect(result.args.slice(0, -1)).toEqual([
                    "0x64",
                    "0x71",
                    [token0.address, token1.address],
                    "0x0000000000000000000000000000000000000004",
                ]);
                expect(result.value).toEqual("0x0");
                checkDeadline(result.args[result.args.length - 1]);
            });
        });
        describe("supporting fee on transfer", () => {
            describe("exact in", () => {
                it("ether to token1", () => {
                    const result = Router.swapCallParameters(
                        Trade.exactIn(
                            new Route([pair_wwdoge_0, pair_0_1], testWWDOGE, NativeToken.Instance, token1),
                            CurrencyAmount.dogechain(JSBI.BigInt(100)),
                            testWWDOGE,
                            factoryAddress,
                        ),
                        {
                            ttl: 50,
                            recipient: "0x0000000000000000000000000000000000000004",
                            allowedSlippage: new Percent("1", "100"),
                            feeOnTransfer: true,
                        },
                    );
                    expect(result.methodName).toEqual("swapExactWDOGEForTokensSupportingFeeOnTransferTokens");
                    expect(result.args.slice(0, -1)).toEqual([
                        "0x51",
                        [testWWDOGE.address, token0.address, token1.address],
                        "0x0000000000000000000000000000000000000004",
                    ]);
                    expect(result.value).toEqual("0x64");
                    checkDeadline(result.args[result.args.length - 1]);
                });
                it("token1 to ether", () => {
                    const result = Router.swapCallParameters(
                        Trade.exactIn(
                            new Route([pair_0_1, pair_wwdoge_0], testWWDOGE, token1, NativeToken.Instance),
                            new CurrencyAmount(token1, JSBI.BigInt(100)),
                            testWWDOGE,
                            factoryAddress,
                        ),
                        {
                            ttl: 50,
                            recipient: "0x0000000000000000000000000000000000000004",
                            allowedSlippage: new Percent("1", "100"),
                            feeOnTransfer: true,
                        },
                    );
                    expect(result.methodName).toEqual("swapExactTokensForWDOGESupportingFeeOnTransferTokens");
                    expect(result.args.slice(0, -1)).toEqual([
                        "0x64",
                        "0x51",
                        [token1.address, token0.address, testWWDOGE.address],
                        "0x0000000000000000000000000000000000000004",
                    ]);
                    expect(result.value).toEqual("0x0");
                    checkDeadline(result.args[result.args.length - 1]);
                });
                it("token0 to token1", () => {
                    const result = Router.swapCallParameters(
                        Trade.exactIn(
                            new Route([pair_0_1], testWWDOGE, token0, token1),
                            new CurrencyAmount(token0, JSBI.BigInt(100)),
                            testWWDOGE,
                            factoryAddress,
                        ),
                        {
                            ttl: 50,
                            recipient: "0x0000000000000000000000000000000000000004",
                            allowedSlippage: new Percent("1", "100"),
                            feeOnTransfer: true,
                        },
                    );
                    expect(result.methodName).toEqual("swapExactTokensForTokensSupportingFeeOnTransferTokens");
                    expect(result.args.slice(0, -1)).toEqual([
                        "0x64",
                        "0x59",
                        [token0.address, token1.address],
                        "0x0000000000000000000000000000000000000004",
                    ]);
                    expect(result.value).toEqual("0x0");
                    checkDeadline(result.args[result.args.length - 1]);
                });
            });
            describe("exact out", () => {
                it("ether to token1", () => {
                    expect(() =>
                        Router.swapCallParameters(
                            Trade.exactOut(
                                new Route([pair_wwdoge_0, pair_0_1], testWWDOGE, NativeToken.Instance, token1),
                                new CurrencyAmount(token1, JSBI.BigInt(100)),
                                testWWDOGE,
                                factoryAddress,
                            ),
                            {
                                ttl: 50,
                                recipient: "0x0000000000000000000000000000000000000004",
                                allowedSlippage: new Percent("1", "100"),
                                feeOnTransfer: true,
                            },
                        ),
                    ).toThrow("EXACT_OUT_FOT");
                });
                it("token1 to ether", () => {
                    expect(() =>
                        Router.swapCallParameters(
                            Trade.exactOut(
                                new Route([pair_0_1, pair_wwdoge_0], testWWDOGE, token1, NativeToken.Instance),
                                CurrencyAmount.dogechain(JSBI.BigInt(100)),
                                testWWDOGE,
                                factoryAddress,
                            ),
                            {
                                ttl: 50,
                                recipient: "0x0000000000000000000000000000000000000004",
                                allowedSlippage: new Percent("1", "100"),
                                feeOnTransfer: true,
                            },
                        ),
                    ).toThrow("EXACT_OUT_FOT");
                });
                it("token0 to token1", () => {
                    expect(() =>
                        Router.swapCallParameters(
                            Trade.exactOut(
                                new Route([pair_0_1], testWWDOGE, token0, token1),
                                new CurrencyAmount(token1, JSBI.BigInt(100)),
                                testWWDOGE,
                                factoryAddress,
                            ),
                            {
                                ttl: 50,
                                recipient: "0x0000000000000000000000000000000000000004",
                                allowedSlippage: new Percent("1", "100"),
                                feeOnTransfer: true,
                            },
                        ),
                    ).toThrow("EXACT_OUT_FOT");
                });
            });
        });
    });
});
