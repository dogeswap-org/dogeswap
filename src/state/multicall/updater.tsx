import { useWeb3React } from "@web3-react/core";
import React from 'react';
import { useMulticallContract } from "../../hooks/useContract";
import { multicall } from "../../utils/multicall";
import { useBlockNumber } from "../application/hooks";

// 500 was used in the previous implementation as a reasonable value to keep from exceeding the gas limit.
const blocksPerFetch = 500;

export function MulticallUpdater() {
  const { chainId } = useWeb3React();
  const blockNumber = useBlockNumber();
  const contract = useMulticallContract();
  const listenerOptions = blocksPerFetch ? { blocksPerFetch } : undefined
  return (
    <multicall.Updater
      chainId={chainId}
      latestBlockNumber={blockNumber}
      contract={contract}
      listenerOptions={listenerOptions}
    />
  )
}