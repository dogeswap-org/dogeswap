import { ChainId, CurrencyAmount, NativeToken, Token } from "@dogeswap/sdk-core";
import { Pair } from "../../src/entities/pair";
import { Route } from "../../src/entities/route";
import { testWWDOGE } from "../testUtils";

const factoryAddress = "0x0000000000000000000000000000000000000000";

describe("Route", () => {
    const token0 = new Token(ChainId.LOCALNET, "0x0000000000000000000000000000000000000001", 18, "t0");
    const token1 = new Token(ChainId.LOCALNET, "0x0000000000000000000000000000000000000002", 18, "t1");
    const pair_0_1 = new Pair(new CurrencyAmount(token0, "100"), new CurrencyAmount(token1, "200"), factoryAddress);
    const pair_0_wwdoge = new Pair(
        new CurrencyAmount(token0, "100"),
        new CurrencyAmount(testWWDOGE, "100"),
        factoryAddress,
    );
    const pair_1_wwdoge = new Pair(
        new CurrencyAmount(token1, "175"),
        new CurrencyAmount(testWWDOGE, "100"),
        factoryAddress,
    );

    it("constructs a path from the tokens", () => {
        const route = new Route([pair_0_1], testWWDOGE, token0);
        expect(route.pairs).toEqual([pair_0_1]);
        expect(route.path).toEqual([token0, token1]);
        expect(route.input).toEqual(token0);
        expect(route.output).toEqual(token1);
        expect(route.chainId).toEqual(ChainId.LOCALNET);
    });

    it("can have a token as both input and output", () => {
        const route = new Route([pair_0_wwdoge, pair_0_1, pair_1_wwdoge], testWWDOGE, testWWDOGE);
        expect(route.pairs).toEqual([pair_0_wwdoge, pair_0_1, pair_1_wwdoge]);
        expect(route.input).toEqual(testWWDOGE);
        expect(route.output).toEqual(testWWDOGE);
    });

    it("supports ether input", () => {
        const route = new Route([pair_0_wwdoge], testWWDOGE, NativeToken.Instance);
        expect(route.pairs).toEqual([pair_0_wwdoge]);
        expect(route.input).toEqual(NativeToken.Instance);
        expect(route.output).toEqual(token0);
    });

    it("supports ether output", () => {
        const route = new Route([pair_0_wwdoge], testWWDOGE, token0, NativeToken.Instance);
        expect(route.pairs).toEqual([pair_0_wwdoge]);
        expect(route.input).toEqual(token0);
        expect(route.output).toEqual(NativeToken.Instance);
    });
});
