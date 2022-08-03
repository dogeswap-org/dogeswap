import { Currency, DOGECHAIN, Token } from "@dogeswap/sdk-core";

export function currencyId(currency: Currency): string {
    if (currency === DOGECHAIN) return DOGECHAIN.symbol;
    if (currency instanceof Token) return currency.address;
    throw new Error("invalid currency");
}
