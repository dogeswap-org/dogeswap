import { ChainId } from "@dogeswap/sdk-core";
import { JsonRpcProvider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { Contract } from "ethers";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { getAddress } from "../../../common/addresses";
import { multicallAbi } from "../../constants/abis";
import { chains } from "../../constants/chains";
import { useBlockNumber } from "../../state/application/hooks";
import ApplicationUpdater from "../../state/application/updater";
import ListsUpdater from "../../state/lists/updater";
import { MulticallUpdater } from "../../state/multicall/updater";
import TransactionUpdater from "../../state/transactions/updater";
import UserUpdater from "../../state/user/updater";
import { defaultChainId as envChainId } from "../../utils/chainId";

export const UpdaterProvider = (props: PropsWithChildren<{}>) => {
    const chainId = useWeb3React().chainId ?? envChainId;
    const [providerBlockNumber, setProviderBlockNumber] = useState<number>();
    const [contract, setContract] = useState<Contract>();
    const multicall = getAddress("multicall", chainId);
    useEffect(() => {
        (async () => {
            if (multicall == undefined) {
                return undefined;
            }

            const chain = chains[chainId as ChainId];
            const provider = new JsonRpcProvider(chain.urls[0], { chainId, name: chain.name });
            setProviderBlockNumber(await provider.getBlockNumber());
            setContract(new Contract(multicall, multicallAbi, provider));
        })();
    }, [multicall]);

    const blockNumber = useBlockNumber() ?? providerBlockNumber;
    return blockNumber == undefined || contract == undefined ? (
        <></>
    ) : (
        <>
            <ListsUpdater />
            <UserUpdater />
            <ApplicationUpdater />
            <TransactionUpdater />
            <MulticallUpdater blockNumber={blockNumber} chainId={chainId} contract={contract} />
            {props.children}
        </>
    );
};
