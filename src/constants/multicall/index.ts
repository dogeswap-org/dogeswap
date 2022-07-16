import MULTICALL_ABI from "./abi.json";
import { ChainId } from "../../../../sdk-core/src/constants";

// TODO DOGESWAP
const MULTICALL_NETWORKS: { [chainId in ChainId]: string } = {
    [ChainId.MAINNET]: "0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441",
    [ChainId.TESTNET]: "0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441",
    [ChainId.LOCALNET]: "0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441",
};

export { MULTICALL_ABI, MULTICALL_NETWORKS };
