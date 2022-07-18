import { ChainId } from "../../../sdk-core/src/constants";
import { Currency } from "../../../sdk-core/src/entities/currency";
import { DOGECHAIN } from "../../../sdk-core/src/entities/ether";
import CurrencyAmount from "../../../sdk-core/src/entities/fractions/currencyAmount";
import { Token } from "../../../sdk-core/src/entities/token";
import { WDC } from "../constants/addresses";

// TODO DOGESWAP: update this to use DS instead of DOGECHAIN and update currency to accept DS instead of DOGECHAIN
export function wrappedCurrency(currency: Currency | undefined, chainId: ChainId | undefined): Token | undefined {
    return chainId && currency === DOGECHAIN ? WDC[chainId] : currency instanceof Token ? currency : undefined;
}

export function wrappedCurrencyAmount(
    currencyAmount: CurrencyAmount | undefined,
    chainId: ChainId | undefined,
): CurrencyAmount | undefined {
    const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId) : undefined;
    return token && currencyAmount ? new CurrencyAmount(token, currencyAmount.raw) : undefined;
}

export function unwrappedToken(token: Token): Currency {
    if (token.equals(WDC[token.chainId])) return DOGECHAIN;
    return token;
}
