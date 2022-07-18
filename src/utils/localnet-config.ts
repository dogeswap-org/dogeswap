import { ChainId } from "../../../sdk-core/src/constants";

const localTokens = {
  WDC: true,
  DST: true,
  USDT: true,
  USDC: true,
  DAI: true,
}

interface LocalnetConfigBase {
  v2FactoryAddress: string;
  v2RouterAddress: string;
  localTokenList?: string;
}

type TokenAddressConfig = { [key in keyof (typeof localTokens) as `${Lowercase<key>}StakingRewardAddress`]: string }

type RewardAddressConfig = { [key in keyof (typeof localTokens) as `${Lowercase<key>}Address`]: string }

type LocalnetConfig = LocalnetConfigBase & TokenAddressConfig & RewardAddressConfig;

const getEnv = (localnetKey: string) => process.env[localnetKey]

const getTokenAddress = (symbol: string) => getEnv(`${symbol}_ADDRESS`);

const createLocalnetTokenListItem = (symbol: string) => ({
  chainId: ChainId.LOCALNET,
  address: getTokenAddress(symbol),
  name: symbol,
  symbol,
  decimals: 18,
  logoURI: "https://assets.coingecko.com/coins/images/4490/thumb/aergo.png?1647696770"
})

const addressConfig = Object.keys(localTokens).reduce<Record<string, string>>((r, x) => {
  r[`${x.toLowerCase()}Address`] = getTokenAddress(x) as string;
  r[`${x.toLowerCase()}StakingRewardAddress`] = getEnv(`${x}_STAKING_REWARD_ADDRESS`) as string;
  return r;
}, {});

const createLocalnetTokenList = () => ({
    name: "Local",
    timestamp: new Date().toISOString(),
    version: {
      major: 0,
      minor: 0,
      patch: 0
    },
    tags: {},
    logoURI: "ipfs://QmNa8mQkrNKp1WEEeGjFezDmDeodkWRevGFN8JCV7b4Xir",
    keywords: [],
    tokens: Object.keys(localTokens).map(x => createLocalnetTokenListItem(x))
})

export const localnetConfig = {
  v2FactoryAddress: getEnv('FACTORY_ADDRESS'),
  v2RouterAddress: getEnv('ROUTER_ADDRESS'),

  ...addressConfig,

  localTokenList: getEnv('LOCAL_TOKEN_LIST') ? createLocalnetTokenList() : undefined
} as LocalnetConfig;