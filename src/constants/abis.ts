import { Interface } from "@ethersproject/abi";
import multicall from "../../../contracts-periphery/artifacts/contracts/Multicall.sol/Multicall.json";
import erc20 from "../../../contracts-periphery/artifacts/contracts/tokens/ERC20.sol/ERC20.json";
import wdc from "../../../contracts-periphery/artifacts/contracts/tokens/WDC.sol/WDC.json";

export const erc20Abi = erc20.abi;

export const erc20Interface = new Interface(erc20Abi);

export const wdcAbi = wdc.abi;

export const multicallAbi = multicall.abi;
