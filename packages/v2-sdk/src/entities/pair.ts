import { getCreate2Address } from "@ethersproject/address";
import { keccak256, pack } from "@ethersproject/solidity";
import JSBI from "jsbi";
import invariant from "tiny-invariant";

import { BigintIsh, ChainId, CurrencyAmount, Price, sqrt, Token } from "@dogeswap/sdk-core";
import { FIVE, INIT_CODE_HASH, MINIMUM_LIQUIDITY, ONE, ZERO, _1000, _997 } from "../constants";
import { InsufficientInputAmountError, InsufficientReservesError } from "../errors";

export const computePairAddress = ({
    factoryAddress,
    tokenA,
    tokenB,
}: {
    factoryAddress: string;
    tokenA: Token;
    tokenB: Token;
}): string => {
    const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA]; // does safety checks
    return getCreate2Address(
        factoryAddress,
        keccak256(["bytes"], [pack(["address", "address"], [token0.address, token1.address])]),
        INIT_CODE_HASH,
    );
};
export class Pair {
    public readonly liquidityToken: Token;
    private readonly currencyAmounts: [CurrencyAmount, CurrencyAmount];

    public static getAddress(tokenA: Token, tokenB: Token, factoryAddress: string): string {
        return computePairAddress({ factoryAddress, tokenA, tokenB });
    }

    public constructor(currencyAmountA: CurrencyAmount, currencyAmountB: CurrencyAmount, factoryAddress: string) {
        invariant(currencyAmountA.currency.isToken && currencyAmountB.currency.isToken, "TOKEN");
        const currencyAmounts = currencyAmountA.currency.sortsBefore(currencyAmountB.currency) // does safety checks
            ? [currencyAmountA, currencyAmountB]
            : [currencyAmountB, currencyAmountA];
        invariant(currencyAmounts[0].currency.isToken && currencyAmounts[1].currency.isToken, "TOKEN");
        this.liquidityToken = new Token(
            currencyAmounts[0].currency.chainId,
            Pair.getAddress(currencyAmounts[0].currency, currencyAmounts[1].currency, factoryAddress),
            18,
            "DST-V2",
            "DogeSwap V2",
        );
        this.currencyAmounts = currencyAmounts as [CurrencyAmount, CurrencyAmount];
    }

    /**
     * Returns true if the token is either token0 or token1
     * @param token to check
     */
    public involvesToken(token: Token): boolean {
        return token.equals(this.token0) || token.equals(this.token1);
    }

    /**
     * Returns the current mid price of the pair in terms of token0, i.e. the ratio of reserve1 to reserve0
     */
    public get token0Price(): Price {
        return new Price(this.token0, this.token1, this.currencyAmounts[0].raw, this.currencyAmounts[1].raw);
    }

    /**
     * Returns the current mid price of the pair in terms of token1, i.e. the ratio of reserve0 to reserve1
     */
    public get token1Price(): Price {
        return new Price(this.token1, this.token0, this.currencyAmounts[1].raw, this.currencyAmounts[0].raw);
    }

    /**
     * Return the price of the given token in terms of the other token in the pair.
     * @param token token to return price of
     */
    public priceOf(token: Token): Price {
        invariant(this.involvesToken(token), "TOKEN");
        return token.equals(this.token0) ? this.token0Price : this.token1Price;
    }

    /**
     * Returns the chain ID of the tokens in the pair.
     */
    public get chainId(): ChainId | number {
        return this.token0.chainId;
    }

    public get token0(): Token {
        invariant(this.currencyAmounts[0].currency.isToken);
        return this.currencyAmounts[0].currency;
    }

    public get token1(): Token {
        invariant(this.currencyAmounts[1].currency.isToken);
        return this.currencyAmounts[1].currency;
    }

    public get reserve0(): CurrencyAmount {
        return this.currencyAmounts[0];
    }

    public get reserve1(): CurrencyAmount {
        return this.currencyAmounts[1];
    }

    public reserveOf(token: Token) {
        invariant(this.involvesToken(token), "TOKEN");
        return token.equals(this.token0) ? this.reserve0 : this.reserve1;
    }

