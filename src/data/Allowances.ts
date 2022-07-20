import { useMemo } from "react";
import { CurrencyAmount, Token } from "../../../sdk-core/src";
import { useSingleCallResult } from "../hooks/multicall";

import { useTokenContract } from "../hooks/useContract";

export function useTokenAllowance(token?: Token, owner?: string, spender?: string): CurrencyAmount | undefined {
    const contract = useTokenContract(token?.address, false);

    const inputs = useMemo(() => [owner, spender], [owner, spender]);
    const allowance = useSingleCallResult(contract, "allowance", inputs).result;

    return useMemo(
        () => (token && allowance ? new CurrencyAmount(token, allowance.toString()) : undefined),
        [token, allowance],
    );
}
