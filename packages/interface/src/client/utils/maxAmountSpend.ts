import { CurrencyAmount, NativeToken } from "@dogeswap/sdk-core";
import JSBI from "jsbi";
import { MIN_WDOGE } from "../constants";

/**
 * Given some token amount, return the max that can be spent of it
 * @param currencyAmount to return max of
 */
export function maxAmountSpend(currencyAmount?: CurrencyAmount): CurrencyAmount | undefined {
    if (!currencyAmount) return undefined;
    if (currencyAmount.currency === NativeToken.Instance) {
        if (JSBI.greaterThan(currencyAmount.raw, MIN_WDOGE)) {
            return CurrencyAmount.dogechain(JSBI.subtract(currencyAmount.raw, MIN_WDOGE));
        } else {
            return CurrencyAmount.dogechain(JSBI.BigInt(0));
        }
    }
    return currencyAmount;
}