    public getOutputAmount(inputAmount: CurrencyAmount, factoryAddress: string): [CurrencyAmount, Pair] {
        invariant(inputAmount.currency.isToken && this.involvesToken(inputAmount.currency), "TOKEN");
        if (JSBI.equal(this.reserve0.raw, ZERO) || JSBI.equal(this.reserve1.raw, ZERO)) {
            throw new InsufficientReservesError();
        }
        const inputReserve = this.reserveOf(inputAmount.currency);
        const outputReserve = this.reserveOf(inputAmount.currency.equals(this.token0) ? this.token1 : this.token0);
        const inputAmountWithFee = JSBI.multiply(inputAmount.raw, _997);
        const numerator = JSBI.multiply(inputAmountWithFee, outputReserve.raw);
        const denominator = JSBI.add(JSBI.multiply(inputReserve.raw, _1000), inputAmountWithFee);
        const outputAmount = new CurrencyAmount(
            inputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
            JSBI.divide(numerator, denominator),
        );
        if (JSBI.equal(outputAmount.raw, ZERO)) {
            throw new InsufficientInputAmountError();
        }

        return [
            outputAmount,
            new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount), factoryAddress),
        ];
    }

    public getInputAmount(outputAmount: CurrencyAmount, factoryAddress: string): [CurrencyAmount, Pair] {
        invariant(outputAmount.currency.isToken && this.involvesToken(outputAmount.currency), "TOKEN");
        if (
            JSBI.equal(this.reserve0.raw, ZERO) ||
            JSBI.equal(this.reserve1.raw, ZERO) ||
            JSBI.greaterThanOrEqual(outputAmount.raw, this.reserveOf(outputAmount.currency).raw)
        ) {
            throw new InsufficientReservesError();
        }

        const outputReserve = this.reserveOf(outputAmount.currency);
        const inputReserve = this.reserveOf(outputAmount.currency.equals(this.token0) ? this.token1 : this.token0);
        const numerator = JSBI.multiply(JSBI.multiply(inputReserve.raw, outputAmount.raw), _1000);
        const denominator = JSBI.multiply(JSBI.subtract(outputReserve.raw, outputAmount.raw), _997);
        const inputAmount = new CurrencyAmount(
            outputAmount.currency.equals(this.token0) ? this.token1 : this.token0,
            JSBI.add(JSBI.divide(numerator, denominator), ONE),
        );
        return [
            inputAmount,
            new Pair(inputReserve.add(inputAmount), outputReserve.subtract(outputAmount), factoryAddress),
        ];
    }

    public getLiquidityMinted(
        totalSupply: CurrencyAmount,
        currencyAmountA: CurrencyAmount,
        currencyAmountB: CurrencyAmount,
    ): CurrencyAmount {
        invariant(totalSupply.currency.isToken && totalSupply.currency.equals(this.liquidityToken), "LIQUIDITY");
        const currencyAmounts =
            currencyAmountA.currency.isToken &&
            currencyAmountB.currency.isToken &&
            currencyAmountA.currency.sortsBefore(currencyAmountB.currency) // does safety checks
                ? [currencyAmountA, currencyAmountB]
                : [currencyAmountB, currencyAmountA];
        invariant(currencyAmounts[0].currency.isToken && currencyAmounts[1].currency.isToken);
        invariant(
            currencyAmounts[0].currency.equals(this.token0) && currencyAmounts[1].currency.equals(this.token1),
            "TOKEN",
        );

        let liquidity: JSBI;
        if (JSBI.equal(totalSupply.raw, ZERO)) {
            liquidity = JSBI.subtract(
                sqrt(JSBI.multiply(currencyAmounts[0].raw, currencyAmounts[1].raw)),
                MINIMUM_LIQUIDITY,
            );
        } else {
            const amount0 = JSBI.divide(JSBI.multiply(currencyAmounts[0].raw, totalSupply.raw), this.reserve0.raw);
            const amount1 = JSBI.divide(JSBI.multiply(currencyAmounts[1].raw, totalSupply.raw), this.reserve1.raw);
            liquidity = JSBI.lessThanOrEqual(amount0, amount1) ? amount0 : amount1;
        }
        if (!JSBI.greaterThan(liquidity, ZERO)) {
            throw new InsufficientInputAmountError();
        }
        return new CurrencyAmount(this.liquidityToken, liquidity);
    }

    public getLiquidityValue(
        token: Token,
        totalSupply: CurrencyAmount,
        liquidity: CurrencyAmount,
        feeOn: boolean = false,
        kLast?: BigintIsh,
    ): CurrencyAmount {
        invariant(this.involvesToken(token), "TOKEN");
        invariant(totalSupply.currency.isToken && totalSupply.currency.equals(this.liquidityToken), "TOTAL_SUPPLY");
        invariant(liquidity.currency.isToken && liquidity.currency.equals(this.liquidityToken), "LIQUIDITY");
        invariant(JSBI.lessThanOrEqual(liquidity.raw, totalSupply.raw), "LIQUIDITY");

        let totalSupplyAdjusted: CurrencyAmount;
        if (!feeOn) {
            totalSupplyAdjusted = totalSupply;
        } else {
            invariant(!!kLast, "K_LAST");
            const kLastParsed = JSBI.BigInt(kLast);
            if (!JSBI.equal(kLastParsed, ZERO)) {
                const rootK = sqrt(JSBI.multiply(this.reserve0.raw, this.reserve1.raw));
                const rootKLast = sqrt(kLastParsed);
                if (JSBI.greaterThan(rootK, rootKLast)) {
                    const numerator = JSBI.multiply(totalSupply.raw, JSBI.subtract(rootK, rootKLast));
                    const denominator = JSBI.add(JSBI.multiply(rootK, FIVE), rootKLast);
                    const feeLiquidity = JSBI.divide(numerator, denominator);
                    totalSupplyAdjusted = totalSupply.add(new CurrencyAmount(this.liquidityToken, feeLiquidity));
                } else {
                    totalSupplyAdjusted = totalSupply;
                }
            } else {
                totalSupplyAdjusted = totalSupply;
            }
        }

        return new CurrencyAmount(
            token,
            JSBI.divide(JSBI.multiply(liquidity.raw, this.reserveOf(token).raw), totalSupplyAdjusted.raw),
        );
    }
}
