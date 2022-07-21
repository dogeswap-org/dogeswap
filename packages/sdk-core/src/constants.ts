import JSBI from "jsbi";

// exports for external consumption
export type BigintIsh = JSBI | string | number;

export enum ChainId {
    MAINNET = -1,
    TESTNET = -2,
    LOCALNET = 31337,
}

export enum TradeType {
    EXACT_INPUT,
    EXACT_OUTPUT,
}

export enum Rounding {
    ROUND_DOWN,
    ROUND_HALF_UP,
    ROUND_UP,
}

export const MaxUint256 = JSBI.BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
