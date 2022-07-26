const localnet = {
    factoryAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    routerAddress: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
    multicallAddress: "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
    dstAddress: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
    usdtAddress: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
    usdcAddress: "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0",
    daiAddress: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
    wdcAddress: "0x9A676e781A523b5d0C0e43731313A708CB607508",
};

const getTokenAddress = (token: string) =>
    (localnet as Record<string, string | undefined>)[`${token.toLowerCase()}Address`];

export const localnetConfig = {
    ...localnet,
    localTokenList: createLocalnetTokenList(),
};
