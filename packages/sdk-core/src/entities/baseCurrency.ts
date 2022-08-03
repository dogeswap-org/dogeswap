import invariant from "tiny-invariant";

/**
 * A currency is any fungible financial instrument on Dogechain, including Dogechain and all ERC20 tokens.
 *
 * The only instance of the base class `Currency` is Dogechain.
 */
export abstract class BaseCurrency<T extends string = string> {
    public abstract readonly isNativeToken: boolean;
    public abstract readonly isToken: boolean;

    public readonly decimals: number;
    public readonly symbol: T;
    public readonly name: string | undefined;

    /**
     * Constructs an instance of the base class `Currency`. The only instance of the base class `Currency` is `Currency.NativeToken.Instance`.
     * @param decimals decimals of the currency
     * @param symbol symbol of the currency
     * @param name of the currency
     */
    protected constructor(decimals: number, symbol: T, name?: string) {
        invariant(decimals >= 0 && decimals < 255 && Number.isInteger(decimals), "DECIMALS");

        this.decimals = decimals;
        this.symbol = symbol;
        this.name = name;
    }
}
