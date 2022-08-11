import { ChainId, Currency, CurrencyAmount, NativeToken, Token } from "@dogeswap/sdk-core";
import { getToken } from "../../common/tokens";

export function wrappedCurrency(currency: Currency | undefined, chainId: ChainId | undefined): Token | undefined {
    const wrapped = getToken("wwdoge", chainId);
    return chainId && currency === NativeToken.Instance ? wrapped : currency instanceof Token ? currency : undefined;
}

export function wrappedCurrencyAmount(
    currencyAmount: CurrencyAmount | undefined,
    chainId: ChainId | undefined,
): CurrencyAmount | undefined {
    const token = currencyAmount && chainId ? wrappedCurrency(currencyAmount.currency, chainId) : undefined;
    return token && currencyAmount ? new CurrencyAmount(token, currencyAmount.raw) : undefined;
}

export function unwrappedToken(token: Token): Currency {
    const wrapped = getToken("wwdoge", token.chainId);
    if (wrapped != undefined && token.equals(wrapped)) return NativeToken.Instance;
    return token;
}
