import { ChainId } from "@dogeswap/sdk-core";
import { Contract } from "ethers";
import React from "react";
import { multicall } from "../../utils/multicall";

export interface MulticallUpdaterProps {
    chainId: ChainId;
    blockNumber: number;
    contract: Contract;
}

export function MulticallUpdater({ chainId, blockNumber, contract }: MulticallUpdaterProps) {
    return (
        <multicall.Updater
            chainId={chainId}
            latestBlockNumber={blockNumber}
            contract={contract}
        />
    );
}
