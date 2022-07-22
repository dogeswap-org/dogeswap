import { CurrencyAmount, Token } from "@dogeswap/sdk-core";
import { BigNumber } from "@ethersproject/bignumber";
import { useSingleCallResult } from "../hooks/Multicall";
import { useTokenContract } from "../hooks/useContract";

// returns undefined if input token is undefined, or fails to get token contract,
// or contract total supply cannot be fetched
export function useTotalSupply(token?: Token): CurrencyAmount | undefined {
    const contract = useTokenContract(token?.address, false);

    const totalSupply: BigNumber = useSingleCallResult(contract, "totalSupply")?.result?.[0];

    return token && totalSupply ? new CurrencyAmount(token, totalSupply.toString()) : undefined;
}
