import { ChainId } from "@dogeswap/sdk-core";
import { JsonRpcProvider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { Contract } from "ethers";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { multicallAbi } from "../../constants/abis";
import { multicall } from "../../constants/addresses";
import { chains } from "../../constants/chains";
import { defaultChainId as envChainId } from "../../env";
import { useBlockNumber } from "../../state/application/hooks";
import ApplicationUpdater from "../../state/application/updater";
import ListsUpdater from "../../state/lists/updater";
import { MulticallUpdater } from "../../state/multicall/updater";
import TransactionUpdater from "../../state/transactions/updater";
import UserUpdater from "../../state/user/updater";

export const UpdaterProvider = (props: PropsWithChildren<{}>) => {
    // TODO DOGESWAP: we'll probably want to handle changing chain IDs at some point, at which time this will need refactoring.
    const chainId = useWeb3React().chainId ?? envChainId;
    const [providerBlockNumber, setProviderBlockNumber] = useState<number>();
    const [contract, setContract] = useState<Contract>();
    useEffect(() => {
        (async () => {
            const chain = chains[chainId as ChainId];
            const provider = new JsonRpcProvider(chain.urls[0], { chainId, name: chain.name });
            setProviderBlockNumber(await provider.getBlockNumber());
            setContract(new Contract(multicall[chainId as ChainId], multicallAbi, provider));
        })();
    }, []);

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
