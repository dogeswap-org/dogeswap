import _Big from "big.js";
import JSBI from "jsbi";
import invariant from "tiny-invariant";
import toFormat from "toformat";
import { currencyEquals } from "../../utils";
import { Currency } from "../currency";

import { BigintIsh, MaxUint256, Rounding } from "../../constants";
import { NativeToken } from "../NativeToken";
import Fraction from "./fraction";

const Big = toFormat(_Big);

export default class CurrencyAmount<T extends Currency = Currency> extends Fraction {
    public readonly currency: T;

    /**
     * Helper that calls the constructor with the NativeToken.Instance currency
     * @param amount Dogechain amount in wei
     */
    public static dogechain(amount: BigintIsh): CurrencyAmount {
        return new CurrencyAmount(NativeToken.Instance, amount);
    }

    // amount _must_ be raw, i.e. in the native representation
    public constructor(currency: T, amount: BigintIsh) {
        const parsedAmount = JSBI.BigInt(amount);
        invariant(JSBI.lessThanOrEqual(parsedAmount, MaxUint256), "AMOUNT");

        super(parsedAmount, JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(currency.decimals)));
        this.currency = currency;
    }

    public get raw(): JSBI {
        return this.numerator;
    }

    public override add(other: CurrencyAmount): CurrencyAmount {
        invariant(currencyEquals(this.currency, other.currency), "TOKEN");
        return new CurrencyAmount(this.currency, JSBI.add(this.raw, other.raw));
    }

    public override subtract(other: CurrencyAmount): CurrencyAmount {
        invariant(currencyEquals(this.currency, other.currency), "TOKEN");
        return new CurrencyAmount(this.currency, JSBI.subtract(this.raw, other.raw));
    }

    public override toSignificant(
        significantDigits: number = 6,
        format?: object,
        rounding: Rounding = Rounding.ROUND_DOWN,
    ): string {
        return super.toSignificant(significantDigits, format, rounding);
    }

    public override toFixed(
        decimalPlaces: number = this.currency.decimals,
        format?: object,
        rounding: Rounding = Rounding.ROUND_DOWN,
    ): string {
        invariant(decimalPlaces <= this.currency.decimals, "DECIMALS");
        return super.toFixed(decimalPlaces, format, rounding);
    }

    public toExact(format: object = { groupSeparator: "" }): string {
        Big.DP = this.currency.decimals;
        return (
            new Big(this.numerator.toString()).div(this.denominator.toString()) as unknown as ToFormattable
        ).toFormat(format);
    }
}
