import { Currency, NativeToken, Token } from "@dogeswap/sdk-core";

export function currencyId(currency: Currency): string {
    if (currency === NativeToken.Instance) return NativeToken.Instance.symbol;
    if (currency instanceof Token) return currency.address;
    throw new Error("invalid currency");
}
