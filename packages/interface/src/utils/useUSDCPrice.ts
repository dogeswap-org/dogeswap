import { ChainId, Currency, currencyEquals, Price } from "@dogeswap/sdk-core";
import JSBI from "jsbi";
import { useMemo } from "react";
import { USDC, WDC } from "../constants/addresses";
import { PairState, usePairs } from "../data/Reserves";
import { useActiveWeb3React } from "../hooks";
import { wrappedCurrency } from "./wrappedCurrency";

/**
 * Returns the price in USDC of the input currency
 * @param currency currency to compute the USDC price of
 */
export default function useUSDCPrice(currency?: Currency): Price | undefined {
    const { chainId } = useActiveWeb3React();
    if (chainId == undefined) {
        return undefined;
    }

    const wrapped = wrappedCurrency(currency, chainId);
    const tokenPairs: [Currency | undefined, Currency | undefined][] = useMemo(
        () => [
            [wrapped && currencyEquals(WDC[chainId], wrapped) ? undefined : currency, WDC[chainId]],
            [
                wrapped?.equals(USDC[chainId]) ? undefined : wrapped,
                chainId === ChainId.MAINNET ? USDC[chainId] : undefined,
            ],
            [chainId ? WDC[chainId] : undefined, chainId === ChainId.MAINNET ? USDC[chainId] : undefined],
        ],
        [chainId, currency, wrapped],
    );
    const [[ethPairState, ethPair], [usdcPairState, usdcPair], [usdcEthPairState, usdcEthPair]] = usePairs(tokenPairs);

    return useMemo(() => {
        if (!currency || !wrapped || !chainId) {
            return undefined;
        }
        // handle wdc/eth
        if (wrapped.equals(WDC[chainId])) {
            if (usdcPair) {
                const price = usdcPair.priceOf(WDC[chainId]);
                return new Price(currency, USDC[chainId], price.denominator, price.numerator);
            } else {
                return undefined;
            }
        }
        // handle usdc
        if (wrapped.equals(USDC[chainId])) {
            return new Price(USDC[chainId], USDC[chainId], "1", "1");
        }

        const ethPairETHAmount = ethPair?.reserveOf(WDC[chainId]);
        const ethPairETHUSDCValue: JSBI =
            ethPairETHAmount && usdcEthPair
                ? usdcEthPair.priceOf(WDC[chainId]).quote(ethPairETHAmount).raw
                : JSBI.BigInt(0);

        // all other tokens
        // first try the usdc pair
        if (
            usdcPairState === PairState.EXISTS &&
            usdcPair &&
            usdcPair.reserveOf(USDC[chainId]).greaterThan(ethPairETHUSDCValue)
        ) {
            const price = usdcPair.priceOf(wrapped);
            return new Price(currency, USDC[chainId], price.denominator, price.numerator);
        }
        if (ethPairState === PairState.EXISTS && ethPair && usdcEthPairState === PairState.EXISTS && usdcEthPair) {
            if (
                usdcEthPair.reserveOf(USDC[chainId]).greaterThan("0") &&
                ethPair.reserveOf(WDC[chainId]).greaterThan("0")
            ) {
                const ethUsdcPrice = usdcEthPair.priceOf(USDC[chainId]);
                const currencyEthPrice = ethPair.priceOf(WDC[chainId]);
                const usdcPrice = ethUsdcPrice.multiply(currencyEthPrice).invert();
                return new Price(currency, USDC[chainId], usdcPrice.denominator, usdcPrice.numerator);
            }
        }
        return undefined;
    }, [chainId, currency, ethPair, ethPairState, usdcEthPair, usdcEthPairState, usdcPair, usdcPairState, wrapped]);
}
