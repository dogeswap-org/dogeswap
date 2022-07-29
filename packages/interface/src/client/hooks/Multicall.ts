import { useWeb3React } from "@web3-react/core";
import { useBlockNumber } from "../state/application/hooks";
import { multicall } from "../utils/multicall";

type SingleCallParams = Parameters<typeof multicall["hooks"]["useSingleCallResult"]>;

export const useSingleCallResult = (
    contract: SingleCallParams[2],
    methodName: string,
    inputs?: SingleCallParams[4],
    options?: SingleCallParams[5],
) => {
    const { chainId } = useWeb3React();
    const blockNumber = useBlockNumber();
    return multicall.hooks.useSingleCallResult(chainId, blockNumber, contract, methodName, inputs, options);
};

type SingleMultipleParams = Parameters<typeof multicall["hooks"]["useSingleContractMultipleData"]>;

export const useSingleContractMultipleData = (
    contract: SingleMultipleParams[2],
    methodName: string,
    callInputs: SingleMultipleParams[4],
    options?: SingleMultipleParams[5],
) => {
    const { chainId } = useWeb3React();
    const blockNumber = useBlockNumber();
    return multicall.hooks.useSingleContractMultipleData(
        chainId,
        blockNumber,
        contract,
        methodName,
        callInputs,
        options,
    );
};

type MultipleSingleParams = Parameters<typeof multicall["hooks"]["useMultipleContractSingleData"]>;

export const useMultipleContractSingleData = (
    addresses: MultipleSingleParams[2],
    contractInterface: MultipleSingleParams[3],
    methodName: string,
    callInputs?: MultipleSingleParams[5],
    options?: MultipleSingleParams[6],
) => {
    const { chainId } = useWeb3React();
    const blockNumber = useBlockNumber();
    return multicall.hooks.useMultipleContractSingleData(
        chainId,
        blockNumber,
        addresses,
        contractInterface,
        methodName,
        callInputs,
        options,
    );
};

export const {
    useSingleContractWithCallData,
    useMultiChainMultiContractSingleData,
    useMultiChainSingleContractSingleData,
} = multicall.hooks;
