import { ChainId, Currency, currencyEquals, Price } from "@dogeswap/sdk-core";
import JSBI from "jsbi";
import { useMemo } from "react";
import { getToken } from "../../common/tokens";
import { PairState, usePairs } from "../data/Reserves";
import { useActiveWeb3React } from "../hooks";
import { wrappedCurrency } from "./wrappedCurrency";

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price | undefined {
    const { chainId } = useActiveWeb3React();
    const wwdoge = useMemo(() => getToken("wwdoge", chainId), [chainId]);
    const usdc = useMemo(() => getToken("usdc", chainId), [chainId]);
    const wrapped = wrappedCurrency(currency, chainId);
    const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
        () =>
            wwdoge == undefined || usdc == undefined
                ? []
                : [
                      [wrapped && currencyEquals(wwdoge, wrapped) ? undefined : currency, wwdoge],
                      [wrapped?.equals(usdc) ? undefined : wrapped, chainId === ChainId.MAINNET ? usdc : undefined],
                      [chainId ? wwdoge : undefined, chainId === ChainId.MAINNET ? usdc : undefined],
                  ],
        [chainId, currency, wrapped],
    );
    const [[wdogePairState, wdogePair], [usdcPairState, usdcPair], [usdcWDOGEPairState, usdcWDOGEPair]] =
        usePairs(tokenPairs);

    return useMemo(() => {
        if (!currency || !wrapped || !chainId || wwdoge == undefined || usdc == undefined) {
            return undefined;
        }
        // handle wwdoge/wdoge
        if (wrapped.equals(wwdoge)) {
            if (usdcPair) {
                const price = usdcPair.priceOf(wwdoge);
                return new Price(currency, usdc, price.denominator, price.numerator);
            } else {
                return undefined;
            }
        }
        // handle usdc
        if (wrapped.equals(usdc)) {
            return new Price(usdc, usdc, "1", "1");
        }

        const wdogePairWDOGEAmount = wdogePair?.reserveOf(wwdoge);
        const wdogePairWDOGEUSDCValue: JSBI =
            wdogePairWDOGEAmount && usdcWDOGEPair
                ? usdcWDOGEPair.priceOf(wwdoge).quote(wdogePairWDOGEAmount).raw
                : JSBI.BigInt(0);

        // all other tokens
        // first try the usdc pair
        if (
            usdcPairState === PairState.EXISTS &&
            usdcPair &&
            usdcPair.reserveOf(usdc).greaterThan(wdogePairWDOGEUSDCValue)
        ) {
            const price = usdcPair.priceOf(wrapped);
            return new Price(currency, usdc, price.denominator, price.numerator);
        }
        if (
            wdogePairState === PairState.EXISTS &&
            wdogePair &&
            usdcWDOGEPairState === PairState.EXISTS &&
            usdcWDOGEPair
        ) {
            if (usdcWDOGEPair.reserveOf(usdc).greaterThan("0") && wdogePair.reserveOf(wwdoge).greaterThan("0")) {
                const wdogeUsdcPrice = usdcWDOGEPair.priceOf(usdc);
                const currencyWDOGEPrice = wdogePair.priceOf(wwdoge);
                const usdcPrice = wdogeUsdcPrice.multiply(currencyWDOGEPrice).invert();
                return new Price(currency, usdc, usdcPrice.denominator, usdcPrice.numerator);
            }
        }
        return undefined;
    }, [
        chainId,
        currency,
        wdogePair,
        wdogePairState,
        usdcWDOGEPair,
        usdcWDOGEPairState,
        usdcPair,
        usdcPairState,
        wrapped,
    ]);
}
