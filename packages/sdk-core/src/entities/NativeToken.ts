import { BaseCurrency } from "./baseCurrency";
import { Token } from "./token";

export class NativeToken extends BaseCurrency<"WDOGE"> {
    public readonly isNativeToken: true = true;
    public readonly isToken: false = false;

    /**
     * The only instance of the base class `Currency`.
     */
    public static readonly Instance: NativeToken = new NativeToken(18, "WDOGE", "Wrapped Dogecoin");
}

export type WrappedNativeToken = Token<"WWDOGE">;
