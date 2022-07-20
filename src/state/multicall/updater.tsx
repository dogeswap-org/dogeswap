import { Contract } from "ethers";
import React from 'react';
import { ChainId } from "../../../../sdk-core/src";
import { multicall } from "../../utils/multicall";

// 500 was used in the previous implementation as a reasonable value to keep from exceeding the gas limit.
const blocksPerFetch = 500;
const listenerOptions = blocksPerFetch ? { blocksPerFetch } : undefined

export interface MulticallUpdaterProps {
  chainId: ChainId;
  blockNumber: number;
  contract: Contract;
}

export function MulticallUpdater({ chainId, blockNumber, contract }: MulticallUpdaterProps) {
  // TODO DOGECHAIN: We'll need a way to update this chain ID. Probably want to replace web3 react at some point.
  // const chainId = defaultChainId
  // const chain = chains[chainId as ChainId];
  // const provider = new JsonRpcProvider(chain.urls[0], { chainId, name: chain.name });
  // provider.getBlockNumber();



  return (
    <multicall.Updater
      chainId={chainId}
      latestBlockNumber={blockNumber}
      contract={contract}
      listenerOptions={listenerOptions}
    />
  )
}