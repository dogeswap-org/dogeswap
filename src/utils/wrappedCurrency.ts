import { ChainId } from "../../../sdk-core/src/constants"
import { Currency } from "../../../sdk-core/src/entities/currency"
import { ETHER } from "../../../sdk-core/src/entities/ether"
import CurrencyAmount from "../../../sdk-core/src/entities/fractions/currencyAmount"
import TokenAmount from "../../../sdk-core/src/entities/fractions/token-amount"
import { Token, WETH } from "../../../sdk-core/src/entities/token"

// TODO DOGESWAP: update this to use DS instead of ETHER and update currency to accept DS instead of ETHER
export function wrappedCurrency(currency: Currency | undefined, chainId: ChainId | undefined): Token | undefined {
  return chainId && currency === ETHER ? WETH[chainId] : currency instanceof Token ? currency : undefined
}

export function wrappedCurrencyAmount(
  currencyAmount: CurrencyAmount | undefined,
  chainId: ChainId | undefined
): TokenAmount | undefined {
  const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId) : undefined
  return token && currencyAmount ? new TokenAmount(token, currencyAmount.raw) : undefined
}

export function unwrappedToken(token: Token): Currency {
  if (token.equals(WETH[token.chainId])) return ETHER
  return token
}
