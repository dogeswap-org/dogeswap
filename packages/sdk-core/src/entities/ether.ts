import { BaseCurrency } from "./baseCurrency";
import { Token } from "./token";

export class DC extends BaseCurrency {
    public readonly isDogechain: true = true;
    public readonly isToken: false = false;

    /**
     * The only instance of the base class `Currency`.
     */
    public static readonly DC: DC = new DC(18, "DC", "Dogechain");
}

export const DOGECHAIN = DC.DC;

export type WDC = Token<"WDC">;
