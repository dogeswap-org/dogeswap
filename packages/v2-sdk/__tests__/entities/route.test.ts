import { ChainId, CurrencyAmount, DOGECHAIN, Token } from "@dogeswap/sdk-core";
import { Pair } from "../../src/entities/pair";
import { Route } from "../../src/entities/route";
import { testWDC } from "../testUtils";

describe("Route", () => {
    const token0 = new Token(ChainId.LOCALNET, "0x0000000000000000000000000000000000000001", 18, "t0");
    const token1 = new Token(ChainId.LOCALNET, "0x0000000000000000000000000000000000000002", 18, "t1");
    const pair_0_1 = new Pair(new CurrencyAmount(token0, "100"), new CurrencyAmount(token1, "200"));
    const pair_0_wdc = new Pair(new CurrencyAmount(token0, "100"), new CurrencyAmount(testWDC, "100"));
    const pair_1_wdc = new Pair(new CurrencyAmount(token1, "175"), new CurrencyAmount(testWDC, "100"));

    it("constructs a path from the tokens", () => {
        const route = new Route([pair_0_1], testWDC, token0);
        expect(route.pairs).toEqual([pair_0_1]);
        expect(route.path).toEqual([token0, token1]);
        expect(route.input).toEqual(token0);
        expect(route.output).toEqual(token1);
        expect(route.chainId).toEqual(ChainId.LOCALNET);
    });

    it("can have a token as both input and output", () => {
        const route = new Route([pair_0_wdc, pair_0_1, pair_1_wdc], testWDC, testWDC);
        expect(route.pairs).toEqual([pair_0_wdc, pair_0_1, pair_1_wdc]);
        expect(route.input).toEqual(testWDC);
        expect(route.output).toEqual(testWDC);
    });

    it("supports ether input", () => {
        const route = new Route([pair_0_wdc], testWDC, DOGECHAIN);
        expect(route.pairs).toEqual([pair_0_wdc]);
        expect(route.input).toEqual(DOGECHAIN);
        expect(route.output).toEqual(token0);
    });

    it("supports ether output", () => {
        const route = new Route([pair_0_wdc], testWDC, token0, DOGECHAIN);
        expect(route.pairs).toEqual([pair_0_wdc]);
        expect(route.input).toEqual(token0);
        expect(route.output).toEqual(DOGECHAIN);
    });
});
