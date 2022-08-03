import { Interface } from "@ethersproject/abi";
import { useMemo } from "react";
import { abi as IDogeSwapV2PairABI } from "../../../../contracts-core/artifacts/contracts/interfaces/IDogeSwapV2Pair.sol/IDogeSwapV2Pair.json";
import { useActiveWeb3React } from "../hooks";

import { Currency, CurrencyAmount } from "@dogeswap/sdk-core";
import { Pair } from "@dogeswap/v2-sdk";
import { getAddress } from "../../common/addresses";
import { useMultipleContractSingleData } from "../hooks/Multicall";
import { wrappedCurrency } from "../utils/wrappedCurrency";

const PAIR_INTERFACE = new Interface(IDogeSwapV2PairABI);

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

    const pairAddresses = useMemo(() => {
        return tokens.map(([tokenA, tokenB]) => {
            const factory = getAddress("factory", chainId);
            return tokenA && tokenB && factory && !tokenA.equals(tokenB)
                ? Pair.getAddress(tokenA, tokenB, factory)
                : undefined;
        });
    }, [tokens, chainId]);

    const results = useMultipleContractSingleData(pairAddresses, PAIR_INTERFACE, "getReserves");

    return useMemo(() => {
        return results.map((result, i) => {
            const { result: reserves, loading } = result;
            const tokenA = tokens[i][0];
            const tokenB = tokens[i][1];
            const factory = getAddress("factory", chainId);

            if (loading || factory == undefined) return [PairState.LOADING, null];
            if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null];
            if (!reserves) return [PairState.NOT_EXISTS, null];
            const { reserve0, reserve1 } = reserves;
            const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
            return [
                PairState.EXISTS,
                new Pair(
                    new CurrencyAmount(token0, reserve0.toString()),
                    new CurrencyAmount(token1, reserve1.toString()),
                    factory,
                ),
            ];
        });
    }, [results, tokens, chainId]);
}

export function usePair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
    return usePairs([[tokenA, tokenB]])[0];
}
