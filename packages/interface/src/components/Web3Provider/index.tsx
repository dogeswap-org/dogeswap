import { JsonRpcProvider } from "@ethersproject/providers";
import { Contract } from "ethers";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { ChainId } from "../../../../sdk-core/src";
import { multicallAbi } from "../../constants/abis";
import { multicall } from "../../constants/addresses";
import { chains } from "../../constants/chains";
import ApplicationUpdater from "../../state/application/updater";
import ListsUpdater from "../../state/lists/updater";
import { MulticallUpdater } from "../../state/multicall/updater";
import TransactionUpdater from "../../state/transactions/updater";
import UserUpdater from "../../state/user/updater";
import { defaultChainId } from "../../utils/config";

export const UpdaterProvider = (props: PropsWithChildren<{}>) => {
    // TODO DOGESWAP: we'll probably want to handle changing chain IDs at some point, at which time this will need refactoring.
    const chainId = defaultChainId;
    const [blockNumber, setBlockNumber] = useState<number>();
    const [contract, setContract] = useState<Contract>();
    useEffect(() => {
        (async () => {
            const chain = chains[chainId as ChainId];
            const provider = new JsonRpcProvider(chain.urls[0], { chainId: defaultChainId, name: chain.name });
            setBlockNumber(await provider.getBlockNumber());
            setContract(new Contract(multicall[chainId as ChainId], multicallAbi, provider));
        })();
    }, []);

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
