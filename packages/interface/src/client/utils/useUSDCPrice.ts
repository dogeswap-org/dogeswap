import { ChainId, Currency, currencyEquals, Price } from "@dogeswap/sdk-core";
import JSBI from "jsbi";
import { useMemo } from "react";
import { getToken } from "../constants/tokens";
import { PairState, usePairs } from "../data/Reserves";
import { useActiveWeb3React } from "../hooks";
import { wrappedCurrency } from "./wrappedCurrency";

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price | undefined {
    const { chainId } = useActiveWeb3React();
    const wdc = useMemo(() => getToken("wdc", chainId), [chainId]);
    const usdc = useMemo(() => getToken("usdc", chainId), [chainId]);
    const wrapped = wrappedCurrency(currency, chainId);
    const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
        () =>
            wdc == undefined || usdc == undefined
                ? []
                : [
                      [wrapped && currencyEquals(wdc, wrapped) ? undefined : currency, wdc],
                      [wrapped?.equals(usdc) ? undefined : wrapped, chainId === ChainId.MAINNET ? usdc : undefined],
                      [chainId ? wdc : undefined, chainId === ChainId.MAINNET ? usdc : undefined],
                  ],
        [chainId, currency, wrapped],
    );
    const [[dcPairState, dcPair], [usdcPairState, usdcPair], [usdcDCPairState, usdcDCPair]] = usePairs(tokenPairs);

    return useMemo(() => {
        if (!currency || !wrapped || !chainId || wdc == undefined || usdc == undefined) {
            return undefined;
        }
        // handle wdc/dc
        if (wrapped.equals(wdc)) {
            if (usdcPair) {
                const price = usdcPair.priceOf(wdc);
                return new Price(currency, usdc, price.denominator, price.numerator);
            } else {
                return undefined;
            }
        }
        // handle usdc
        if (wrapped.equals(usdc)) {
            return new Price(usdc, usdc, "1", "1");
        }

        const dcPairDCAmount = dcPair?.reserveOf(wdc);
        const dcPairDCUSDCValue: JSBI =
            dcPairDCAmount && usdcDCPair ? usdcDCPair.priceOf(wdc).quote(dcPairDCAmount).raw : JSBI.BigInt(0);

        // all other tokens
        // first try the usdc pair
        if (usdcPairState === PairState.EXISTS && usdcPair && usdcPair.reserveOf(usdc).greaterThan(dcPairDCUSDCValue)) {
            const price = usdcPair.priceOf(wrapped);
            return new Price(currency, usdc, price.denominator, price.numerator);
        }
        if (dcPairState === PairState.EXISTS && dcPair && usdcDCPairState === PairState.EXISTS && usdcDCPair) {
            if (usdcDCPair.reserveOf(usdc).greaterThan("0") && dcPair.reserveOf(wdc).greaterThan("0")) {
                const dcUsdcPrice = usdcDCPair.priceOf(usdc);
                const currencyDCPrice = dcPair.priceOf(wdc);
                const usdcPrice = dcUsdcPrice.multiply(currencyDCPrice).invert();
                return new Price(currency, usdc, usdcPrice.denominator, usdcPrice.numerator);
            }
        }
        return undefined;
    }, [chainId, currency, dcPair, dcPairState, usdcDCPair, usdcDCPairState, usdcPair, usdcPairState, wrapped]);
}
