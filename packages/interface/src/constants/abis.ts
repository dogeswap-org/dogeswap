import { ChainId } from "@dogeswap/sdk-core";
import { Interface } from "@ethersproject/abi";

import iDogeSwapV2Pair from "../../../contracts-core/artifacts/contracts/interfaces/IDogeSwapV2Pair.sol/IDogeSwapV2Pair.json";
import erc20 from "../../../contracts-core/artifacts/contracts/interfaces/IERC20.sol/IERC20.json";
import iDogeSwapV2Router02 from "../../../contracts-periphery/artifacts/contracts/interfaces/IDogeSwapV2Router02.sol/IDogeSwapV2Router02.json";
import wdcLocalnet from "../../../contracts-periphery/artifacts/contracts/localnet/WDC.sol/WDC.json";
import multicall from "../../../contracts-periphery/artifacts/contracts/Multicall.sol/DogeSwapInterfaceMulticall.json";

// TODO DOGESWAP: Does this need to be updated per environment?
export const erc20Abi = erc20.abi;

export const erc20Interface = new Interface(erc20Abi);

export const wdcAbiChainMap = {
    [ChainId.MAINNET]: wdcLocalnet.abi,
    [ChainId.TESTNET]: wdcLocalnet.abi,
    [ChainId.LOCALNET]: wdcLocalnet.abi,
};

export const multicallAbi = multicall.abi;

export const iDogeSwapV2Router02Abi = iDogeSwapV2Router02.abi;

export const iDogeSwapV2PairAbi = iDogeSwapV2Pair.abi;
