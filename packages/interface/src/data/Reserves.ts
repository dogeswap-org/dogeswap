import { Interface } from "@ethersproject/abi";
import { useMemo } from "react";
import { abi as IUniswapV2PairABI } from "../../../contracts-core/artifacts/contracts/interfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json";
import { useActiveWeb3React } from "../hooks";

import { Currency } from "../../../sdk-core/src/entities/currency";
import CurrencyAmount from "../../../sdk-core/src/entities/fractions/currencyAmount";
import { Pair } from "../../../v2-sdk/src/entities/pair";
import { factory } from "../constants/addresses";
import { useMultipleContractSingleData } from "../hooks/Multicall";
import { wrappedCurrency } from "../utils/wrappedCurrency";

const PAIR_INTERFACE = new Interface(IUniswapV2PairABI);

export enum PairState {
    LOADING,
    NOT_EXISTS,
    EXISTS,
    INVALID,
}

export function usePairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
    const { chainId } = useActiveWeb3React();

    const tokens = useMemo(
        () =>
            currencies.map(([currencyA, currencyB]) => [
                wrappedCurrency(currencyA, chainId),
                wrappedCurrency(currencyB, chainId),
            ]),
        [chainId, currencies],
    );

    const pairAddresses = useMemo(
        () =>
            tokens.map(([tokenA, tokenB]) => {
                return tokenA && tokenB && !tokenA.equals(tokenB)
                    ? Pair.getAddress(tokenA, tokenB, factory[chainId!])
                    : undefined;
            }),
        [tokens, chainId],
    );

    const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, "getReserves");

    return useMemo(() => {
        return results.map((result, i) => {
            const { result: reserves, loading } = result;
            const tokenA = tokens[i][0];
            const tokenB = tokens[i][1];

            if (loading) return [PairState.LOADING, null];
            if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null];
            if (!reserves) return [PairState.NOT_EXISTS, null];
            const { reserve0, reserve1 } = reserves;
            const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
            return [
                PairState.EXISTS,
                new Pair(
                    new CurrencyAmount(token0, reserve0.toString()),
                    new CurrencyAmount(token1, reserve1.toString()),
                    factory[chainId!],
                ),
            ];
        });
    }, [results, tokens, chainId]);
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
    return usePairs([[tokenA, tokenB]])[0];
}
