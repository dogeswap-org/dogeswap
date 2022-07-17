import JSBI from 'jsbi'

export const FACTORY_ADDRESS = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'

// TODO DOGESWAP: This may be wrong. Check that pairs can be created. If not, this may need to be changed to refer to the
// hash of a different contract.
export const INIT_CODE_HASH = '0xaae7dc513491fb17b541bd4a9953285ddf2bb20a773374baecc88c4ebada0767'

export const MINIMUM_LIQUIDITY = JSBI.BigInt(1000)

// exports for internal consumption
export const ZERO = JSBI.BigInt(0)
export const ONE = JSBI.BigInt(1)
export const FIVE = JSBI.BigInt(5)
export const _997 = JSBI.BigInt(997)
export const _1000 = JSBI.BigInt(1000)
