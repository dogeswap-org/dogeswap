import { ChainId, Token } from "@dogeswap/sdk-core";

export type ChainTokens<T extends string = string> = { [chainId in ChainId]: Token<T> };
export type ChainContracts = { [chainId in ChainId]: string };

interface InfrastructureAddress {
    factory: string;
    router: string;
    multicall: string;
    ensRegistrar: string;
}

export const addresses = {
    [ChainId.MAINNET]: {
        infrastructure: {
            factory: "0x0000000000000000000000000000000000000000",
            router: "0x0000000000000000000000000000000000000000",
            multicall: "0x0000000000000000000000000000000000000000",
            ensRegistrar: "0x0000000000000000000000000000000000000000",
        } as InfrastructureAddress,
        tokens: {
            wdc: "0x0000000000000000000000000000000000000000",
        },
    },
    [ChainId.TESTNET]: {
        infrastructure: {
            factory: "0x0000000000000000000000000000000000000000",
            router: "0x0000000000000000000000000000000000000000",
            multicall: "0x0000000000000000000000000000000000000000",
            ensRegistrar: "0x0000000000000000000000000000000000000000",
        } as InfrastructureAddress,
        tokens: {
            wdc: "0x0000000000000000000000000000000000000000",
        },
    },
    [ChainId.LOCALNET]: {
        infrastructure: {
            factory: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
            router: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
            multicall: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
            ensRegistrar: "0x0000000000000000000000000000000000000000",
        } as InfrastructureAddress,
        tokens: {
            dst: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
            usdt: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
            usdc: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
            dai: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
            wdc: "0x9A676e781A523b5d0C0e43731313A708CB607508",
        },
    },
};

export const getAddress = (address: keyof InfrastructureAddress, chainId: ChainId | undefined) => {
    return chainId == undefined ? undefined : addresses[chainId]?.infrastructure?.[address];
};
