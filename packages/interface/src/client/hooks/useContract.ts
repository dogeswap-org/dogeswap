import { Contract } from "@ethersproject/contracts";
import { useMemo } from "react";
import { getAddress } from "../../common/addresses";
import { getToken } from "../../common/tokens";
import { erc20Abi, iDogeSwapV2PairAbi, multicallAbi, wwdogeAbiChainMap } from "../constants/abis";
import { getContract } from "../utils";
import { useActiveWeb3React } from "./index";

// returns null on errors
function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
    const { library, account } = useActiveWeb3React();

    return useMemo(() => {
        if (!address || !ABI || !library) return null;
        try {
            return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined);
        } catch (error) {
            console.error("Failed to get contract", error);
            return null;
        }
    }, [address, ABI, library, withSignerIfPossible, account]);
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
    return useContract(tokenAddress, erc20Abi, withSignerIfPossible);
}

export function useWwdogeContract(withSignerIfPossible?: boolean): Contract | null {
    const { chainId } = useActiveWeb3React();
    const wrapped = getToken("wwdoge", chainId);
    const wwdogeAbi = chainId != undefined ? wwdogeAbiChainMap[chainId] : undefined;
    return useContract(chainId ? wrapped?.address : undefined, wwdogeAbi, withSignerIfPossible);
}

// TODO: If these ENS functions are ever needed, fill in the ABI/resolver ABI variables as well as the contract address.

export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
    const { chainId } = useActiveWeb3React();
    const address = getAddress("ensRegistrar", chainId);
    return useContract(address, "<ENS_ABI>", withSignerIfPossible);
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean): Contract | null {
    return useContract(address, "<ENS_PUBLIC_RESOLVER_ABI>", withSignerIfPossible);
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
    return useContract(pairAddress, iDogeSwapV2PairAbi, withSignerIfPossible);
}

export function useMulticallContract(): Contract | null {
    const { chainId } = useActiveWeb3React();
    const multicall = getAddress("multicall", chainId);
    return useContract(multicall, multicallAbi, false);
}
