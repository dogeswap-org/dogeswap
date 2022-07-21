import { Interface } from "@ethersproject/abi";
import iUniswapV2Pair from "../../../contracts-core/artifacts/contracts/interfaces/IUniswapV2Pair.sol/IUniswapV2Pair.json";
import iUniswapV2Router02 from "../../../contracts-periphery/artifacts/contracts/interfaces/IUniswapV2Router02.sol/IUniswapV2Router02.json";
import multicall from "../../../contracts-periphery/artifacts/contracts/Multicall.sol/UniswapInterfaceMulticall.json";
import erc20 from "../../../contracts-periphery/artifacts/contracts/tokens/ERC20.sol/ERC20.json";
import wdc from "../../../contracts-periphery/artifacts/contracts/tokens/WDC.sol/WDC.json";

export const erc20Abi = erc20.abi;

export const erc20Interface = new Interface(erc20Abi);

export const wdcAbi = wdc.abi;

export const multicallAbi = multicall.abi;

export const iUniswapV2Router02Abi = iUniswapV2Router02.abi;

export const iUniswapV2PairAbi = iUniswapV2Pair.abi;
